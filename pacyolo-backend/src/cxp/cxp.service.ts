import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuentaPorPagar, EstadoCuentaPorPagar } from './entities/cuenta-por-pagar.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { MapeoService } from '../mapeo/mapeo.service.js';
import { ImpuestosService } from '../impuestos/impuestos.service.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { TipoOperacionTributaria } from '../impuestos/dto/calcular-impuestos.dto.js';
import { TipoComprobante } from '../asientos/entities/asiento.entity.js';
import { CreateAsientoLineaDto } from '../asientos/dto/create-asiento-linea.dto.js';
import { CausarFacturaCxpDto } from './dto/causar-factura-cxp.dto.js';
import { FilterCxpDto } from './dto/filter-cxp.dto.js';

@Injectable()
export class CxpService {
  constructor(
    @InjectRepository(CuentaPorPagar)
    private readonly cxpRepo: Repository<CuentaPorPagar>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    private readonly mapeoService: MapeoService,
    private readonly impuestosService: ImpuestosService,
    private readonly asientosService: AsientosService,
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
}
