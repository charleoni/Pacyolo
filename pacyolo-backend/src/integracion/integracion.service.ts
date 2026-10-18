import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BorradorIntegracion,
  TipoBorradorIntegracion,
  EstadoBorradorIntegracion,
} from './entities/borrador-integracion.entity.js';
import {
  CuentaPorCobrar,
  EstadoCuentaPorCobrar,
} from '../cxc/entities/cuenta-por-cobrar.entity.js';
import { RecaudoCxc } from '../cxc/entities/recaudo-cxc.entity.js';
import { IngestarFacturaVentaDto, ModoContabilizacion } from './dto/ingestar-factura-venta.dto.js';
import { IngestarRecaudoDto } from './dto/ingestar-recaudo.dto.js';
import { FilterBorradoresDto } from './dto/filter-borradores.dto.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { MapeoService } from '../mapeo/mapeo.service.js';
import { ImpuestosService } from '../impuestos/impuestos.service.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { TipoComprobante, EstadoAsiento } from '../asientos/entities/asiento.entity.js';
import { TipoOperacionTributaria } from '../impuestos/dto/calcular-impuestos.dto.js';
import { CreateAsientoLineaDto } from '../asientos/dto/create-asiento-linea.dto.js';

@Injectable()
export class IntegracionService {
  constructor(
    @InjectRepository(BorradorIntegracion)
    private readonly borradorRepo: Repository<BorradorIntegracion>,
    @InjectRepository(CuentaPorCobrar)
    private readonly cxcRepo: Repository<CuentaPorCobrar>,
    @InjectRepository(RecaudoCxc)
    private readonly recaudoRepo: Repository<RecaudoCxc>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
    private readonly asientosService: AsientosService,
    private readonly mapeoService: MapeoService,
    private readonly impuestosService: ImpuestosService,
  ) {}

  /**
   * Ingesta de Facturas de Venta desde sistemas externos:
   * 1. Idempotencia: Si origen_sistema + origen_documento_id ya existe, retorna el registro existente.
   * 2. Calcula impuestos (IVA generado, autorretenciones/retenciones).
   * 3. Si modo = REVISION_PREVIA, guarda en bandeja de borradores.
   * 4. Si modo = INMEDIATA, crea el Asiento contable de venta y la CuentaPorCobrar (CxC).
   */
  async ingestarFacturaVenta(dto: IngestarFacturaVentaDto): Promise<any> {
    // 1. Validar Idempotencia
    const cxcExistente = await this.cxcRepo.findOne({
      where: {
        empresa_id: dto.empresa_id,
        origen_sistema: dto.origen_sistema,
        origen_documento_id: dto.origen_documento_id,
      },
      relations: {
        asiento: {
          lineas: {
            cuenta: true,
            tercero: true,
          },
        },
        tercero: true,
      },
    });

    if (cxcExistente) {
      return {
        idempotente: true,
        tipo: 'CONTABILIZADO_INMEDIATO',
        cuenta_por_cobrar: cxcExistente,
        asiento: cxcExistente.asiento,
      };
    }

    const borradorExistente = await this.borradorRepo.findOne({
      where: {
        empresa_id: dto.empresa_id,
        origen_sistema: dto.origen_sistema,
        origen_documento_id: dto.origen_documento_id,
      },
      relations: {
        asiento: true,
      },
    });

    if (borradorExistente) {
      return {
        idempotente: true,
        tipo: 'BORRADOR_INTEGRACION',
        borrador: borradorExistente,
      };
    }

    // 2. Validar Tercero / Cliente
    const cliente = await this.terceroRepo.findOne({
      where: { id: dto.cliente_id, empresa_id: dto.empresa_id },
    });
    if (!cliente) {
      throw new NotFoundException(
        `El cliente con ID ${dto.cliente_id} no existe en esta empresa.`,
      );
    }

    // 3. Validar Plantilla de Mapeo del Concepto
    const plantilla = await this.mapeoService.findByCodigo(
      dto.empresa_id,
      dto.codigo_concepto,
    );

    // 4. Calcular Impuestos y Retenciones
    const reglasAplicar =
      dto.reglas_impuestos && dto.reglas_impuestos.length > 0
        ? dto.reglas_impuestos
        : (plantilla.reglas_impuestos_codigos || []).map((codigo) => ({
            regla_id_o_codigo: codigo,
          }));

    const calculo = await this.impuestosService.calcularImpuestos({
      empresa_id: dto.empresa_id,
      subtotal: dto.subtotal,
      tipo_operacion: TipoOperacionTributaria.VENTA_INGRESO,
      reglas: reglasAplicar,
    });

    // Construcción de Líneas Contables de Venta:
    // a. Crédito a Ingresos (Clase 4 - cuenta_credito de la plantilla) por el subtotal
    // b. Crédito a IVA generado (Clase 2408 - de las reglas sugeridas)
    // c. Débito a Retenciones a favor / anticipos (Clase 1355 - si aplican)
    // d. Débito a Cartera / Clientes CxC (Clase 1305 - cuenta_debito de la plantilla) por el Total Neto a cobrar
    const lineas: CreateAsientoLineaDto[] = [];

    // Crédito: Ingreso operacional
    lineas.push({
      cuenta_id: plantilla.cuenta_credito_id,
      tercero_id: dto.cliente_id,
      debito: 0,
      credito: Number(dto.subtotal),
      base_impuesto: 0,
      glosa_detalle: `${plantilla.nombre} - Factura ${dto.numero_factura}`,
      documento_referencia: dto.numero_factura,
    });

    // Líneas sugeridas de IVA y Retenciones
    for (const lineaImp of calculo.lineas_asiento_sugeridas) {
      lineas.push({
        cuenta_id: lineaImp.cuenta_id,
        tercero_id: dto.cliente_id,
        debito: lineaImp.debito,
        credito: lineaImp.credito,
        base_impuesto: lineaImp.base_impuesto,
        glosa_detalle: `${lineaImp.glosa_detalle} - Factura ${dto.numero_factura}`,
        documento_referencia: dto.numero_factura,
      });
    }

    // Débito: Clientes / Cartera CxC (Total neto que el cliente adeuda)
    lineas.push({
      cuenta_id: plantilla.cuenta_debito_id,
      tercero_id: dto.cliente_id,
      debito: calculo.total_neto,
      credito: 0,
      base_impuesto: 0,
      glosa_detalle: `Cartera Clientes - Factura ${dto.numero_factura}`,
      documento_referencia: dto.numero_factura,
      fecha_vencimiento: dto.fecha_vencimiento,
    });

    const modo = dto.modo_contabilizacion ?? ModoContabilizacion.INMEDIATA;

    // 5. Modo REVISION_PREVIA: Guardar en bandeja de borradores
    if (modo === ModoContabilizacion.REVISION_PREVIA) {
      const borrador = this.borradorRepo.create({
        empresa_id: dto.empresa_id,
        tipo_documento: TipoBorradorIntegracion.FACTURA_VENTA,
        origen_sistema: dto.origen_sistema,
        origen_documento_id: dto.origen_documento_id,
        estado: EstadoBorradorIntegracion.PENDIENTE_REVISION,
        payload_datos: dto as any,
        asiento_propuesto: {
          tipo_comprobante: TipoComprobante.CAU,
          fecha_contable: dto.fecha_emision,
          glosa_general:
            dto.observaciones ||
            `Factura de Venta ${dto.numero_factura} a ${cliente.nombre_completo}`,
          subtotal: dto.subtotal,
          total_iva: calculo.total_iva,
          total_retenciones: calculo.total_retenciones,
          total_neto: calculo.total_neto,
          lineas,
        },
      });

      const guardado = await this.borradorRepo.save(borrador);
      return {
        idempotente: false,
        tipo: 'BORRADOR_INTEGRACION',
        borrador: guardado,
      };
    }

    // 6. Modo INMEDIATA: Contabilizar Asiento Oficial y Registrar CxC
    const asiento = await this.asientosService.create({
      empresa_id: dto.empresa_id,
      tipo_comprobante: TipoComprobante.CAU,
      fecha_contable: dto.fecha_emision,
      glosa_general:
        dto.observaciones ||
        `Factura de Venta ${dto.numero_factura} a ${cliente.nombre_completo}`,
      origen_sistema: dto.origen_sistema,
      origen_documento_tipo: 'FACTURA_VENTA',
      origen_documento_id: dto.origen_documento_id,
      lineas,
    });

    const cxc = this.cxcRepo.create({
      empresa_id: dto.empresa_id,
      tercero_id: dto.cliente_id,
      asiento_id: asiento.id,
      cuenta_activo_id: plantilla.cuenta_debito_id,
      numero_factura: dto.numero_factura,
      fecha_emision: dto.fecha_emision,
      fecha_vencimiento: dto.fecha_vencimiento,
      subtotal: Number(dto.subtotal),
      total_impuestos: calculo.total_iva,
      total_retenciones: calculo.total_retenciones,
      total_factura: calculo.total_neto,
      saldo_pendiente: calculo.total_neto,
      estado: EstadoCuentaPorCobrar.PENDIENTE,
      origen_sistema: dto.origen_sistema,
      origen_documento_id: dto.origen_documento_id,
      observaciones: dto.observaciones,
    });

    const cxcGuardada = await this.cxcRepo.save(cxc);

    return {
      idempotente: false,
      tipo: 'CONTABILIZADO_INMEDIATO',
      cuenta_por_cobrar: cxcGuardada,
      asiento,
      calculo_tributario: calculo,
    };
  }

  /**
   * Listar borradores pendientes de revisión con filtros avanzados
   */
  async listarBorradores(empresa_id: string, filter?: FilterBorradoresDto) {
    const qb = this.borradorRepo
      .createQueryBuilder('borrador')
      .leftJoinAndSelect('borrador.asiento', 'asiento')
      .where('borrador.empresa_id = :empresa_id', { empresa_id });

    if (filter?.estado) {
      qb.andWhere('borrador.estado = :estado', { estado: filter.estado });
    }

    if (filter?.tipo_documento) {
      qb.andWhere('borrador.tipo_documento = :tipo_doc', { tipo_doc: filter.tipo_documento });
    }

    if (filter?.origen_sistema) {
      qb.andWhere('borrador.origen_sistema = :origen', { origen: filter.origen_sistema });
    }

    if (filter?.fecha_desde) {
      qb.andWhere('borrador.created_at >= :desde', { desde: `${filter.fecha_desde} 00:00:00` });
    }

    if (filter?.fecha_hasta) {
      qb.andWhere('borrador.created_at <= :hasta', { hasta: `${filter.fecha_hasta} 23:59:59` });
    }

    return await qb.orderBy('borrador.created_at', 'DESC').getMany();
  }

  /**
   * Aprobar un borrador: Genera el comprobante contable y actualiza el documento final (CxC o Recaudo)
   */
  async aprobarBorrador(id: string, revisado_por: string = 'SUPERVISOR') {
    const borrador = await this.borradorRepo.findOne({ where: { id } });
    if (!borrador) {
      throw new NotFoundException(`Borrador con ID ${id} no encontrado.`);
    }

    if (borrador.estado !== EstadoBorradorIntegracion.PENDIENTE_REVISION) {
      throw new BadRequestException(
        `El borrador ya fue procesado con estado: ${borrador.estado}`,
      );
    }

    const propuesto = borrador.asiento_propuesto;

    if (borrador.tipo_documento === TipoBorradorIntegracion.FACTURA_VENTA) {
      const payload = borrador.payload_datos as unknown as IngestarFacturaVentaDto;

      const asiento = await this.asientosService.create({
        empresa_id: borrador.empresa_id,
        tipo_comprobante: propuesto.tipo_comprobante,
        fecha_contable: propuesto.fecha_contable,
        glosa_general: propuesto.glosa_general,
        origen_sistema: borrador.origen_sistema,
        origen_documento_tipo: 'FACTURA_VENTA_APROBADA',
        origen_documento_id: borrador.origen_documento_id,
        lineas: propuesto.lineas,
      });

      const plantilla = await this.mapeoService.findByCodigo(
        borrador.empresa_id,
        payload.codigo_concepto,
      );

      const cxc = this.cxcRepo.create({
        empresa_id: borrador.empresa_id,
        tercero_id: payload.cliente_id,
        asiento_id: asiento.id,
        cuenta_activo_id: plantilla.cuenta_debito_id,
        numero_factura: payload.numero_factura,
        fecha_emision: payload.fecha_emision,
        fecha_vencimiento: payload.fecha_vencimiento,
        subtotal: Number(payload.subtotal),
        total_impuestos: propuesto.total_iva,
        total_retenciones: propuesto.total_retenciones,
        total_factura: propuesto.total_neto,
        saldo_pendiente: propuesto.total_neto,
        estado: EstadoCuentaPorCobrar.PENDIENTE,
        origen_sistema: borrador.origen_sistema,
        origen_documento_id: borrador.origen_documento_id,
        observaciones: payload.observaciones,
      });

      const cxcGuardada = await this.cxcRepo.save(cxc);

      borrador.estado = EstadoBorradorIntegracion.APROBADO;
      borrador.asiento_id = asiento.id;
      borrador.revisado_por = revisado_por;
      borrador.revisado_at = new Date();
      await this.borradorRepo.save(borrador);

      return {
        borrador,
        cuenta_por_cobrar: cxcGuardada,
        asiento,
      };
    } else if (borrador.tipo_documento === TipoBorradorIntegracion.RECAUDO_COBRO) {
      const payload = borrador.payload_datos as unknown as IngestarRecaudoDto;

      const cxc = await this.cxcRepo.findOne({
        where: { id: propuesto.cuenta_por_cobrar_id, empresa_id: borrador.empresa_id },
      });
      if (!cxc) {
        throw new NotFoundException(`La cuenta por cobrar del recaudo ya no existe.`);
      }

      const asiento = await this.asientosService.create({
        empresa_id: borrador.empresa_id,
        tipo_comprobante: propuesto.tipo_comprobante,
        fecha_contable: propuesto.fecha_contable,
        glosa_general: propuesto.glosa_general,
        origen_sistema: borrador.origen_sistema,
        origen_documento_tipo: 'COMPROBANTE_INGRESO_APROBADO',
        origen_documento_id: borrador.origen_documento_id,
        lineas: propuesto.lineas,
      });

      const monto = Number(propuesto.monto_recaudo);
      const nuevoSaldo = Math.round((Number(cxc.saldo_pendiente) - monto) * 100) / 100;
      cxc.saldo_pendiente = nuevoSaldo;
      cxc.estado =
        nuevoSaldo === 0
          ? EstadoCuentaPorCobrar.COBRADA_TOTAL
          : EstadoCuentaPorCobrar.COBRADA_PARCIAL;
      await this.cxcRepo.save(cxc);

      const recaudo = this.recaudoRepo.create({
        empresa_id: borrador.empresa_id,
        cuenta_por_cobrar_id: cxc.id,
        asiento_id: asiento.id,
        cuenta_banco_id: payload.cuenta_banco_id,
        monto_recaudo: monto,
        fecha_recaudo: payload.fecha_recaudo,
        metodo_recaudo: payload.metodo_recaudo,
        referencia_transaccion: payload.referencia_transaccion,
        origen_sistema: borrador.origen_sistema,
        origen_documento_id: borrador.origen_documento_id,
        glosa: payload.glosa,
      });

      const recaudoGuardado = await this.recaudoRepo.save(recaudo);

      borrador.estado = EstadoBorradorIntegracion.APROBADO;
      borrador.asiento_id = asiento.id;
      borrador.revisado_por = revisado_por;
      borrador.revisado_at = new Date();
      await this.borradorRepo.save(borrador);

      return {
        borrador,
        recaudo: recaudoGuardado,
        cuenta_por_cobrar: cxc,
        asiento,
      };
    } else {
      throw new BadRequestException(
        `Tipo de documento '${borrador.tipo_documento}' no soportado para aprobación automática.`,
      );
    }
  }

  /**
   * Rechazar un borrador
   */
  async rechazarBorrador(id: string, motivo: string, revisado_por: string = 'SUPERVISOR') {
    const borrador = await this.borradorRepo.findOne({ where: { id } });
    if (!borrador) {
      throw new NotFoundException(`Borrador con ID ${id} no encontrado.`);
    }

    if (borrador.estado !== EstadoBorradorIntegracion.PENDIENTE_REVISION) {
      throw new BadRequestException(
        `El borrador ya fue procesado con estado: ${borrador.estado}`,
      );
    }

    borrador.estado = EstadoBorradorIntegracion.RECHAZADO;
    borrador.motivo_rechazo = motivo;
    borrador.revisado_por = revisado_por;
    borrador.revisado_at = new Date();

    return await this.borradorRepo.save(borrador);
  }

  /**
   * Ingesta de Recaudos / Cobros desde sistemas externos:
   * 1. Idempotencia: Si origen_sistema + origen_documento_id ya existe, retorna el recaudo existente.
   * 2. Localiza la CxC por cuenta_por_cobrar_id o por numero_factura.
   * 3. Valida que el monto no exceda el saldo pendiente.
   * 4. Valida la cuenta auxiliar de Banco/Caja.
   * 5. Modo REVISION_PREVIA: Guarda en borradores cont_borradores_integracion.
   * 6. Modo INMEDIATA: Genera comprobante de ingreso ING, cancela saldo de cartera y registra cont_recaudos_cxc.
   */
  async ingestarRecaudo(dto: IngestarRecaudoDto): Promise<any> {
    // 1. Validar Idempotencia
    const recaudoExistente = await this.recaudoRepo.findOne({
      where: {
        empresa_id: dto.empresa_id,
        origen_sistema: dto.origen_sistema,
        origen_documento_id: dto.origen_documento_id,
      },
      relations: {
        asiento: true,
        cuenta_por_cobrar: true,
        cuenta_banco: true,
      },
    });

    if (recaudoExistente) {
      return {
        idempotente: true,
        tipo: 'CONTABILIZADO_INMEDIATO',
        recaudo: recaudoExistente,
        asiento: recaudoExistente.asiento,
      };
    }

    const borradorExistente = await this.borradorRepo.findOne({
      where: {
        empresa_id: dto.empresa_id,
        origen_sistema: dto.origen_sistema,
        origen_documento_id: dto.origen_documento_id,
      },
      relations: {
        asiento: true,
      },
    });

    if (borradorExistente) {
      return {
        idempotente: true,
        tipo: 'BORRADOR_INTEGRACION',
        borrador: borradorExistente,
      };
    }

    // 2. Localizar Cuenta por Cobrar
    let cxc: CuentaPorCobrar | null = null;
    if (dto.cuenta_por_cobrar_id) {
      cxc = await this.cxcRepo.findOne({
        where: { id: dto.cuenta_por_cobrar_id, empresa_id: dto.empresa_id },
        relations: { tercero: true, cuenta_activo: true },
      });
    } else if (dto.numero_factura) {
      cxc = await this.cxcRepo.findOne({
        where: { numero_factura: dto.numero_factura, empresa_id: dto.empresa_id },
        relations: { tercero: true, cuenta_activo: true },
      });
    }

    if (!cxc) {
      throw new NotFoundException(
        `No se encontró ninguna Cuenta por Cobrar para la factura especificada en esta empresa.`,
      );
    }

    const saldoPendiente = Number(cxc.saldo_pendiente);
    const monto = Number(dto.monto_recaudo);

    if (saldoPendiente <= 0) {
      throw new BadRequestException(
        `La factura ${cxc.numero_factura} ya se encuentra liquidada en su totalidad (saldo $0.00).`,
      );
    }

    if (monto > saldoPendiente + 0.01) {
      throw new BadRequestException(
        `El monto a recaudar ($${monto.toLocaleString()}) supera el saldo pendiente de la factura ($${saldoPendiente.toLocaleString()}).`,
      );
    }

    // 3. Validar Cuenta de Banco / Caja
    const cuentaBanco = await this.pucRepo.findOne({
      where: { id: dto.cuenta_banco_id, empresa_id: dto.empresa_id },
    });
    if (!cuentaBanco) {
      throw new NotFoundException(
        `La cuenta de banco/caja con ID ${dto.cuenta_banco_id} no existe en esta empresa.`,
      );
    }
    if (!cuentaBanco.permite_movimiento) {
      throw new BadRequestException(
        `La cuenta de tesorería [${cuentaBanco.codigo} - ${cuentaBanco.nombre}] no es auxiliar de movimiento directo.`,
      );
    }

    // 4. Preparar Líneas Contables de Ingreso:
    // - Débito: Cuenta de Tesorería (Banco o Caja donde ingresa el dinero)
    // - Crédito: Cuenta de Cartera Clientes (1305 donde se cancela el derecho de cobro)
    const lineas: CreateAsientoLineaDto[] = [
      {
        cuenta_id: cuentaBanco.id,
        tercero_id: cxc.tercero_id,
        debito: monto,
        credito: 0,
        base_impuesto: 0,
        glosa_detalle: `Ingreso ${dto.metodo_recaudo ?? 'TRANSFERENCIA'}${dto.referencia_transaccion ? ` - Ref: ${dto.referencia_transaccion}` : ''}`,
        documento_referencia: dto.referencia_transaccion ?? cxc.numero_factura,
      },
      {
        cuenta_id: cxc.cuenta_activo_id,
        tercero_id: cxc.tercero_id,
        debito: 0,
        credito: monto,
        base_impuesto: 0,
        glosa_detalle: `Abono/Cancelación Cartera - Fac ${cxc.numero_factura}`,
        documento_referencia: cxc.numero_factura,
      },
    ];

    const modo = dto.modo_contabilizacion ?? ModoContabilizacion.INMEDIATA;

    // 5. Modo REVISION_PREVIA: Guardar en bandeja de borradores
    if (modo === ModoContabilizacion.REVISION_PREVIA) {
      const borrador = this.borradorRepo.create({
        empresa_id: dto.empresa_id,
        tipo_documento: TipoBorradorIntegracion.RECAUDO_COBRO,
        origen_sistema: dto.origen_sistema,
        origen_documento_id: dto.origen_documento_id,
        estado: EstadoBorradorIntegracion.PENDIENTE_REVISION,
        payload_datos: dto as any,
        asiento_propuesto: {
          tipo_comprobante: TipoComprobante.ING,
          fecha_contable: dto.fecha_recaudo,
          glosa_general:
            dto.glosa ||
            `Comprobante de Ingreso - Recaudo Factura ${cxc.numero_factura} de ${cxc.tercero.nombre_completo}`,
          monto_recaudo: monto,
          cuenta_por_cobrar_id: cxc.id,
          lineas,
        },
      });

      const guardado = await this.borradorRepo.save(borrador);
      return {
        idempotente: false,
        tipo: 'BORRADOR_INTEGRACION',
        borrador: guardado,
      };
    }

    // 6. Modo INMEDIATA: Asiento oficial ING y cruce de saldos
    const asientoIngreso = await this.asientosService.create({
      empresa_id: dto.empresa_id,
      tipo_comprobante: TipoComprobante.ING,
      fecha_contable: dto.fecha_recaudo,
      glosa_general:
        dto.glosa ||
        `Comprobante de Ingreso - Recaudo Factura ${cxc.numero_factura} de ${cxc.tercero.nombre_completo}`,
      origen_sistema: dto.origen_sistema,
      origen_documento_tipo: 'COMPROBANTE_INGRESO',
      origen_documento_id:
        dto.referencia_transaccion ??
        `ING-${cxc.numero_factura}-${Date.now()}`,
      lineas,
    });

    const nuevoSaldo = Math.round((saldoPendiente - monto) * 100) / 100;
    cxc.saldo_pendiente = nuevoSaldo;
    cxc.estado =
      nuevoSaldo === 0
        ? EstadoCuentaPorCobrar.COBRADA_TOTAL
        : EstadoCuentaPorCobrar.COBRADA_PARCIAL;

    await this.cxcRepo.save(cxc);

    const recaudo = this.recaudoRepo.create({
      empresa_id: dto.empresa_id,
      cuenta_por_cobrar_id: cxc.id,
      asiento_id: asientoIngreso.id,
      cuenta_banco_id: cuentaBanco.id,
      monto_recaudo: monto,
      fecha_recaudo: dto.fecha_recaudo,
      metodo_recaudo: dto.metodo_recaudo,
      referencia_transaccion: dto.referencia_transaccion,
      origen_sistema: dto.origen_sistema,
      origen_documento_id: dto.origen_documento_id,
      glosa: dto.glosa,
    });

    const recaudoGuardado = await this.recaudoRepo.save(recaudo);

    return {
      idempotente: false,
      tipo: 'CONTABILIZADO_INMEDIATO',
      recaudo: recaudoGuardado,
      asiento: asientoIngreso,
      cuenta_por_cobrar: cxc,
    };
  }

  /**
   * Consultar historial de recaudos de una factura
   */
  async obtenerRecaudosPorCxc(cuenta_por_cobrar_id: string): Promise<RecaudoCxc[]> {
    return await this.recaudoRepo.find({
      where: { cuenta_por_cobrar_id },
      relations: {
        asiento: true,
        cuenta_banco: true,
      },
      order: { created_at: 'DESC' },
    });
  }
}
