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
import { IngestarFacturaVentaDto, ModoContabilizacion } from './dto/ingestar-factura-venta.dto.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { MapeoService } from '../mapeo/mapeo.service.js';
import { ImpuestosService } from '../impuestos/impuestos.service.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
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
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
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
   * Listar borradores pendientes de revisión
   */
  async listarBorradores(empresa_id: string, estado?: EstadoBorradorIntegracion) {
    const where: any = { empresa_id };
    if (estado) {
      where.estado = estado;
    }
    return await this.borradorRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Aprobar un borrador: Genera el comprobante contable y la CxC
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

    const payload = borrador.payload_datos as unknown as IngestarFacturaVentaDto;
    const propuesto = borrador.asiento_propuesto;

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
}
