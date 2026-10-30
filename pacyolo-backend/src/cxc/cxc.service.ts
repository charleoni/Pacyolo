import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import {
  CuentaPorCobrar,
  EstadoCuentaPorCobrar,
} from './entities/cuenta-por-cobrar.entity.js';
import { RecaudoCxc } from './entities/recaudo-cxc.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta, ClaseCuenta } from '../puc/entities/puc.entity.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { TipoComprobante } from '../asientos/entities/asiento.entity.js';
import { RegistrarRecaudoDto } from './dto/cxc.dto.js';

@Injectable()
export class CxcService {
  constructor(
    @InjectRepository(CuentaPorCobrar)
    private readonly cxcRepo: Repository<CuentaPorCobrar>,
    @InjectRepository(RecaudoCxc)
    private readonly recaudoRepo: Repository<RecaudoCxc>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
    private readonly asientosService: AsientosService,
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  async listarCartera(
    empresaId: string,
    search?: string,
    estado?: string,
  ): Promise<{
    items: CuentaPorCobrar[];
    resumen: {
      totalCartera: number;
      totalCorriente: number;
      totalVencido: number;
    };
  }> {
    const qb = this.cxcRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tercero', 't')
      .leftJoinAndSelect('c.asiento', 'a')
      .leftJoinAndSelect('c.cuenta_activo', 'ca')
      .where('c.empresa_id = :empresaId', { empresaId });

    if (estado && estado !== 'TODOS') {
      qb.andWhere('c.estado = :estado', { estado });
    }

    if (search && search.trim()) {
      qb.andWhere(
        '(c.numero_factura ILIKE :search OR t.razon_social ILIKE :search OR t.numero_identificacion ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    const items = await qb.orderBy('c.fecha_vencimiento', 'ASC').getMany();

    const hoy = new Date().toISOString().split('T')[0];
    let totalCartera = 0;
    let totalCorriente = 0;
    let totalVencido = 0;

    for (const item of items) {
      if (item.estado !== EstadoCuentaPorCobrar.ANULADA) {
        const saldo = Number(item.saldo_pendiente || 0);
        totalCartera += saldo;
        if (item.fecha_vencimiento < hoy && saldo > 0) {
          totalVencido += saldo;
        } else {
          totalCorriente += saldo;
        }
      }
    }

    return {
      items,
      resumen: {
        totalCartera: Number(totalCartera.toFixed(2)),
        totalCorriente: Number(totalCorriente.toFixed(2)),
        totalVencido: Number(totalVencido.toFixed(2)),
      },
    };
  }

  async registrarRecaudo(
    empresaId: string,
    dto: RegistrarRecaudoDto,
    usuario?: any,
  ): Promise<RecaudoCxc> {
    const cxc = await this.cxcRepo.findOne({
      where: { id: dto.cuenta_por_cobrar_id, empresa_id: empresaId },
      relations: { tercero: true, cuenta_activo: true },
    });

    if (!cxc) {
      throw new NotFoundException(`La cuenta por cobrar no existe.`);
    }

    if (cxc.estado === EstadoCuentaPorCobrar.COBRADA_TOTAL || cxc.estado === EstadoCuentaPorCobrar.ANULADA) {
      throw new BadRequestException(`La factura ya se encuentra totalmente recaudada o anulada.`);
    }

    const monto = Number(dto.monto_recaudo);
    const descuento = Number(dto.descuento_pronto_pago || 0);
    const totalAbono = Number((monto + descuento).toFixed(2));
    const saldoActual = Number(cxc.saldo_pendiente);

    if (totalAbono > saldoActual + 0.01) {
      throw new BadRequestException(
        `El total abonado ($${totalAbono.toLocaleString()} = Recaudo $${monto.toLocaleString()} + Descuento $${descuento.toLocaleString()}) supera el saldo pendiente ($${saldoActual.toLocaleString()}).`,
      );
    }

    const cuentaBanco = await this.pucRepo.findOne({
      where: { id: dto.cuenta_banco_id, empresa_id: empresaId },
    });
    if (!cuentaBanco) {
      throw new NotFoundException(`La cuenta auxiliar de Caja/Banco no existe.`);
    }

    // 1. Contabilizar Comprobante de Ingreso (ING)
    const lineasAsiento: any[] = [
      {
        cuenta_id: cuentaBanco.id,
        tercero_id: cxc.tercero_id,
        debito: monto,
        credito: 0,
        glosa_detalle: `Ingreso a ${cuentaBanco.nombre} por recaudo ${cxc.numero_factura}`,
      },
    ];

    if (descuento > 0) {
      const cuentaDescuento = await this.buscarCuentaPuc(
        empresaId,
        ['530535', '5305', '53'],
        ClaseCuenta.GASTO,
      );
      lineasAsiento.push({
        cuenta_id: cuentaDescuento.id,
        tercero_id: cxc.tercero_id,
        debito: descuento,
        credito: 0,
        glosa_detalle: `Descuento financiero por pronto pago factura ${cxc.numero_factura}`,
      });
    }

    lineasAsiento.push({
      cuenta_id: cxc.cuenta_activo_id,
      tercero_id: cxc.tercero_id,
      debito: 0,
      credito: totalAbono,
      glosa_detalle: `Abono a cartera clientes factura ${cxc.numero_factura}`,
    });

    const asiento = await this.asientosService.create({
      empresa_id: empresaId,
      tipo_comprobante: TipoComprobante.ING,
      fecha_contable: dto.fecha_recaudo,
      origen_sistema: 'CXC',
      origen_documento_tipo: 'RECAUDO_CARTERA',
      origen_documento_id: cxc.id,
      glosa_general: `Recaudo de cartera factura ${cxc.numero_factura} - ${cxc.tercero?.razon_social}${
        descuento > 0 ? ` (Dcto Pronto Pago: $${descuento})` : ''
      }`,
      origen_sistema: 'RECAUDO_CXC',
      origen_documento_id: cxc.id,
      lineas: lineasAsiento,
    });

    // 2. Registrar el Recaudo
    const recaudo = this.recaudoRepo.create({
      empresa_id: empresaId,
      cuenta_por_cobrar_id: cxc.id,
      asiento_id: asiento.id,
      cuenta_banco_id: cuentaBanco.id,
      monto_recaudo: monto,
      descuento_pronto_pago: descuento,
      fecha_recaudo: dto.fecha_recaudo,
      metodo_recaudo: dto.metodo_recaudo,
      referencia_transaccion: dto.referencia_transaccion || `ING-${cxc.numero_factura}`,
      origen_sistema: 'CXC_PACYOLO',
      origen_documento_id: cxc.id,
      glosa: dto.glosa || `Recaudo factura ${cxc.numero_factura}`,
    });
    const recaudoGuardado = await this.recaudoRepo.save(recaudo);

    // 3. Actualizar saldo y estado de cartera
    const nuevoSaldo = Math.max(0, Number((saldoActual - totalAbono).toFixed(2)));
    cxc.saldo_pendiente = nuevoSaldo;
    cxc.estado = nuevoSaldo <= 0.01 ? EstadoCuentaPorCobrar.COBRADA_TOTAL : EstadoCuentaPorCobrar.COBRADA_PARCIAL;
    await this.cxcRepo.save(cxc);

    // 4. Auditoría inmutable
    try {
      await this.auditoriaService.registrarLog({
        empresa_id: empresaId,
        usuario_id: usuario?.id,
        usuario_email: usuario?.email || 'sistema',
        accion: 'REGISTRAR_RECAUDO_CXC',
        modulo: 'CXC',
        entidad_id: recaudoGuardado.id,
        datos_nuevos: {
          numero_factura: cxc.numero_factura,
          cliente: cxc.tercero?.razon_social,
          monto_recaudo: monto,
          descuento_pronto_pago: descuento,
          total_abonado: totalAbono,
          nuevo_saldo: nuevoSaldo,
          asiento_id: asiento.id,
        },
      });
    } catch (e) {
      // ignore
    }

    return recaudoGuardado;
  }

  async listarRecaudosPorFactura(empresaId: string, cxcId: string): Promise<RecaudoCxc[]> {
    return await this.recaudoRepo.find({
      where: { empresa_id: empresaId, cuenta_por_cobrar_id: cxcId },
      relations: { cuenta_banco: true, asiento: true },
      order: { fecha_recaudo: 'DESC' },
    });
  }

  async anularRecaudo(empresaId: string, recaudoId: string, motivo: string, usuario?: any): Promise<void> {
    const recaudo = await this.recaudoRepo.findOne({
      where: { id: recaudoId, empresa_id: empresaId },
      relations: { cuenta_por_cobrar: true },
    });

    if (!recaudo) {
      throw new NotFoundException(`El recibo de recaudo no existe.`);
    }

    // Anular asiento
    if (recaudo.asiento_id) {
      try {
        await this.asientosService.anular(recaudo.asiento_id, motivo, usuario?.id, true);
      } catch (e) {
        // ignore
      }
    }

    // Reintegrar saldo a cartera
    const cxc = recaudo.cuenta_por_cobrar;
    if (cxc) {
      const nuevoSaldo = Number(cxc.saldo_pendiente) + Number(recaudo.monto_recaudo);
      cxc.saldo_pendiente = Number(nuevoSaldo.toFixed(2));
      cxc.estado = cxc.saldo_pendiente >= Number(cxc.total_factura) - 0.01
        ? EstadoCuentaPorCobrar.PENDIENTE
        : EstadoCuentaPorCobrar.COBRADA_PARCIAL;
      await this.cxcRepo.save(cxc);
    }

    // Eliminar recaudo anulado
    await this.recaudoRepo.remove(recaudo);

    // Auditoría
    try {
      await this.auditoriaService.registrarLog({
        empresa_id: empresaId,
        usuario_id: usuario?.id,
        usuario_email: usuario?.email || 'sistema',
        accion: 'ANULAR_RECAUDO_CXC',
        modulo: 'CXC',
        entidad_id: recaudoId,
        datos_nuevos: { motivo, monto: recaudo.monto_recaudo, factura: cxc?.numero_factura },
      });
    } catch (e) {
      // ignore
    }
  }

  async obtenerEstadoCuentaCliente(empresaId: string, clienteId: string): Promise<any> {
    const cliente = await this.terceroRepo.findOne({
      where: { id: clienteId, empresa_id: empresaId },
    });
    if (!cliente) {
      throw new NotFoundException(`El cliente no existe.`);
    }

    const facturas = await this.cxcRepo.find({
      where: { empresa_id: empresaId, tercero_id: clienteId },
      order: { fecha_emision: 'DESC' },
    });

    const hoy = new Date().toISOString().split('T')[0];
    let totalFacturado = 0;
    let totalSaldo = 0;
    let totalVencido = 0;

    const facturasDetalle = facturas.map((f) => {
      const saldo = Number(f.saldo_pendiente || 0);
      const total = Number(f.total_factura || 0);
      totalFacturado += total;
      totalSaldo += saldo;

      const diasMora = f.fecha_vencimiento < hoy && saldo > 0
        ? Math.floor((new Date(hoy).getTime() - new Date(f.fecha_vencimiento).getTime()) / (1000 * 3600 * 24))
        : 0;

      if (diasMora > 0) {
        totalVencido += saldo;
      }

      return {
        ...f,
        dias_mora: diasMora,
      };
    });

    return {
      cliente,
      total_facturado: Number(totalFacturado.toFixed(2)),
      total_saldo: Number(totalSaldo.toFixed(2)),
      total_vencido: Number(totalVencido.toFixed(2)),
      facturas: facturasDetalle,
    };
  }

  async obtenerExtractoCliente(empresaId: string, clienteId: string): Promise<any> {
    const cliente = await this.terceroRepo.findOne({
      where: { id: clienteId, empresa_id: empresaId },
    });
    if (!cliente) {
      throw new NotFoundException(`El cliente no existe.`);
    }

    const facturas = await this.cxcRepo.find({
      where: { empresa_id: empresaId, tercero_id: clienteId },
    });

    const recaudos = await this.recaudoRepo
      .createQueryBuilder('r')
      .innerJoin('r.cuenta_por_cobrar', 'c')
      .where('r.empresa_id = :empresaId AND c.tercero_id = :clienteId', { empresaId, clienteId })
      .getMany();

    const movimientos: {
      fecha: string;
      tipo: 'CARGO' | 'ABONO';
      documento: string;
      glosa: string;
      debito: number;
      credito: number;
      saldo: number;
    }[] = [];

    for (const f of facturas) {
      movimientos.push({
        fecha: f.fecha_emision,
        tipo: 'CARGO',
        documento: f.numero_factura,
        glosa: f.observaciones || `Factura de venta ${f.numero_factura}`,
        debito: Number(f.total_factura),
        credito: 0,
        saldo: 0,
      });
    }

    for (const r of recaudos) {
      movimientos.push({
        fecha: r.fecha_recaudo,
        tipo: 'ABONO',
        documento: r.referencia_transaccion || 'REC-CAJA',
        glosa: r.glosa || 'Recaudo de cartera',
        debito: 0,
        credito: Number(r.monto_recaudo),
        saldo: 0,
      });
    }

    movimientos.sort((a, b) => (a.fecha > b.fecha ? 1 : -1));

    let saldoAcumulado = 0;
    for (const mov of movimientos) {
      saldoAcumulado += mov.debito - mov.credito;
      mov.saldo = Number(saldoAcumulado.toFixed(2));
    }

    return {
      cliente,
      saldo_actual: Number(saldoAcumulado.toFixed(2)),
      movimientos,
    };
  }

  async obtenerMatrizEdadesCartera(empresaId: string): Promise<any> {
    const facturas = await this.cxcRepo.find({
      where: { empresa_id: empresaId },
      relations: { tercero: true },
      order: { fecha_vencimiento: 'ASC' },
    });

    const hoy = new Date().toISOString().split('T')[0];
    const porCliente = new Map<string, any>();

    let totalGlobalCorriente = 0;
    let totalGlobal1a30 = 0;
    let totalGlobal31a60 = 0;
    let totalGlobal61a90 = 0;
    let totalGlobalMas90 = 0;
    let totalGlobalCartera = 0;

    for (const f of facturas) {
      if (f.estado === EstadoCuentaPorCobrar.ANULADA || Number(f.saldo_pendiente) <= 0.01) {
        continue;
      }

      const saldo = Number(f.saldo_pendiente);
      const clienteId = f.tercero_id;
      const clienteNombre = f.tercero?.razon_social || 'Cliente';
      const clienteNit = f.tercero?.numero_identificacion || '';

      if (!porCliente.has(clienteId)) {
        porCliente.set(clienteId, {
          cliente_id: clienteId,
          razon_social: clienteNombre,
          nit: clienteNit,
          corriente: 0,
          dias_1_30: 0,
          dias_31_60: 0,
          dias_61_90: 0,
          mas_90: 0,
          total: 0,
        });
      }

      const fila = porCliente.get(clienteId);
      fila.total += saldo;
      totalGlobalCartera += saldo;

      if (f.fecha_vencimiento >= hoy) {
        fila.corriente += saldo;
        totalGlobalCorriente += saldo;
      } else {
        const dias = Math.floor(
          (new Date(hoy).getTime() - new Date(f.fecha_vencimiento).getTime()) / (1000 * 3600 * 24),
        );
        if (dias <= 30) {
          fila.dias_1_30 += saldo;
          totalGlobal1a30 += saldo;
        } else if (dias <= 60) {
          fila.dias_31_60 += saldo;
          totalGlobal31a60 += saldo;
        } else if (dias <= 90) {
          fila.dias_61_90 += saldo;
          totalGlobal61a90 += saldo;
        } else {
          fila.mas_90 += saldo;
          totalGlobalMas90 += saldo;
        }
      }
    }

    const filas = Array.from(porCliente.values()).map((f) => ({
      ...f,
      corriente: Number(f.corriente.toFixed(2)),
      dias_1_30: Number(f.dias_1_30.toFixed(2)),
      dias_31_60: Number(f.dias_31_60.toFixed(2)),
      dias_61_90: Number(f.dias_61_90.toFixed(2)),
      mas_90: Number(f.mas_90.toFixed(2)),
      total: Number(f.total.toFixed(2)),
    }));

    return {
      totales: {
        corriente: Number(totalGlobalCorriente.toFixed(2)),
        dias_1_30: Number(totalGlobal1a30.toFixed(2)),
        dias_31_60: Number(totalGlobal31a60.toFixed(2)),
        dias_61_90: Number(totalGlobal61a90.toFixed(2)),
        mas_90: Number(totalGlobalMas90.toFixed(2)),
        total: Number(totalGlobalCartera.toFixed(2)),
      },
      clientes: filas,
    };
  }

  private async buscarCuentaPuc(
    empresaId: string,
    codigosPrioritarios: (string | null | undefined)[],
    clasePreferida?: ClaseCuenta,
  ): Promise<PucCuenta> {
    const limpios = codigosPrioritarios.filter((c): c is string => !!c && c.trim().length > 0);
    for (const cod of limpios) {
      let c = await this.pucRepo.findOne({
        where: { empresa_id: empresaId, codigo: cod.trim(), permite_movimiento: true },
      });
      if (c) return c;

      c = await this.pucRepo.findOne({
        where: { empresa_id: empresaId, codigo: Like(`${cod.trim()}%`), permite_movimiento: true },
        order: { codigo: 'ASC' },
      });
      if (c) return c;
    }

    if (clasePreferida) {
      const c = await this.pucRepo.findOne({
        where: { empresa_id: empresaId, clase: clasePreferida, permite_movimiento: true },
        order: { codigo: 'ASC' },
      });
      if (c) return c;
    }

    throw new BadRequestException(
      `No se encontró una cuenta contable auxiliar en el PUC para [${limpios.join(', ')}]. Verifique el catálogo de cuentas.`,
    );
  }
}
