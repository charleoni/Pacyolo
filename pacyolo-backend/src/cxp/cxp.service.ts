import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuentaPorPagar, EstadoCuentaPorPagar } from './entities/cuenta-por-pagar.entity.js';
import { PagoCxp, MetodoPago } from './entities/pago-cxp.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { MapeoService } from '../mapeo/mapeo.service.js';
import { ImpuestosService } from '../impuestos/impuestos.service.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { TipoOperacionTributaria } from '../impuestos/dto/calcular-impuestos.dto.js';
import { TipoComprobante } from '../asientos/entities/asiento.entity.js';
import { CreateAsientoLineaDto } from '../asientos/dto/create-asiento-linea.dto.js';
import { CausarFacturaCxpDto } from './dto/causar-factura-cxp.dto.js';
import { FilterCxpDto } from './dto/filter-cxp.dto.js';
import { RegistrarPagoCxpDto } from './dto/registrar-pago-cxp.dto.js';

@Injectable()
export class CxpService {
  constructor(
    @InjectRepository(CuentaPorPagar)
    private readonly cxpRepo: Repository<CuentaPorPagar>,
    @InjectRepository(PagoCxp)
    private readonly pagoRepo: Repository<PagoCxp>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
    private readonly mapeoService: MapeoService,
    private readonly impuestosService: ImpuestosService,
    private readonly asientosService: AsientosService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Causa una factura de compra o servicio de un proveedor:
   * 1. Consulta la plantilla de mapeo conceptual.
   * 2. Liquida IVA y retenciones en la fuente con bases mínimas.
   * 3. Asienta el comprobante contable de partida doble (tipo CAU) cuadrado al centavo.
   * 4. Registra la cuenta por pagar con su saldo pendiente por liquidar.
   */
  async causarFactura(dto: CausarFacturaCxpDto): Promise<CuentaPorPagar> {
    const empresa = await this.empresaRepo.findOne({ where: { id: dto.empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${dto.empresa_id} no existe.`);
    }

    const tercero = await this.terceroRepo.findOne({
      where: { id: dto.tercero_id, empresa_id: dto.empresa_id },
    });
    if (!tercero) {
      throw new NotFoundException(`El proveedor con ID ${dto.tercero_id} no pertenece a esta empresa.`);
    }

    const plantilla = await this.mapeoService.findByCodigo(dto.empresa_id, dto.codigo_concepto);
    if (!plantilla.activo) {
      throw new BadRequestException(
        `La plantilla de mapeo '${dto.codigo_concepto}' está desactivada para esta empresa.`,
      );
    }

    const reglasACalcular =
      dto.reglas_impuestos_codigos ?? plantilla.reglas_impuestos_codigos ?? [];

    // Calcular impuestos y retenciones
    const calculo = await this.impuestosService.calcularImpuestos({
      empresa_id: dto.empresa_id,
      tipo_operacion: TipoOperacionTributaria.COMPRA_GASTO,
      subtotal: dto.subtotal,
      reglas: reglasACalcular.map((r) => ({ regla_id_o_codigo: r })),
    });

    // Ensamblar líneas contables de partida doble
    const lineas: CreateAsientoLineaDto[] = [];

    // 1. Débito a cuenta de Gasto o Inventario
    lineas.push({
      cuenta_id: plantilla.cuenta_debito_id,
      tercero_id: dto.tercero_id,
      debito: Number(dto.subtotal),
      credito: 0,
      base_impuesto: 0,
      glosa_detalle: `${plantilla.nombre} - Fac ${dto.numero_factura_proveedor}`,
      documento_referencia: dto.numero_factura_proveedor,
    });

    // 2. Líneas de Impuestos sugeridas (IVA descontable Débito, Retenciones Crédito)
    for (const lineaImp of calculo.lineas_asiento_sugeridas) {
      lineas.push({
        cuenta_id: lineaImp.cuenta_id,
        tercero_id: dto.tercero_id,
        debito: lineaImp.debito,
        credito: lineaImp.credito,
        base_impuesto: lineaImp.base_impuesto,
        glosa_detalle: `${lineaImp.glosa_detalle} - Fac ${dto.numero_factura_proveedor}`,
        documento_referencia: dto.numero_factura_proveedor,
      });
    }

    // 3. Crédito a Cuenta por Pagar a Proveedores por el Total Neto
    lineas.push({
      cuenta_id: plantilla.cuenta_credito_id,
      tercero_id: dto.tercero_id,
      debito: 0,
      credito: calculo.total_neto,
      base_impuesto: 0,
      glosa_detalle: `CxP Proveedor - Fac ${dto.numero_factura_proveedor}`,
      documento_referencia: dto.numero_factura_proveedor,
      fecha_vencimiento: dto.fecha_vencimiento,
    });

    // Registrar Asiento contable oficial
    const asiento = await this.asientosService.create({
      empresa_id: dto.empresa_id,
      tipo_comprobante: TipoComprobante.CAU,
      fecha_contable: dto.fecha_emision,
      glosa_general:
        dto.glosa ||
        `Causación Factura Proveedor ${dto.numero_factura_proveedor} - ${plantilla.nombre}`,
      origen_sistema: 'CXP',
      origen_documento_tipo: 'FACTURA_COMPRA',
      origen_documento_id: dto.numero_factura_proveedor,
      lineas,
    });

    // Crear registro en cont_cuentas_por_pagar
    const cxp = this.cxpRepo.create({
      empresa_id: dto.empresa_id,
      tercero_id: dto.tercero_id,
      asiento_id: asiento.id,
      cuenta_pasivo_id: plantilla.cuenta_credito_id,
      numero_factura_proveedor: dto.numero_factura_proveedor,
      fecha_emision: dto.fecha_emision,
      fecha_vencimiento: dto.fecha_vencimiento,
      subtotal: dto.subtotal,
      total_iva: calculo.total_iva,
      total_retenciones: calculo.total_retenciones,
      monto_total: calculo.total_neto,
      saldo_pendiente: calculo.total_neto,
      estado: EstadoCuentaPorPagar.PENDIENTE,
      glosa: dto.glosa || `Factura ${dto.numero_factura_proveedor}`,
    });

    const guardada = await this.cxpRepo.save(cxp);

    return await this.findOne(guardada.id);
  }

  async findAll(filter: FilterCxpDto): Promise<CuentaPorPagar[]> {
    const query = this.cxpRepo
      .createQueryBuilder('cxp')
      .leftJoinAndSelect('cxp.tercero', 'tercero')
      .leftJoinAndSelect('cxp.cuenta_pasivo', 'cuenta_pasivo')
      .leftJoinAndSelect('cxp.asiento', 'asiento')
      .leftJoinAndSelect('asiento.lineas', 'lineas')
      .leftJoinAndSelect('lineas.cuenta', 'cuenta')
      .leftJoinAndSelect('lineas.tercero', 'linea_tercero')
      .where('cxp.empresa_id = :empresa_id', { empresa_id: filter.empresa_id });

    if (filter.tercero_id) {
      query.andWhere('cxp.tercero_id = :tercero_id', { tercero_id: filter.tercero_id });
    }

    if (filter.estado) {
      query.andWhere('cxp.estado = :estado', { estado: filter.estado });
    }

    if (filter.vencidas_solo) {
      query.andWhere('cxp.fecha_vencimiento < CURRENT_DATE');
      query.andWhere('cxp.estado IN (:...estados)', {
        estados: [EstadoCuentaPorPagar.PENDIENTE, EstadoCuentaPorPagar.PAGADA_PARCIAL],
      });
    }

    return await query
      .orderBy('cxp.fecha_vencimiento', 'ASC')
      .addOrderBy('cxp.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<CuentaPorPagar> {
    const cxp = await this.cxpRepo.findOne({
      where: { id },
      relations: {
        tercero: true,
        cuenta_pasivo: true,
        asiento: {
          lineas: {
            cuenta: true,
          },
        },
      },
    });

    if (!cxp) {
      throw new NotFoundException(`La cuenta por pagar con ID ${id} no existe.`);
    }

    return cxp;
  }

  /**
   * Genera el resumen consolidado de cartera de proveedores (por vencer vs vencida).
   */
  async obtenerResumenCartera(empresa_id: string): Promise<{
    empresa_id: string;
    total_cartera: number;
    total_por_vencer: number;
    total_vencida: number;
    total_facturas_pendientes: number;
  }> {
    const facturas = await this.cxpRepo.find({
      where: {
        empresa_id,
        estado: EstadoCuentaPorPagar.PENDIENTE,
      },
    });

    const hoy = new Date().toISOString().slice(0, 10);
    let totalCartera = 0;
    let totalPorVencer = 0;
    let totalVencida = 0;

    for (const f of facturas) {
      const saldo = Number(f.saldo_pendiente);
      totalCartera += saldo;

      if (f.fecha_vencimiento < hoy) {
        totalVencida += saldo;
      } else {
        totalPorVencer += saldo;
      }
    }

    return {
      empresa_id,
      total_cartera: Math.round(totalCartera * 100) / 100,
      total_por_vencer: Math.round(totalPorVencer * 100) / 100,
      total_vencida: Math.round(totalVencida * 100) / 100,
      total_facturas_pendientes: facturas.length,
    };
  }

  /**
   * Registra un pago total o parcial de una factura:
   * 1. Valida saldo disponible.
   * 2. Valida cuenta de banco/caja auxiliar.
   * 3. Asienta comprobante de egreso (tipo EGR) con partida doble exacta.
   * 4. Descuenta el saldo pendiente y actualiza estado (PAGADA_PARCIAL o PAGADA_TOTAL).
   * 5. Registra el detalle del pago en cont_pagos_cxp.
   */
  async registrarPago(dto: RegistrarPagoCxpDto): Promise<PagoCxp> {
    const cxp = await this.cxpRepo.findOne({
      where: { id: dto.cuenta_por_pagar_id, empresa_id: dto.empresa_id },
      relations: {
        tercero: true,
        cuenta_pasivo: true,
      },
    });

    if (!cxp) {
      throw new NotFoundException(`La cuenta por pagar con ID ${dto.cuenta_por_pagar_id} no existe.`);
    }

    if (cxp.estado === EstadoCuentaPorPagar.PAGADA_TOTAL) {
      throw new BadRequestException('Esta factura ya se encuentra pagada en su totalidad.');
    }

    if (cxp.estado === EstadoCuentaPorPagar.ANULADA) {
      throw new BadRequestException('No se puede realizar pagos a una factura anulada.');
    }

    const saldoPendiente = Number(cxp.saldo_pendiente);
    const montoPago = Math.round(Number(dto.monto_pago) * 100) / 100;

    if (montoPago > saldoPendiente) {
      throw new BadRequestException(
        `El monto a pagar ($${montoPago.toLocaleString('es-CO')}) no puede exceder el saldo pendiente ($${saldoPendiente.toLocaleString('es-CO')}).`,
      );
    }

    const cuentaBanco = await this.pucRepo.findOne({ where: { id: dto.cuenta_banco_id } });
    if (!cuentaBanco) {
      throw new NotFoundException(`La cuenta bancaria con ID ${dto.cuenta_banco_id} no existe.`);
    }
    if (cuentaBanco.empresa_id !== dto.empresa_id) {
      throw new BadRequestException('La cuenta bancaria no pertenece a esta empresa.');
    }
    if (!cuentaBanco.permite_movimiento) {
      throw new BadRequestException(
        `La cuenta '${cuentaBanco.codigo} - ${cuentaBanco.nombre}' no es auxiliar y no permite movimientos.`,
      );
    }

    // Línea 1 (Débito): Disminuye el pasivo de proveedores
    // Línea 2 (Crédito): Disminuye el activo en bancos/caja
    const lineas: CreateAsientoLineaDto[] = [
      {
        cuenta_id: cxp.cuenta_pasivo_id,
        tercero_id: cxp.tercero_id,
        debito: montoPago,
        credito: 0,
        base_impuesto: 0,
        glosa_detalle: `Abono/Pago Fac ${cxp.numero_factura_proveedor} - ${cxp.tercero.nombre_completo}`,
        documento_referencia: cxp.numero_factura_proveedor,
      },
      {
        cuenta_id: dto.cuenta_banco_id,
        tercero_id: cxp.tercero_id,
        debito: 0,
        credito: montoPago,
        base_impuesto: 0,
        glosa_detalle: `Desembolso ${dto.metodo_pago ?? 'TRANSFERENCIA'}${dto.referencia_transaccion ? ` - Ref: ${dto.referencia_transaccion}` : ''}`,
        documento_referencia: dto.referencia_transaccion ?? cxp.numero_factura_proveedor,
      },
    ];

    const asientoEgreso = await this.asientosService.create({
      empresa_id: dto.empresa_id,
      tipo_comprobante: TipoComprobante.EGR,
      fecha_contable: dto.fecha_pago,
      glosa_general:
        dto.glosa ||
        `Comprobante de Egreso - Pago Factura ${cxp.numero_factura_proveedor} a ${cxp.tercero.nombre_completo}`,
      origen_sistema: 'CXP',
      origen_documento_tipo: 'COMPROBANTE_EGRESO',
      origen_documento_id:
        dto.referencia_transaccion ??
        `EGR-${cxp.numero_factura_proveedor}-${Date.now()}`,
      lineas,
      created_by: dto.usuario_id,
    });

    const nuevoSaldo = Math.round((saldoPendiente - montoPago) * 100) / 100;
    cxp.saldo_pendiente = nuevoSaldo;
    cxp.estado =
      nuevoSaldo === 0
        ? EstadoCuentaPorPagar.PAGADA_TOTAL
        : EstadoCuentaPorPagar.PAGADA_PARCIAL;

    await this.cxpRepo.save(cxp);

    const pago = this.pagoRepo.create({
      empresa_id: dto.empresa_id,
      cuenta_por_pagar_id: cxp.id,
      asiento_id: asientoEgreso.id,
      cuenta_banco_id: dto.cuenta_banco_id,
      monto_pagado: montoPago,
      fecha_pago: dto.fecha_pago,
      metodo_pago: dto.metodo_pago ?? MetodoPago.TRANSFERENCIA,
      referencia_transaccion: dto.referencia_transaccion ?? null,
      glosa: dto.glosa ?? null,
      estado: 'APLICADO',
      usuario_id: dto.usuario_id || null,
    });

    const guardado = await this.pagoRepo.save(pago);

    // Pista de auditoría obligatoria de pago
    try {
      await this.auditoriaService.registrarLog({
        empresa_id: dto.empresa_id,
        usuario_id: dto.usuario_id || null,
        usuario_email: dto.creado_por || 'sistema@pacyolo.com',
        modulo: 'CXP',
        accion: 'REGISTRAR_PAGO',
        entidad_id: guardado.id,
        ruta: '/api/v1/cxp/pagar',
        datos_nuevos: {
          factura_proveedor: cxp.numero_factura_proveedor,
          tercero: cxp.tercero.nombre_completo,
          monto_pagado: montoPago,
          metodo_pago: dto.metodo_pago,
          comprobante_egreso: asientoEgreso.numero_comprobante,
          saldo_restante: nuevoSaldo,
        },
      });
    } catch (auditErr: any) {
      console.error('Error registrando auditoría de pago:', auditErr.message);
    }

    const res = await this.pagoRepo.findOne({
      where: { id: guardado.id },
      relations: {
        asiento: true,
        cuenta_banco: true,
        cuenta_por_pagar: true,
      },
    });

    return res as PagoCxp;
  }

  async listarPagos(cuenta_por_pagar_id: string): Promise<PagoCxp[]> {
    return await this.pagoRepo.find({
      where: { cuenta_por_pagar_id },
      relations: {
        asiento: {
          lineas: {
            cuenta: true,
            tercero: true,
          },
        },
        cuenta_banco: true,
        cuenta_por_pagar: {
          tercero: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  async anularPago(id: string, motivo: string, usuarioId?: string, usuarioEmail?: string): Promise<PagoCxp> {
    const pago = await this.pagoRepo.findOne({
      where: { id },
      relations: {
        cuenta_por_pagar: {
          tercero: true,
        },
        asiento: true,
      },
    });

    if (!pago) {
      throw new NotFoundException(`El pago con ID '${id}' no existe.`);
    }

    if (pago.estado === 'ANULADO') {
      throw new BadRequestException('Este pago ya se encuentra anulado.');
    }

    const cxp = pago.cuenta_por_pagar;
    if (!cxp) {
      throw new BadRequestException('No se encontró la factura por pagar vinculada a este pago.');
    }

    // 1. Revertir saldo pendiente de la cuenta por pagar
    const saldoAnterior = Number(cxp.saldo_pendiente);
    const montoReversado = Number(pago.monto_pagado);
    const totalFactura = Number(cxp.monto_total);
    const nuevoSaldo = Math.round((saldoAnterior + montoReversado) * 100) / 100;

    cxp.saldo_pendiente = nuevoSaldo;
    cxp.estado =
      nuevoSaldo >= totalFactura
        ? EstadoCuentaPorPagar.PENDIENTE
        : EstadoCuentaPorPagar.PAGADA_PARCIAL;

    await this.cxpRepo.save(cxp);

    // 2. Anular comprobante contable de egreso oficial (EGR)
    if (pago.asiento_id) {
      try {
        await this.asientosService.anular(
          pago.asiento_id,
          `Anulación de pago de factura ${cxp.numero_factura_proveedor}: ${motivo}`,
          usuarioId,
          true,
        );
      } catch (err: any) {
        console.error(`Error anulando asiento ${pago.asiento_id} de pago cxp:`, err.message);
      }
    }

    // 3. Marcar pago como ANULADO
    pago.estado = 'ANULADO';
    pago.motivo_anulacion = motivo;
    pago.anulado_at = new Date();
    pago.anulado_por = usuarioId || null;
    await this.pagoRepo.save(pago);

    // 4. Registrar pista de auditoría inmutable
    try {
      await this.auditoriaService.registrarLog({
        empresa_id: pago.empresa_id,
        usuario_id: usuarioId || null,
        usuario_email: usuarioEmail || 'sistema@pacyolo.com',
        modulo: 'CXP',
        accion: 'ANULAR_PAGO',
        entidad_id: pago.id,
        ruta: `/api/v1/cxp/pagos/${id}/anular`,
        datos_nuevos: {
          factura_proveedor: cxp.numero_factura_proveedor,
          monto_reversado: montoReversado,
          nuevo_saldo_cxp: nuevoSaldo,
          motivo,
        },
      });
    } catch (auditErr: any) {
      console.error('Error registrando auditoría de anulación de pago:', auditErr.message);
    }

    return pago;
  }

  // =========================================================================
  // REPORTES ANALÍTICOS DE CXP & PROVEEDORES (SPRINT 8)
  // =========================================================================

  async obtenerEstadoCuentaProveedor(empresaId: string, proveedorId: string): Promise<any> {
    const proveedor = await this.terceroRepo.findOne({ where: { id: proveedorId, empresa_id: empresaId } });
    if (!proveedor) {
      throw new NotFoundException(`El proveedor con ID ${proveedorId} no existe.`);
    }

    const facturas = await this.cxpRepo.find({
      where: {
        empresa_id: empresaId,
        tercero_id: proveedorId,
      },
      relations: { asiento: true },
      order: { fecha_vencimiento: 'ASC' },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let saldoTotal = 0;
    let totalVencido = 0;
    let totalCorriente = 0;

    const facturasDetalle = facturas.map((f) => {
      const saldo = Number(f.saldo_pendiente);
      const fechaVenc = new Date(f.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);

      const diffTime = hoy.getTime() - fechaVenc.getTime();
      const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diasMora = diffDias > 0 ? diffDias : 0;
      const esVencida = diffDias > 0 && saldo > 0;

      saldoTotal += saldo;
      if (esVencida) {
        totalVencido += saldo;
      } else {
        totalCorriente += saldo;
      }

      return {
        id: f.id,
        numero_factura_proveedor: f.numero_factura_proveedor,
        fecha_emision: f.fecha_emision,
        fecha_vencimiento: f.fecha_vencimiento,
        subtotal: Number(f.subtotal),
        total_impuestos: Number((Number(f.total_iva || 0) + Number(f.total_retenciones || 0)).toFixed(2)),
        total_factura: Number(f.monto_total),
        abonos: Number((Number(f.monto_total) - saldo).toFixed(2)),
        saldo_pendiente: saldo,
        dias_mora: diasMora,
        es_vencida: esVencida,
        estado: f.estado,
        comprobante: f.asiento?.numero_comprobante || null,
      };
    });

    return {
      proveedor: {
        id: proveedor.id,
        numero_identificacion: proveedor.numero_identificacion,
        dv: proveedor.digito_verificacion ?? null,
        nombre_completo: proveedor.nombre_completo,
        email: proveedor.email,
        telefono: proveedor.telefono,
        direccion: proveedor.direccion,
      },
      resumen: {
        saldo_total: Number(saldoTotal.toFixed(2)),
        total_vencido: Number(totalVencido.toFixed(2)),
        total_corriente: Number(totalCorriente.toFixed(2)),
        conteo_facturas: facturas.length,
        conteo_pendientes: facturas.filter((f) => Number(f.saldo_pendiente) > 0).length,
      },
      facturas: facturasDetalle,
    };
  }

  async obtenerExtractoProveedor(empresaId: string, proveedorId: string, desde?: string, hasta?: string): Promise<any> {
    const proveedor = await this.terceroRepo.findOne({ where: { id: proveedorId, empresa_id: empresaId } });
    if (!proveedor) {
      throw new NotFoundException(`El proveedor con ID ${proveedorId} no existe.`);
    }

    const qbFacturas = this.cxpRepo.createQueryBuilder('cxp')
      .leftJoinAndSelect('cxp.asiento', 'asiento')
      .where('cxp.empresa_id = :empresaId AND cxp.tercero_id = :proveedorId', { empresaId, proveedorId });
    if (desde) qbFacturas.andWhere('cxp.fecha_emision >= :desde', { desde });
    if (hasta) qbFacturas.andWhere('cxp.fecha_emision <= :hasta', { hasta });
    const facturas = await qbFacturas.getMany();

    const qbPagos = this.pagoRepo.createQueryBuilder('pago')
      .leftJoinAndSelect('pago.asiento', 'asiento')
      .leftJoinAndSelect('pago.cuenta_por_pagar', 'cxp')
      .where('pago.empresa_id = :empresaId AND cxp.tercero_id = :proveedorId', { empresaId, proveedorId });
    if (desde) qbPagos.andWhere('pago.fecha_pago >= :desde', { desde });
    if (hasta) qbPagos.andWhere('pago.fecha_pago <= :hasta', { hasta });
    const pagos = await qbPagos.getMany();

    const movimientos: any[] = [];

    for (const f of facturas) {
      movimientos.push({
        id: f.id,
        tipo: 'FACTURA_COMPRA',
        fecha: f.fecha_emision,
        documento_referencia: f.numero_factura_proveedor,
        comprobante: f.asiento?.numero_comprobante || null,
        concepto: `Causación Factura Proveedor ${f.numero_factura_proveedor}`,
        debito: 0,
        credito: Number(f.monto_total),
      });
    }

    for (const p of pagos) {
      movimientos.push({
        id: p.id,
        tipo: 'PAGO_EGRESO',
        fecha: p.fecha_pago,
        documento_referencia: p.referencia_transaccion || `PAGO-${p.id.slice(0, 8)}`,
        comprobante: p.asiento?.numero_comprobante || null,
        concepto: p.glosa || `Pago Factura ${p.cuenta_por_pagar?.numero_factura_proveedor}`,
        debito: Number(p.monto_pagado),
        credito: 0,
      });
    }

    movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldoAcumulado = 0;
    const movimientosConSaldo = movimientos.map((m) => {
      saldoAcumulado = Number((saldoAcumulado + m.credito - m.debito).toFixed(2));
      return {
        ...m,
        saldo_acumulado: saldoAcumulado,
      };
    });

    return {
      proveedor: {
        id: proveedor.id,
        numero_identificacion: proveedor.numero_identificacion,
        dv: proveedor.digito_verificacion ?? null,
        nombre_completo: proveedor.nombre_completo,
      },
      desde: desde || null,
      hasta: hasta || null,
      total_cargos_facturas: Number(facturas.reduce((acc, f) => acc + Number(f.monto_total), 0).toFixed(2)),
      total_abonos_pagos: Number(pagos.reduce((acc, p) => acc + Number(p.monto_pagado), 0).toFixed(2)),
      saldo_final: saldoAcumulado,
      movimientos: movimientosConSaldo,
    };
  }

  async obtenerAnalisisEdadesCartera(empresaId: string): Promise<any> {
    const facturas = await this.cxpRepo.find({
      where: { empresa_id: empresaId },
      relations: { tercero: true },
      order: { fecha_vencimiento: 'ASC' },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proveedoresMap = new Map<string, any>();

    let totalGlobalCorriente = 0;
    let totalGlobal1a30 = 0;
    let totalGlobal31a60 = 0;
    let totalGlobal61a90 = 0;
    let totalGlobalMas90 = 0;
    let totalGlobalDeuda = 0;

    for (const f of facturas) {
      const saldo = Number(f.saldo_pendiente);
      if (saldo <= 0) continue;

      const provId = f.tercero_id;
      if (!proveedoresMap.has(provId)) {
        proveedoresMap.set(provId, {
          proveedor_id: provId,
          numero_identificacion: f.tercero?.numero_identificacion || '',
          dv: f.tercero?.digito_verificacion ?? null,
          nombre_completo: f.tercero?.nombre_completo || 'Proveedor Desconocido',
          corriente: 0,
          dias_1_30: 0,
          dias_31_60: 0,
          dias_61_90: 0,
          dias_mas_90: 0,
          total_proveedor: 0,
          facturas_abiertas: 0,
        });
      }

      const provData = proveedoresMap.get(provId);
      provData.facturas_abiertas += 1;
      provData.total_proveedor = Number((provData.total_proveedor + saldo).toFixed(2));
      totalGlobalDeuda = Number((totalGlobalDeuda + saldo).toFixed(2));

      const fechaVenc = new Date(f.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diffTime = hoy.getTime() - fechaVenc.getTime();
      const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDias <= 0) {
        provData.corriente = Number((provData.corriente + saldo).toFixed(2));
        totalGlobalCorriente = Number((totalGlobalCorriente + saldo).toFixed(2));
      } else if (diffDias <= 30) {
        provData.dias_1_30 = Number((provData.dias_1_30 + saldo).toFixed(2));
        totalGlobal1a30 = Number((totalGlobal1a30 + saldo).toFixed(2));
      } else if (diffDias <= 60) {
        provData.dias_31_60 = Number((provData.dias_31_60 + saldo).toFixed(2));
        totalGlobal31a60 = Number((totalGlobal31a60 + saldo).toFixed(2));
      } else if (diffDias <= 90) {
        provData.dias_61_90 = Number((provData.dias_61_90 + saldo).toFixed(2));
        totalGlobal61a90 = Number((totalGlobal61a90 + saldo).toFixed(2));
      } else {
        provData.dias_mas_90 = Number((provData.dias_mas_90 + saldo).toFixed(2));
        totalGlobalMas90 = Number((totalGlobalMas90 + saldo).toFixed(2));
      }
    }

    const proveedores = Array.from(proveedoresMap.values()).sort(
      (a, b) => b.total_proveedor - a.total_proveedor,
    );

    return {
      totales_globales: {
        total_corriente: totalGlobalCorriente,
        total_1_a_30: totalGlobal1a30,
        total_31_a_60: totalGlobal31a60,
        total_61_a_90: totalGlobal61a90,
        total_mas_90: totalGlobalMas90,
        total_cartera: totalGlobalDeuda,
        conteo_proveedores: proveedores.length,
      },
      proveedores,
    };
  }
}

