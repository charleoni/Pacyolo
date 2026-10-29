import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import {
  FacturaVenta,
  TipoFacturaVenta,
  CondicionPagoVenta,
  EstadoFacturaVenta,
} from './entities/factura-venta.entity.js';
import { FacturaVentaLinea } from './entities/factura-venta-linea.entity.js';
import { Articulo, TipoArticulo } from '../inventarios/entities/articulo.entity.js';
import { SaldoBodega } from '../inventarios/entities/saldo-bodega.entity.js';
import { KardexMovimiento } from '../inventarios/entities/kardex-movimiento.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta, ClaseCuenta } from '../puc/entities/puc.entity.js';
import { CuentaPorCobrar, EstadoCuentaPorCobrar } from '../cxc/entities/cuenta-por-cobrar.entity.js';
import { RecaudoCxc, MetodoRecaudo } from '../cxc/entities/recaudo-cxc.entity.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { TipoComprobante } from '../asientos/entities/asiento.entity.js';
import { CreateFacturaVentaDto } from './dto/ventas.dto.js';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(FacturaVenta)
    private readonly facturaRepo: Repository<FacturaVenta>,
    @InjectRepository(FacturaVentaLinea)
    private readonly lineaRepo: Repository<FacturaVentaLinea>,
    @InjectRepository(Articulo)
    private readonly articuloRepo: Repository<Articulo>,
    @InjectRepository(SaldoBodega)
    private readonly saldoBodegaRepo: Repository<SaldoBodega>,
    @InjectRepository(KardexMovimiento)
    private readonly kardexRepo: Repository<KardexMovimiento>,
    @InjectRepository(Bodega)
    private readonly bodegaRepo: Repository<Bodega>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
    @InjectRepository(CuentaPorCobrar)
    private readonly cxcRepo: Repository<CuentaPorCobrar>,
    @InjectRepository(RecaudoCxc)
    private readonly recaudoRepo: Repository<RecaudoCxc>,
    private readonly asientosService: AsientosService,
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  async listarFacturas(empresaId: string, search?: string): Promise<FacturaVenta[]> {
    const qb = this.facturaRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.cliente', 'c')
      .leftJoinAndSelect('f.asiento', 'a')
      .leftJoinAndSelect('f.asiento_costo', 'ac')
      .leftJoinAndSelect('f.lineas', 'l')
      .leftJoinAndSelect('l.articulo', 'art')
      .leftJoinAndSelect('l.bodega', 'b')
      .where('f.empresa_id = :empresaId', { empresaId });

    if (search && search.trim()) {
      qb.andWhere(
        '(f.consecutivo ILIKE :search OR c.razon_social ILIKE :search OR c.numero_identificacion ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    return await qb.orderBy('f.created_at', 'DESC').getMany();
  }

  async obtenerFacturaPorId(empresaId: string, id: string): Promise<FacturaVenta> {
    const factura = await this.facturaRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.cliente', 'c')
      .leftJoinAndSelect('f.asiento', 'a')
      .leftJoinAndSelect('a.lineas', 'al')
      .leftJoinAndSelect('al.cuenta', 'alc')
      .leftJoinAndSelect('al.tercero', 'alt')
      .leftJoinAndSelect('f.asiento_costo', 'ac')
      .leftJoinAndSelect('ac.lineas', 'acl')
      .leftJoinAndSelect('acl.cuenta', 'aclc')
      .leftJoinAndSelect('f.lineas', 'l')
      .leftJoinAndSelect('l.articulo', 'art')
      .leftJoinAndSelect('l.bodega', 'b')
      .where('f.id = :id AND f.empresa_id = :empresaId', { id, empresaId })
      .getOne();

    if (!factura) {
      throw new NotFoundException(`Factura de venta con ID ${id} no encontrada.`);
    }

    return factura;
  }

  async emitirFactura(empresaId: string, dto: CreateFacturaVentaDto, usuario?: any): Promise<FacturaVenta> {
    // 1. Validar cliente
    const cliente = await this.terceroRepo.findOne({
      where: { id: dto.cliente_id, empresa_id: empresaId },
    });
    if (!cliente) {
      throw new NotFoundException(`El cliente seleccionado no existe en esta empresa.`);
    }

    // 2. Generar consecutivo
    const tipoDoc = dto.tipo_documento || TipoFacturaVenta.FACTURA_VENTA;
    const prefijo = tipoDoc === TipoFacturaVenta.TIQUETE_POS ? 'POS' : 'FAC';
    const totalDocs = await this.facturaRepo.count({
      where: { empresa_id: empresaId, tipo_documento: tipoDoc },
    });
    const consecutivo = `${prefijo}-${String(totalDocs + 1).padStart(4, '0')}`;

    // 3. Procesar y tasar líneas
    let subtotalGeneral = 0;
    let totalDescuentosGeneral = 0;
    let totalIvaGeneral = 0;
    let totalIncGeneral = 0;
    let costoTotalGeneral = 0;

    const lineasProcesadas: Partial<FacturaVentaLinea>[] = [];
    const movimientosKardex: {
      articulo: Articulo;
      bodegaId: string;
      cantidad: number;
      costoUnitario: number;
      costoTotal: number;
    }[] = [];

    // Bodega por defecto si no se especificó en líneas
    const bodegaDefault = await this.bodegaRepo.findOne({
      where: { empresa_id: empresaId, activo: true },
      order: { created_at: 'ASC' },
    });

    for (const item of dto.lineas) {
      const art = await this.articuloRepo.findOne({
        where: { id: item.articulo_id, empresa_id: empresaId },
      });
      if (!art) {
        throw new NotFoundException(`Artículo con ID ${item.articulo_id} no encontrado.`);
      }

      const cantidad = Number(item.cantidad);
      const precioUnit = Number(item.precio_unitario);
      const descPorc = Number(item.porcentaje_descuento || 0);
      const subtotalLinea = Number((cantidad * precioUnit).toFixed(2));
      const montoDescuento = Number(((subtotalLinea * descPorc) / 100).toFixed(2));
      const baseGravable = subtotalLinea - montoDescuento;

      const tarifaIva = Number(item.tarifa_iva ?? art.tarifa_iva ?? 0);
      const montoIva = Number(((baseGravable * tarifaIva) / 100).toFixed(2));

      const tarifaInc = Number(item.tarifa_inc ?? art.tarifa_inc ?? 0);
      const montoInc = Number(((baseGravable * tarifaInc) / 100).toFixed(2));

      const totalLinea = baseGravable + montoIva + montoInc;

      let costoUnitario = 0;
      let costoLineaTotal = 0;
      let targetBodegaId: string | null = null;

      // Si es inventariable, validar existencias y capturar costo promedio ponderado NIIF
      if (art.tipo_articulo === 'INVENTARIABLE') {
        targetBodegaId = item.bodega_id || (bodegaDefault ? bodegaDefault.id : null);
        if (!targetBodegaId) {
          throw new BadRequestException(
            `El artículo inventariable [${art.codigo}] requiere una bodega válida para la salida de stock.`,
          );
        }

        const saldoBodega = await this.saldoBodegaRepo.findOne({
          where: { articulo_id: art.id, bodega_id: targetBodegaId },
        });

        const stockDisponible = Number(saldoBodega?.stock_actual || 0);
        if (stockDisponible < cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para el artículo [${art.codigo} - ${art.nombre}]. Disponible: ${stockDisponible}, Requerido: ${cantidad}.`,
          );
        }

        costoUnitario = Number(art.costo_promedio || 0);
        costoLineaTotal = Number((costoUnitario * cantidad).toFixed(2));
        costoTotalGeneral += costoLineaTotal;

        movimientosKardex.push({
          articulo: art,
          bodegaId: targetBodegaId,
          cantidad,
          costoUnitario,
          costoTotal: costoLineaTotal,
        });
      }

      subtotalGeneral += subtotalLinea;
      totalDescuentosGeneral += montoDescuento;
      totalIvaGeneral += montoIva;
      totalIncGeneral += montoInc;

      lineasProcesadas.push({
        articulo_id: art.id,
        bodega_id: targetBodegaId,
        cantidad,
        precio_unitario: precioUnit,
        porcentaje_descuento: descPorc,
        monto_descuento: montoDescuento,
        tarifa_iva: tarifaIva,
        monto_iva: montoIva,
        tarifa_inc: tarifaInc,
        monto_inc: montoInc,
        subtotal: subtotalLinea,
        total: totalLinea,
        costo_unitario: costoUnitario,
        costo_total: costoLineaTotal,
      });
    }

    const propina = Number(dto.propina || 0);
    const retefuente = Number(dto.retefuente || 0);
    const reteica = Number(dto.reteica || 0);
    const reteiva = Number(dto.reteiva || 0);
    const totalRetenciones = retefuente + reteica + reteiva;

    const totalFactura = Number(
      (subtotalGeneral - totalDescuentosGeneral + totalIvaGeneral + totalIncGeneral + propina - totalRetenciones).toFixed(2),
    );

    // 4. Iniciar transacción atómica para guardar factura, kardex y asientos contables
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4.1 Crear entidad factura
      const factura = queryRunner.manager.create(FacturaVenta, {
        empresa_id: empresaId,
        consecutivo,
        tipo_documento: tipoDoc,
        cliente_id: cliente.id,
        fecha_emision: dto.fecha_emision,
        fecha_vencimiento: dto.fecha_vencimiento,
        condicion_pago: dto.condicion_pago || CondicionPagoVenta.CONTADO,
        medio_pago: dto.medio_pago || 'EFECTIVO',
        subtotal: subtotalGeneral,
        total_descuentos: totalDescuentosGeneral,
        total_iva: totalIvaGeneral,
        total_inc: totalIncGeneral,
        propina,
        retefuente,
        reteica,
        reteiva,
        total_factura: totalFactura,
        costo_total_ventas: costoTotalGeneral,
        estado: EstadoFacturaVenta.EMITIDA,
        observaciones: dto.observaciones,
        usuario_id: usuario?.id,
        creado_por: usuario?.email || usuario?.nombre || 'Usuario Sistema',
      });

      const facturaGuardada = await queryRunner.manager.save(FacturaVenta, factura);

      // Guardar líneas
      for (const lineaData of lineasProcesadas) {
        lineaData.factura_id = facturaGuardada.id;
        const lineaEntity = queryRunner.manager.create(FacturaVentaLinea, lineaData);
        await queryRunner.manager.save(FacturaVentaLinea, lineaEntity);
      }

      // 4.2 Descontar stock y registrar movimientos en Kardex
      for (const mov of movimientosKardex) {
        // Disminuir saldo bodega
        const saldo = await queryRunner.manager.findOne(SaldoBodega, {
          where: { articulo_id: mov.articulo.id, bodega_id: mov.bodegaId },
        });
        const nuevoStockBodega = Number(saldo?.stock_actual || 0) - mov.cantidad;
        if (saldo) {
          saldo.stock_actual = nuevoStockBodega;
          await queryRunner.manager.save(SaldoBodega, saldo);
        }

        // Disminuir stock actual artículo
        const nuevoStockTotal = Number(mov.articulo.stock_actual || 0) - mov.cantidad;
        mov.articulo.stock_actual = nuevoStockTotal;
        await queryRunner.manager.save(Articulo, mov.articulo);

        // Movimiento de Kardex
        const kardex = queryRunner.manager.create(KardexMovimiento, {
          empresa_id: empresaId,
          articulo_id: mov.articulo.id,
          bodega_id: mov.bodegaId,
          naturaleza: 'SALIDA',
          fecha_movimiento: dto.fecha_emision,
          documento_referencia: consecutivo,
          cantidad_entrada: 0,
          costo_unitario_entrada: 0,
          costo_total_entrada: 0,
          cantidad_salida: mov.cantidad,
          costo_unitario_salida: mov.costoUnitario,
          costo_total_salida: mov.costoTotal,
          saldo_cantidad_resultante: nuevoStockTotal,
          costo_unitario_promedio_resultante: mov.costoUnitario,
          saldo_costo_total_resultante: Number((nuevoStockTotal * mov.costoUnitario).toFixed(2)),
          observaciones: `Venta factura ${consecutivo} a ${cliente.razon_social}`,
        });
        await queryRunner.manager.save(KardexMovimiento, kardex);
      }

      await queryRunner.commitTransaction();

      // 5. Generar Asiento Contable de Costeo de Ventas (Débito 61 <-> Crédito 14)
      let asientoCostoId: string | null = null;
      if (costoTotalGeneral > 0) {
        try {
          const cuentaCosto = await this.buscarCuentaPuc(empresaId, ['613505', '6135', '61'], ClaseCuenta.COSTO);
          const cuentaInv = await this.buscarCuentaPuc(empresaId, ['143505', '1435', '14'], ClaseCuenta.ACTIVO);

          const asientoCosto = await this.asientosService.create({
            empresa_id: empresaId,
            tipo_comprobante: TipoComprobante.DIA,
            fecha_contable: dto.fecha_emision,
            glosa_general: `Costeo de ventas NIIF factura ${consecutivo} - ${cliente.razon_social}`,
            origen_sistema: 'VENTAS_COSTO',
            origen_documento_id: facturaGuardada.id,
            lineas: [
              {
                cuenta_id: cuentaCosto.id,
                tercero_id: cliente.id,
                debito: costoTotalGeneral,
                credito: 0,
                glosa_detalle: `Costo de ventas ${consecutivo}`,
              },
              {
                cuenta_id: cuentaInv.id,
                tercero_id: cliente.id,
                debito: 0,
                credito: costoTotalGeneral,
                glosa_detalle: `Salida de inventario mercancías ${consecutivo}`,
              },
            ],
          });
          asientoCostoId = asientoCosto.id;
        } catch (err: any) {
          console.warn(`[VentasService] No se pudo generar asiento de costo: ${err.message}`);
        }
      }

      // 6. Generar Asiento Contable de la Venta (Partida Doble)
      let asientoVentaId: string | null = null;
      try {
        const lineasAsiento: any[] = [];
        const netoVentas = Number((subtotalGeneral - totalDescuentosGeneral).toFixed(2));

        // Crédito: Ingresos
        const cuentaIngreso = await this.buscarCuentaPuc(empresaId, ['413505', '4135', '41'], ClaseCuenta.INGRESO);
        lineasAsiento.push({
          cuenta_id: cuentaIngreso.id,
          tercero_id: cliente.id,
          debito: 0,
          credito: netoVentas,
          glosa_detalle: `Venta según ${consecutivo}`,
        });

        // Crédito: IVA generado si aplica
        if (totalIvaGeneral > 0) {
          const cuentaIva = await this.buscarCuentaPuc(empresaId, ['240805', '2408'], ClaseCuenta.PASIVO);
          lineasAsiento.push({
            cuenta_id: cuentaIva.id,
            tercero_id: cliente.id,
            debito: 0,
            credito: totalIvaGeneral,
            glosa_detalle: `IVA generado en ${consecutivo}`,
          });
        }

        // Crédito: Impuesto Nacional al Consumo si aplica
        if (totalIncGeneral > 0) {
          const cuentaInc = await this.buscarCuentaPuc(empresaId, ['249505', '2495', '24'], ClaseCuenta.PASIVO);
          lineasAsiento.push({
            cuenta_id: cuentaInc.id,
            tercero_id: cliente.id,
            debito: 0,
            credito: totalIncGeneral,
            glosa_detalle: `Impuesto al consumo en ${consecutivo}`,
          });
        }

        // Crédito: Propina si aplica
        if (propina > 0) {
          const cuentaPropina = await this.buscarCuentaPuc(empresaId, ['281505', '2815', '28'], ClaseCuenta.PASIVO);
          lineasAsiento.push({
            cuenta_id: cuentaPropina.id,
            tercero_id: cliente.id,
            debito: 0,
            credito: propina,
            glosa_detalle: `Propina voluntaria ${consecutivo}`,
          });
        }

        // Débito: Retefuente anticipo cliente
        if (retefuente > 0) {
          const cuentaRete = await this.buscarCuentaPuc(empresaId, ['135515', '1355'], ClaseCuenta.ACTIVO);
          lineasAsiento.push({
            cuenta_id: cuentaRete.id,
            tercero_id: cliente.id,
            debito: retefuente,
            credito: 0,
            glosa_detalle: `Anticipo Retefuente ${consecutivo}`,
          });
        }

        // Débito: ReteICA anticipo cliente
        if (reteica > 0) {
          const cuentaReteIca = await this.buscarCuentaPuc(empresaId, ['135518', '1355'], ClaseCuenta.ACTIVO);
          lineasAsiento.push({
            cuenta_id: cuentaReteIca.id,
            tercero_id: cliente.id,
            debito: reteica,
            credito: 0,
            glosa_detalle: `Anticipo ReteICA ${consecutivo}`,
          });
        }

        // Débito: ReteIVA anticipo cliente
        if (reteiva > 0) {
          const cuentaReteIva = await this.buscarCuentaPuc(empresaId, ['135517', '1355'], ClaseCuenta.ACTIVO);
          lineasAsiento.push({
            cuenta_id: cuentaReteIva.id,
            tercero_id: cliente.id,
            debito: reteiva,
            credito: 0,
            glosa_detalle: `Anticipo ReteIVA ${consecutivo}`,
          });
        }

        // Débito: Cartera o Caja/Banco
        const esContado = dto.condicion_pago === CondicionPagoVenta.CONTADO;
        const codigosCobro = esContado ? ['110505', '1105', '111005', '1110'] : ['130505', '1305'];
        const cuentaCobro = await this.buscarCuentaPuc(empresaId, codigosCobro, ClaseCuenta.ACTIVO);

        lineasAsiento.push({
          cuenta_id: cuentaCobro.id,
          tercero_id: cliente.id,
          debito: totalFactura,
          credito: 0,
          glosa_detalle: esContado ? `Ingreso de contado ${consecutivo}` : `Cartera clientes ${consecutivo}`,
        });

        const asientoVenta = await this.asientosService.create({
          empresa_id: empresaId,
          tipo_comprobante: TipoComprobante.CAU,
          fecha_contable: dto.fecha_emision,
          glosa_general: `Venta factura ${consecutivo} - ${cliente.razon_social}`,
          origen_sistema: 'VENTAS',
          origen_documento_id: facturaGuardada.id,
          lineas: lineasAsiento,
        });
        asientoVentaId = asientoVenta.id;

        // 7. Reconocimiento de Cartera (CxC)
        const cuentaCarteraAux = await this.buscarCuentaPuc(empresaId, ['130505', '1305'], ClaseCuenta.ACTIVO);
        const cxc = this.cxcRepo.create({
          empresa_id: empresaId,
          tercero_id: cliente.id,
          asiento_id: asientoVentaId,
          cuenta_activo_id: cuentaCarteraAux.id,
          numero_factura: consecutivo,
          fecha_emision: dto.fecha_emision,
          fecha_vencimiento: dto.fecha_vencimiento,
          subtotal: subtotalGeneral - totalDescuentosGeneral,
          total_impuestos: totalIvaGeneral + totalIncGeneral + propina,
          total_retenciones: totalRetenciones,
          total_factura: totalFactura,
          saldo_pendiente: esContado ? 0 : totalFactura,
          estado: esContado ? EstadoCuentaPorCobrar.COBRADA_TOTAL : EstadoCuentaPorCobrar.PENDIENTE,
          origen_sistema: 'VENTAS_PACYOLO',
          origen_documento_id: facturaGuardada.id,
          observaciones: dto.observaciones,
        });
        const cxcGuardada = await this.cxcRepo.save(cxc);

        // Si fue de contado, registrar el RecaudoCxc formal con su comprobante
        if (esContado) {
          const cuentaRecaudo = await this.buscarCuentaPuc(empresaId, ['110505', '1105', '111005'], ClaseCuenta.ACTIVO);
          const recaudo = this.recaudoRepo.create({
            empresa_id: empresaId,
            cuenta_por_cobrar_id: cxcGuardada.id,
            asiento_id: asientoVentaId,
            cuenta_banco_id: cuentaRecaudo.id,
            monto_recaudo: totalFactura,
            fecha_recaudo: dto.fecha_emision,
            metodo_recaudo: MetodoRecaudo.EFECTIVO,
            referencia_transaccion: consecutivo,
            origen_sistema: 'VENTAS_CONTADO',
            origen_documento_id: facturaGuardada.id,
            glosa: `Recaudo de contado de venta ${consecutivo}`,
          });
          await this.recaudoRepo.save(recaudo);
        }
      } catch (err: any) {
        console.warn(`[VentasService] Advertencia en contabilización de venta: ${err.message}`);
      }

      // Actualizar ids de asientos en la factura
      if (asientoVentaId || asientoCostoId) {
        facturaGuardada.asiento_id = asientoVentaId;
        facturaGuardada.asiento_costo_id = asientoCostoId;
        await this.facturaRepo.save(facturaGuardada);
      }

      // 8. Auditoría inmutable
      try {
        await this.auditoriaService.registrarLog({
          empresa_id: empresaId,
          usuario_id: usuario?.id,
          usuario_email: usuario?.email || 'sistema',
          accion: 'CREAR_FACTURA_VENTA',
          modulo: 'VENTAS',
          entidad_id: facturaGuardada.id,
          datos_nuevos: {
            consecutivo,
            tipo_documento: tipoDoc,
            cliente: cliente.razon_social,
            total_factura: totalFactura,
            costo_total_ventas: costoTotalGeneral,
            asiento_id: asientoVentaId,
            asiento_costo_id: asientoCostoId,
          },
        });
      } catch (e) {
        // Log error suppressed
      }

      return await this.obtenerFacturaPorId(empresaId, facturaGuardada.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async anularFactura(empresaId: string, id: string, motivo: string, usuario?: any): Promise<FacturaVenta> {
    const factura = await this.obtenerFacturaPorId(empresaId, id);
    if (factura.estado === EstadoFacturaVenta.ANULADA) {
      throw new BadRequestException(`La factura ${factura.consecutivo} ya se encuentra anulada.`);
    }

    // Verificar si tiene cobros asociados en CxC distintos a la causación inicial
    const cxc = await this.cxcRepo.findOne({
      where: { empresa_id: empresaId, origen_documento_id: factura.id },
    });

    if (cxc && factura.condicion_pago === CondicionPagoVenta.CREDITO && cxc.estado === EstadoCuentaPorCobrar.COBRADA_PARCIAL) {
      throw new BadRequestException(
        `No se puede anular la factura ${factura.consecutivo} porque tiene recaudos o abonos registrados en cartera. Anule primero los recibos de caja.`,
      );
    }

    // Reingresar stock al inventario en Kardex
    for (const linea of factura.lineas) {
      if (linea.articulo?.tipo_articulo === 'INVENTARIABLE' && linea.bodega_id) {
        const saldo = await this.saldoBodegaRepo.findOne({
          where: { articulo_id: linea.articulo_id, bodega_id: linea.bodega_id },
        });
        const nuevoStockBodega = Number(saldo?.stock_actual || 0) + Number(linea.cantidad);
        if (saldo) {
          saldo.stock_actual = nuevoStockBodega;
          await this.saldoBodegaRepo.save(saldo);
        }

        const art = await this.articuloRepo.findOne({ where: { id: linea.articulo_id } });
        if (art) {
          art.stock_actual = Number(art.stock_actual || 0) + Number(linea.cantidad);
          await this.articuloRepo.save(art);
        }

        const kardex = this.kardexRepo.create({
          empresa_id: empresaId,
          articulo_id: linea.articulo_id,
          bodega_id: linea.bodega_id,
          naturaleza: 'ENTRADA',
          fecha_movimiento: new Date().toISOString().split('T')[0],
          documento_referencia: `ANUL-${factura.consecutivo}`,
          cantidad_entrada: Number(linea.cantidad),
          costo_unitario_entrada: Number(linea.costo_unitario),
          costo_total_entrada: Number(linea.costo_total),
          cantidad_salida: 0,
          costo_unitario_salida: 0,
          costo_total_salida: 0,
          saldo_cantidad_resultante: art ? art.stock_actual : 0,
          costo_unitario_promedio_resultante: Number(linea.costo_unitario),
          saldo_costo_total_resultante: art ? Number((art.stock_actual * Number(linea.costo_unitario)).toFixed(2)) : 0,
          observaciones: `Reingreso por anulación de factura ${factura.consecutivo}. Motivo: ${motivo}`,
        });
        await this.kardexRepo.save(kardex);
      }
    }

    // Anular asientos si existen
    if (factura.asiento_id) {
      try {
        await this.asientosService.anular(factura.asiento_id, motivo, usuario?.id);
      } catch (e) {
        // ignore
      }
    }
    if (factura.asiento_costo_id) {
      try {
        await this.asientosService.anular(factura.asiento_costo_id, motivo, usuario?.id);
      } catch (e) {
        // ignore
      }
    }

    // Actualizar estado de factura y cartera
    factura.estado = EstadoFacturaVenta.ANULADA;
    factura.observaciones = `${factura.observaciones || ''} [ANULADA: ${motivo}]`;
    await this.facturaRepo.save(factura);

    if (cxc) {
      cxc.estado = EstadoCuentaPorCobrar.ANULADA;
      cxc.saldo_pendiente = 0;
      await this.cxcRepo.save(cxc);
    }

    // Auditoría
    try {
      await this.auditoriaService.registrarLog({
        empresa_id: empresaId,
        usuario_id: usuario?.id,
        usuario_email: usuario?.email || 'sistema',
        accion: 'ANULAR_FACTURA_VENTA',
        modulo: 'VENTAS',
        entidad_id: factura.id,
        datos_nuevos: { consecutivo: factura.consecutivo, motivo },
      });
    } catch (e) {
      // ignore
    }

    return factura;
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
