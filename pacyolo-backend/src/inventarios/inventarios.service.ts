import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Like } from 'typeorm';
import { Articulo } from './entities/articulo.entity.js';
import { SaldoBodega } from './entities/saldo-bodega.entity.js';
import { KardexMovimiento } from './entities/kardex-movimiento.entity.js';
import { EntradaAlmacen } from './entities/entrada-almacen.entity.js';
import { EntradaAlmacenLinea } from './entities/entrada-almacen-linea.entity.js';
import { NotaAjuste } from './entities/nota-ajuste.entity.js';
import { NotaAjusteLinea } from './entities/nota-ajuste-linea.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { TipoMovimiento } from '../parametros/entities/tipo-movimiento.entity.js';
import { OrdenCompra, OrdenCompraLinea } from '../compras/entities/orden-compra.entity.js';
import { CxpService } from '../cxp/cxp.service.js';
import { PucCuenta, ClaseCuenta } from '../puc/entities/puc.entity.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { TipoComprobante, EstadoAsiento, Asiento } from '../asientos/entities/asiento.entity.js';
import { CreateAsientoDto } from '../asientos/dto/create-asiento.dto.js';
import { CreateAsientoLineaDto } from '../asientos/dto/create-asiento-linea.dto.js';
import {
  CreateArticuloDto,
  UpdateArticuloDto,
  CreateEntradaAlmacenDto,
  CreateNotaAjusteDto,
  CreateTrasladoDto,
} from './dto/inventarios.dto.js';

@Injectable()
export class InventariosService {
  constructor(
    @InjectRepository(Articulo)
    private readonly articuloRepo: Repository<Articulo>,
    @InjectRepository(SaldoBodega)
    private readonly saldoBodegaRepo: Repository<SaldoBodega>,
    @InjectRepository(KardexMovimiento)
    private readonly kardexRepo: Repository<KardexMovimiento>,
    @InjectRepository(EntradaAlmacen)
    private readonly entradaRepo: Repository<EntradaAlmacen>,
    @InjectRepository(EntradaAlmacenLinea)
    private readonly entradaLineaRepo: Repository<EntradaAlmacenLinea>,
    @InjectRepository(NotaAjuste)
    private readonly notaAjusteRepo: Repository<NotaAjuste>,
    @InjectRepository(NotaAjusteLinea)
    private readonly notaAjusteLineaRepo: Repository<NotaAjusteLinea>,
    @InjectRepository(Bodega)
    private readonly bodegaRepo: Repository<Bodega>,
    @InjectRepository(TipoMovimiento)
    private readonly tipoMovimientoRepo: Repository<TipoMovimiento>,
    @InjectRepository(PucCuenta)
    private readonly pucRepo: Repository<PucCuenta>,
    private readonly cxpService: CxpService,
    private readonly asientosService: AsientosService,
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  // =========================================================================
  // CATÁLOGO MAESTRO DE ARTÍCULOS (NIC 2)
  // =========================================================================

  async listarArticulos(empresaId?: string, filtro?: { tipo?: string; busqueda?: string }): Promise<Articulo[]> {
    const qb = this.articuloRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.categoria', 'cat')
      .leftJoinAndSelect('a.unidad_medida', 'um');

    if (empresaId) {
      qb.where('(a.empresa_id = :empresaId OR a.empresa_id IS NULL)', { empresaId });
    } else {
      qb.where('a.empresa_id IS NULL');
    }

    if (filtro?.tipo) {
      qb.andWhere('a.tipo_articulo = :tipo', { tipo: filtro.tipo });
    }

    if (filtro?.busqueda) {
      qb.andWhere('(LOWER(a.codigo) LIKE LOWER(:q) OR LOWER(a.nombre) LIKE LOWER(:q) OR a.codigo_barras LIKE :q)', {
        q: `%${filtro.busqueda}%`,
      });
    }

    return await qb.orderBy('a.nombre', 'ASC').getMany();
  }

  async obtenerArticulo(id: string): Promise<Articulo> {
    const art = await this.articuloRepo.findOne({ where: { id } });
    if (!art) {
      throw new NotFoundException(`El artículo con ID '${id}' no existe.`);
    }
    return art;
  }

  async crearArticulo(dto: CreateArticuloDto): Promise<Articulo> {
    const existe = await this.articuloRepo.findOne({
      where: {
        codigo: dto.codigo.toUpperCase(),
        empresa_id: dto.empresa_id ? dto.empresa_id : IsNull(),
      },
    });

    if (existe) {
      throw new ConflictException(`El artículo con código '${dto.codigo}' ya existe.`);
    }

    const nuevo = this.articuloRepo.create({
      ...dto,
      codigo: dto.codigo.toUpperCase(),
      costo_promedio: dto.costo_promedio || 0,
      ultimo_costo_compra: dto.costo_promedio || 0,
      stock_actual: 0,
    });

    return await this.articuloRepo.save(nuevo);
  }

  async actualizarArticulo(id: string, dto: UpdateArticuloDto): Promise<Articulo> {
    const art = await this.obtenerArticulo(id);
    // Blindaje de seguridad: eliminar cualquier intento de mutar campos inmutables
    delete (dto as any).id;
    delete (dto as any).empresa_id;
    delete (dto as any).codigo;
    delete (dto as any).tipo_articulo;
    delete (dto as any).costo_promedio;
    delete (dto as any).stock_actual;
    delete (dto as any).ultimo_costo_compra;
    delete (dto as any).created_at;
    delete (dto as any).updated_at;

    Object.assign(art, dto);
    return await this.articuloRepo.save(art);
  }

  async cambiarEstadoArticulo(id: string, activo: boolean): Promise<Articulo> {
    const art = await this.obtenerArticulo(id);
    art.activo = activo;
    return await this.articuloRepo.save(art);
  }

  // =========================================================================
  // ENTRADAS DE ALMACÉN & MOTOR DE KARDEX (COSTEO PROMEDIO PONDERADO MÓVIL)
  // =========================================================================

  async listarEntradasAlmacen(empresaId?: string): Promise<EntradaAlmacen[]> {
    const qb = this.entradaRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.proveedor', 'p')
      .leftJoinAndSelect('e.bodega', 'b')
      .leftJoinAndSelect('e.tipo_movimiento', 'tm')
      .leftJoinAndSelect('e.orden_compra', 'oc')
      .leftJoinAndSelect('e.lineas', 'l')
      .leftJoinAndSelect('l.articulo', 'art');

    if (empresaId) {
      qb.where('e.empresa_id = :empresaId', { empresaId });
    }

    return await qb.orderBy('e.created_at', 'DESC').getMany();
  }

  async registrarEntradaAlmacen(dto: CreateEntradaAlmacenDto): Promise<EntradaAlmacen> {
    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException('La entrada de almacén debe tener al menos una línea de producto.');
    }

    // Verificar bodega
    const bodega = await this.bodegaRepo.findOne({ where: { id: dto.bodega_id } });
    if (!bodega) {
      throw new NotFoundException(`La bodega con ID '${dto.bodega_id}' no existe.`);
    }

    // Generar consecutivo si no viene dado
    let numeroEntrada = dto.numero_entrada;
    if (!numeroEntrada) {
      const conteo = await this.entradaRepo.count({
        where: { empresa_id: dto.empresa_id ? dto.empresa_id : IsNull() },
      });
      numeroEntrada = `EA-${String(conteo + 1).padStart(4, '0')}`;
    }

    // Obtener tipo movimiento por defecto si no viene
    let tipoMovId = dto.tipo_movimiento_id;
    if (!tipoMovId) {
      const tm = await this.tipoMovimientoRepo.findOne({ where: { codigo: 'ENT_COMPRA' } });
      if (tm) tipoMovId = tm.id;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validaciones estrictas: no permitir negativos ni cantidades en cero
      for (const lin of dto.lineas) {
        const cantidad = Number(lin.cantidad);
        const costoUnitario = Number(lin.costo_unitario);
        if (isNaN(cantidad) || cantidad <= 0) {
          throw new BadRequestException('La cantidad a ingresar debe ser un número positivo mayor a cero.');
        }
        if (isNaN(costoUnitario) || costoUnitario < 0) {
          throw new BadRequestException('El costo unitario no puede ser negativo.');
        }
        if (lin.porcentaje_iva !== undefined && (isNaN(Number(lin.porcentaje_iva)) || Number(lin.porcentaje_iva) < 0)) {
          throw new BadRequestException('El porcentaje de IVA no puede ser un valor negativo.');
        }
      }

      // 2. Control estricto de Orden de Compra: no permitir sobrerecepciones
      let ordenVinculada: OrdenCompra | null = null;
      if (dto.orden_compra_id) {
        ordenVinculada = await queryRunner.manager.findOne(OrdenCompra, {
          where: { id: dto.orden_compra_id },
          relations: { lineas: { articulo: true } },
        });

        if (!ordenVinculada) {
          throw new NotFoundException(`La orden de compra vinculada con ID '${dto.orden_compra_id}' no existe.`);
        }
        if (ordenVinculada.estado === 'RECIBIDA_TOTAL') {
          throw new BadRequestException(
            `La orden de compra '${ordenVinculada.numero_orden}' ya fue recibida en su totalidad y no admite más recepciones.`
          );
        }
        if (ordenVinculada.estado === 'CANCELADA') {
          throw new BadRequestException(
            `La orden de compra '${ordenVinculada.numero_orden}' se encuentra cancelada y no admite recepciones.`
          );
        }

        for (const entLinea of dto.lineas) {
          const oLinea = ordenVinculada.lineas.find((ol) => ol.articulo_id === entLinea.articulo_id);
          if (!oLinea) {
            throw new BadRequestException(
              `El artículo '${entLinea.articulo_id}' no forma parte de la Orden de Compra '${ordenVinculada.numero_orden}'.`
            );
          }
          const solicitada = Number(oLinea.cantidad_solicitada);
          const yaRecibida = Number(oLinea.cantidad_recibida || 0);
          const pendiente = Number((solicitada - yaRecibida).toFixed(2));
          const aRecibir = Number(entLinea.cantidad);

          if (aRecibir > pendiente) {
            const nombreArt = oLinea.articulo?.nombre || entLinea.articulo_id;
            throw new BadRequestException(
              `No es posible ingresar ${aRecibir} unidades de '${nombreArt}'. La Orden de Compra '${ordenVinculada.numero_orden}' solo tiene pendiente ${pendiente} unidad(es) (Solicitado: ${solicitada}, Ya recibido: ${yaRecibida}). No se permiten recepciones en exceso.`
            );
          }
        }
      }

      let totalValorado = 0;
      let totalIva = 0;
      let totalConIva = 0;
      const lineasEntrada: EntradaAlmacenLinea[] = [];

      for (const lin of dto.lineas) {
        const articulo = await queryRunner.manager.findOne(Articulo, { where: { id: lin.articulo_id } });
        if (!articulo) {
          throw new NotFoundException(`El artículo con ID '${lin.articulo_id}' no existe.`);
        }

        const cantidad = Number(lin.cantidad);
        const costoUnitario = Number(lin.costo_unitario);
        const costoTotal = Number((cantidad * costoUnitario).toFixed(2));
        const porcentajeIva = lin.porcentaje_iva !== undefined ? Number(lin.porcentaje_iva) : Number(articulo.tarifa_iva ?? 19);
        const valorIva = Number((costoTotal * (porcentajeIva / 100)).toFixed(2));
        const totalLineaConIva = Number((costoTotal + valorIva).toFixed(2));

        totalValorado += costoTotal;
        totalIva += valorIva;
        totalConIva += totalLineaConIva;

        // 1. Crear línea de entrada
        const nuevaLinea = queryRunner.manager.create(EntradaAlmacenLinea, {
          articulo_id: articulo.id,
          cantidad,
          costo_unitario: costoUnitario,
          costo_total: costoTotal,
          porcentaje_iva: porcentajeIva,
          valor_iva: valorIva,
          total_con_iva: totalLineaConIva,
        });
        lineasEntrada.push(nuevaLinea);

        // 2. Actualizar saldo por bodega
        let saldoBodega = await queryRunner.manager.findOne(SaldoBodega, {
          where: {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_id,
            articulo_id: articulo.id,
          },
        });

        const stockPrevio = saldoBodega ? Number(saldoBodega.stock_actual) : 0;
        const costoPromedioPrevio = saldoBodega ? Number(saldoBodega.costo_promedio) : Number(articulo.costo_promedio);

        // Fórmula NIIF Costo Promedio Ponderado Móvil
        const nuevoStockBodega = stockPrevio + cantidad;
        let nuevoCostoPromedio = costoUnitario;
        if (nuevoStockBodega > 0) {
          nuevoCostoPromedio = Number(
            ((stockPrevio * costoPromedioPrevio + cantidad * costoUnitario) / nuevoStockBodega).toFixed(2),
          );
        }

        if (!saldoBodega) {
          saldoBodega = queryRunner.manager.create(SaldoBodega, {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_id,
            articulo_id: articulo.id,
            stock_actual: nuevoStockBodega,
            costo_promedio: nuevoCostoPromedio,
          });
        } else {
          saldoBodega.stock_actual = nuevoStockBodega;
          saldoBodega.costo_promedio = nuevoCostoPromedio;
        }
        await queryRunner.manager.save(saldoBodega);

        // 3. Actualizar stock global del artículo
        const stockGlobalPrevio = Number(articulo.stock_actual);
        const nuevoStockGlobal = stockGlobalPrevio + cantidad;
        const nuevoCostoPromedioGlobal = nuevoStockGlobal > 0
          ? Number(((stockGlobalPrevio * Number(articulo.costo_promedio) + cantidad * costoUnitario) / nuevoStockGlobal).toFixed(2))
          : costoUnitario;

        articulo.stock_actual = nuevoStockGlobal;
        articulo.costo_promedio = nuevoCostoPromedioGlobal;
        articulo.ultimo_costo_compra = costoUnitario;
        await queryRunner.manager.save(articulo);

        // 4. Registrar movimiento en Kardex inmutable
        const kardex = queryRunner.manager.create(KardexMovimiento, {
          empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
          articulo_id: articulo.id,
          bodega_id: dto.bodega_id,
          tipo_movimiento_id: tipoMovId,
          naturaleza: 'ENTRADA',
          fecha_movimiento: dto.fecha_entrada,
          documento_referencia: numeroEntrada,
          cantidad_entrada: cantidad,
          costo_unitario_entrada: costoUnitario,
          costo_total_entrada: costoTotal,
          cantidad_salida: 0,
          costo_unitario_salida: 0,
          costo_total_salida: 0,
          saldo_cantidad_resultante: nuevoStockBodega,
          costo_unitario_promedio_resultante: nuevoCostoPromedio,
          saldo_costo_total_resultante: Number((nuevoStockBodega * nuevoCostoPromedio).toFixed(2)),
          observaciones: dto.observaciones || `Entrada por compra ${numeroEntrada}`,
        });
        await queryRunner.manager.save(kardex);
      }

      // 5. Determinar número secuencial de entrega y actualizar orden de compra
      let numeroEntrega = 1;
      let esEntregaFinal = false;

      if (ordenVinculada) {
        const conteoPrevias = await queryRunner.manager.count(EntradaAlmacen, {
          where: {
            orden_compra_id: ordenVinculada.id,
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
          },
        });
        numeroEntrega = conteoPrevias + 1;

        let todasCompletas = true;
        let algunaRecibida = false;

        for (const oLinea of ordenVinculada.lineas) {
          const entLinea = dto.lineas.find((l) => l.articulo_id === oLinea.articulo_id);
          if (entLinea) {
            oLinea.cantidad_recibida = Number(
              (Number(oLinea.cantidad_recibida || 0) + Number(entLinea.cantidad)).toFixed(2),
            );
            await queryRunner.manager.save(oLinea);
          }
          if (Number(oLinea.cantidad_recibida) > 0) algunaRecibida = true;
          if (Number(oLinea.cantidad_recibida) < Number(oLinea.cantidad_solicitada)) {
            todasCompletas = false;
          }
        }

        if (todasCompletas) {
          ordenVinculada.estado = 'RECIBIDA_TOTAL';
          esEntregaFinal = true;
        } else if (algunaRecibida) {
          ordenVinculada.estado = 'RECIBIDA_PARCIAL';
        }
        await queryRunner.manager.save(ordenVinculada);
      }

      totalValorado = Number(totalValorado.toFixed(2));
      totalIva = Number(totalIva.toFixed(2));
      totalConIva = Number((totalValorado + totalIva).toFixed(2));

      // 6. Crear cabecera EntradaAlmacen
      const entrada = queryRunner.manager.create(EntradaAlmacen, {
        empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
        numero_entrada: numeroEntrada,
        orden_compra_id: dto.orden_compra_id || null,
        proveedor_id: dto.proveedor_id,
        bodega_id: dto.bodega_id,
        tipo_movimiento_id: tipoMovId,
        numero_remision_proveedor: dto.numero_remision_proveedor || null,
        numero_factura_proveedor: dto.numero_factura_proveedor || null,
        fecha_entrada: dto.fecha_entrada,
        estado: 'CONFIRMADA',
        subtotal: totalValorado,
        total_iva: totalIva,
        total_con_iva: totalConIva,
        total_valorado: totalValorado,
        numero_entrega: numeroEntrega,
        es_entrega_final: esEntregaFinal,
        observaciones: dto.observaciones || null,
        lineas: lineasEntrada,
      });

      const guardada = await queryRunner.manager.save(entrada);
      await queryRunner.commitTransaction();

      // 7. Si se solicitó causación inmediata con factura de proveedor
      if (dto.causar_cxp && dto.numero_factura_proveedor) {
        try {
          let subtotalCausar = Number(totalValorado);
          let glosa = `Recepción entrada ${guardada.numero_entrada} - Factura ${dto.numero_factura_proveedor}`;
          let entradasPrevias: EntradaAlmacen[] = [];

          if (dto.orden_compra_id) {
            // Barrer todas las entradas confirmadas previas vinculadas a esta OC que no hayan sido causadas aún
            entradasPrevias = await this.entradaRepo.find({
              where: {
                orden_compra_id: dto.orden_compra_id,
                empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
                estado: 'CONFIRMADA',
              },
            });

            entradasPrevias = entradasPrevias.filter(
              (e) => e.id !== guardada.id && !e.cxp_id,
            );

            if (entradasPrevias.length > 0) {
              const sumaPrevias = entradasPrevias.reduce(
                (sum, e) => sum + Number(e.total_valorado || 0),
                0,
              );
              subtotalCausar = Number((subtotalCausar + sumaPrevias).toFixed(2));

              const listaNumeros = [
                ...entradasPrevias.map((e) => `${e.numero_entrada} (Entr #${e.numero_entrega || 1})`),
                `${guardada.numero_entrada} (Entr #${numeroEntrega})`,
              ].join(', ');
              glosa = `Consolidación entregas [${listaNumeros}] - Factura ${dto.numero_factura_proveedor}`;
            }
          }

          const cxp = await this.cxpService.causarFactura({
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            tercero_id: dto.proveedor_id,
            codigo_concepto: 'COMPRA_INVENTARIO',
            numero_factura_proveedor: dto.numero_factura_proveedor,
            fecha_emision: dto.fecha_factura || dto.fecha_entrada,
            fecha_vencimiento: dto.fecha_vencimiento || dto.fecha_entrada,
            subtotal: subtotalCausar,
            glosa,
          });

          // Vincular cxp_id y factura a la entrada actual
          guardada.cxp_id = cxp.id;
          guardada.numero_factura_proveedor = dto.numero_factura_proveedor;
          await this.entradaRepo.save(guardada);

          // Vincular cxp_id y factura a las entradas previas consolidadas
          for (const prev of entradasPrevias) {
            prev.cxp_id = cxp.id;
            prev.numero_factura_proveedor = dto.numero_factura_proveedor;
            await this.entradaRepo.save(prev);
          }

          // Vincular a la Orden de Compra si aplica
          if (dto.orden_compra_id) {
            const ordenRepo = this.dataSource.getRepository(OrdenCompra);
            const orden = await ordenRepo.findOne({ where: { id: dto.orden_compra_id } });
            if (orden) {
              orden.cxp_id = cxp.id;
              orden.asiento_id = cxp.asiento_id;
              orden.numero_factura_proveedor = dto.numero_factura_proveedor;
              await ordenRepo.save(orden);
            }
          }
        } catch (e: any) {
          console.warn(`[InventariosService] No se pudo generar la causación CxP automática: ${e.message}`);
        }
      }

      return guardada;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================================
  // NOTAS DE AJUSTE DE INVENTARIO
  // =========================================================================

  private async buscarCuentaAuxiliar(
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
      `No se encontró una cuenta contable auxiliar en el PUC para [${limpios.join(', ')}]. Verifique el catálogo de cuentas de la empresa.`
    );
  }

  async listarNotasAjuste(empresaId?: string): Promise<NotaAjuste[]> {
    const qb = this.notaAjusteRepo.createQueryBuilder('n')
      .leftJoinAndSelect('n.bodega', 'b')
      .leftJoinAndSelect('n.lineas', 'l')
      .leftJoinAndSelect('l.articulo', 'art')
      .leftJoinAndSelect('n.asiento', 'asiento')
      .leftJoinAndSelect('asiento.lineas', 'asientoLineas')
      .leftJoinAndSelect('asientoLineas.cuenta', 'cuenta');

    if (empresaId) {
      qb.where('n.empresa_id = :empresaId', { empresaId });
    }

    return await qb.orderBy('n.created_at', 'DESC').getMany();
  }

  async registrarNotaAjuste(dto: CreateNotaAjusteDto): Promise<NotaAjuste> {
    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException('La nota de ajuste debe contener al menos una línea.');
    }

    let numeroNota = dto.numero_nota;
    if (!numeroNota) {
      const conteo = await this.notaAjusteRepo.count({
        where: { empresa_id: dto.empresa_id ? dto.empresa_id : IsNull() },
      });
      numeroNota = `AJ-${String(conteo + 1).padStart(4, '0')}`;
    }

    const articulosMap = new Map<string, Articulo>();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let totalAjuste = 0;
    let guardada: NotaAjuste;

    try {
      const lineasAjuste: NotaAjusteLinea[] = [];

      for (const lin of dto.lineas) {
        const articulo = await queryRunner.manager.findOne(Articulo, { where: { id: lin.articulo_id } });
        if (!articulo) {
          throw new NotFoundException(`El artículo con ID '${lin.articulo_id}' no existe.`);
        }
        articulosMap.set(articulo.id, articulo);

        // FORZAR NATURALEZA SEGÚN EL TIPO DE AJUSTE (Regla Estricta: FALTANTE siempre resta stock, SOBRANTE siempre suma)
        let tipoMovimiento = lin.tipo_movimiento;
        if (dto.tipo_ajuste === 'FALTANTE_MERMA') {
          tipoMovimiento = 'SALIDA';
        } else if (dto.tipo_ajuste === 'SOBRANTE') {
          tipoMovimiento = 'ENTRADA';
        }
        lin.tipo_movimiento = tipoMovimiento;

        const cantidad = Number(lin.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
          throw new BadRequestException(`La cantidad para el artículo '${articulo.nombre}' debe ser un número positivo mayor a cero.`);
        }
        const costoUnitario = Number(lin.costo_unitario || articulo.costo_promedio || 0);
        if (isNaN(costoUnitario) || costoUnitario < 0) {
          throw new BadRequestException(`El costo unitario para '${articulo.nombre}' no puede ser negativo.`);
        }

        // Consultar saldo por bodega antes de mutar
        let saldoBodega = await queryRunner.manager.findOne(SaldoBodega, {
          where: {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_id,
            articulo_id: articulo.id,
          },
        });

        const stockPrevio = saldoBodega ? Number(saldoBodega.stock_actual) : 0;
        const stockGlobalPrevio = Number(articulo.stock_actual);

        // Control estricto de Stock Negativo en Salidas por Ajuste
        if (tipoMovimiento === 'SALIDA') {
          if (stockPrevio < cantidad) {
            throw new BadRequestException(
              `No es posible registrar salida de ${cantidad} unidades de '${articulo.nombre}'. El stock disponible en bodega es de solo ${stockPrevio} unidades. No se permite inventario negativo.`
            );
          }
          if (stockGlobalPrevio < cantidad) {
            throw new BadRequestException(
              `No es posible registrar salida de ${cantidad} unidades de '${articulo.nombre}'. El stock global de la empresa es de solo ${stockGlobalPrevio} unidades.`
            );
          }
        }

        const costoTotal = Number((cantidad * costoUnitario).toFixed(2));
        totalAjuste += costoTotal;

        const nuevaLinea = queryRunner.manager.create(NotaAjusteLinea, {
          articulo_id: articulo.id,
          tipo_movimiento: tipoMovimiento,
          cantidad,
          costo_unitario: costoUnitario,
          costo_total: costoTotal,
        });
        lineasAjuste.push(nuevaLinea);

        let nuevoStockBodega = stockPrevio;
        let nuevoStockGlobal = stockGlobalPrevio;

        if (tipoMovimiento === 'ENTRADA') {
          nuevoStockBodega = Number((stockPrevio + cantidad).toFixed(2));
          nuevoStockGlobal = Number((stockGlobalPrevio + cantidad).toFixed(2));
        } else {
          nuevoStockBodega = Number((stockPrevio - cantidad).toFixed(2));
          nuevoStockGlobal = Number((stockGlobalPrevio - cantidad).toFixed(2));
        }

        if (!saldoBodega) {
          saldoBodega = queryRunner.manager.create(SaldoBodega, {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_id,
            articulo_id: articulo.id,
            stock_actual: nuevoStockBodega,
            costo_promedio: Number(articulo.costo_promedio),
          });
        } else {
          saldoBodega.stock_actual = nuevoStockBodega;
        }
        await queryRunner.manager.save(saldoBodega);

        articulo.stock_actual = nuevoStockGlobal;
        await queryRunner.manager.save(articulo);

        // Movimiento Kardex
        const kardex = queryRunner.manager.create(KardexMovimiento, {
          empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
          articulo_id: articulo.id,
          bodega_id: dto.bodega_id,
          tipo_movimiento_id: null,
          naturaleza: 'AJUSTE',
          fecha_movimiento: dto.fecha_ajuste,
          documento_referencia: numeroNota,
          cantidad_entrada: lin.tipo_movimiento === 'ENTRADA' ? cantidad : 0,
          costo_unitario_entrada: lin.tipo_movimiento === 'ENTRADA' ? costoUnitario : 0,
          costo_total_entrada: lin.tipo_movimiento === 'ENTRADA' ? costoTotal : 0,
          cantidad_salida: lin.tipo_movimiento === 'SALIDA' ? cantidad : 0,
          costo_unitario_salida: lin.tipo_movimiento === 'SALIDA' ? costoUnitario : 0,
          costo_total_salida: lin.tipo_movimiento === 'SALIDA' ? costoTotal : 0,
          saldo_cantidad_resultante: nuevoStockBodega,
          costo_unitario_promedio_resultante: Number(articulo.costo_promedio),
          saldo_costo_total_resultante: Number((nuevoStockBodega * Number(articulo.costo_promedio)).toFixed(2)),
          observaciones: `${dto.tipo_ajuste}: ${dto.justificacion}`,
        });
        await queryRunner.manager.save(kardex);
      }

      const nota = queryRunner.manager.create(NotaAjuste, {
        empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
        numero_nota: numeroNota,
        bodega_id: dto.bodega_id,
        tipo_ajuste: dto.tipo_ajuste,
        fecha_ajuste: dto.fecha_ajuste,
        justificacion: dto.justificacion,
        total_ajuste: totalAjuste,
        lineas: lineasAjuste,
      });

      guardada = await queryRunner.manager.save(nota);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // =========================================================================
    // CONTABILIZACIÓN AUTOMÁTICA OBLIGATORIA (ERP & NIIF NIC 2)
    // Generar Comprobante Contable de Ajuste (Tipo AJU) con estricta partida doble
    // =========================================================================
    if (dto.empresa_id && totalAjuste > 0) {
      try {
        const lineasContables: CreateAsientoLineaDto[] = [];

        for (const lin of dto.lineas) {
          const articulo = articulosMap.get(lin.articulo_id);
          const cantidad = Number(lin.cantidad);
          const costoUnitario = Number(lin.costo_unitario || articulo?.costo_promedio || 0);
          const costoTotal = Number((cantidad * costoUnitario).toFixed(2));
          if (costoTotal <= 0) continue;

          // Cuenta de Inventario (Activo)
          const cuentaInventario = await this.buscarCuentaAuxiliar(
            dto.empresa_id,
            [articulo?.cuenta_inventario, '143505', '1435', '14'],
            ClaseCuenta.ACTIVO,
          );

          if (lin.tipo_movimiento === 'ENTRADA') {
            // Sobrante: Débito Inventarios (Aumenta Activo) / Crédito Aprovechamientos (Ingreso Extraordinario)
            const cuentaIngreso = await this.buscarCuentaAuxiliar(
              dto.empresa_id,
              ['429553', '4295', '4210', '42'],
              ClaseCuenta.INGRESO,
            );

            lineasContables.push({
              cuenta_id: cuentaInventario.id,
              debito: costoTotal,
              credito: 0,
              glosa_detalle: `Ajuste Sobrante ${numeroNota}: ${articulo?.codigo || ''} ${articulo?.nombre || ''}`,
              documento_referencia: numeroNota,
            });

            lineasContables.push({
              cuenta_id: cuentaIngreso.id,
              debito: 0,
              credito: costoTotal,
              glosa_detalle: `Sobrante Inventario ${numeroNota}: ${articulo?.codigo || ''}`,
              documento_referencia: numeroNota,
            });
          } else {
            // Salida: Débito Pérdidas/Gastos (Aumenta Gasto) / Crédito Inventarios (Disminuye Activo)
            const cuentaGasto = await this.buscarCuentaAuxiliar(
              dto.empresa_id,
              [articulo?.cuenta_gasto, '531520', '5315', '519595', '5195', '51'],
              ClaseCuenta.GASTO,
            );

            lineasContables.push({
              cuenta_id: cuentaGasto.id,
              debito: costoTotal,
              credito: 0,
              glosa_detalle: `Baja/Merma Inventario ${numeroNota}: ${articulo?.codigo || ''} ${articulo?.nombre || ''}`,
              documento_referencia: numeroNota,
            });

            lineasContables.push({
              cuenta_id: cuentaInventario.id,
              debito: 0,
              credito: costoTotal,
              glosa_detalle: `Salida Ajuste ${numeroNota}: ${articulo?.codigo || ''}`,
              documento_referencia: numeroNota,
            });
          }
        }

        if (lineasContables.length > 0) {
          const asientoCreado = await this.asientosService.create({
            empresa_id: dto.empresa_id,
            tipo_comprobante: TipoComprobante.AJU,
            fecha_contable: dto.fecha_ajuste,
            glosa_general: `Comprobante de Ajuste ${numeroNota} (${dto.tipo_ajuste}): ${dto.justificacion.slice(0, 150)}`,
            estado: EstadoAsiento.CONTABILIZADO,
            origen_sistema: 'INVENTARIOS',
            origen_documento_tipo: 'NOTA_AJUSTE',
            origen_documento_id: guardada.id,
            lineas: lineasContables,
            created_by: dto.usuario_id,
          });

          await this.notaAjusteRepo.update(guardada.id, { asiento_id: asientoCreado.id });
          guardada.asiento_id = asientoCreado.id;
          guardada.asiento = asientoCreado;

          // Pista de Auditoría Obligatoria
          await this.auditoriaService.registrarLog({
            empresa_id: dto.empresa_id,
            usuario_id: dto.usuario_id || null,
            usuario_email: dto.creado_por || 'sistema@pacyolo.com',
            modulo: 'INVENTARIOS',
            accion: 'REGISTRAR_NOTA_AJUSTE',
            entidad_id: guardada.id,
            metodo_http: 'POST',
            ruta: '/api/v1/inventarios/ajustes',
            datos_nuevos: {
              numero_nota: numeroNota,
              tipo_ajuste: dto.tipo_ajuste,
              total_ajuste: totalAjuste,
              asiento_id: asientoCreado.id,
              numero_comprobante: asientoCreado.numero_comprobante,
            },
          });
        }
      } catch (asientoErr: any) {
        console.error(`Error generando asiento para nota de ajuste ${numeroNota}:`, asientoErr.message);
      }
    }

    return guardada;
  }

  async anularNotaAjuste(id: string, motivo: string, usuarioId?: string): Promise<NotaAjuste> {
    const nota = await this.notaAjusteRepo.findOne({
      where: { id },
      relations: {
        lineas: { articulo: true },
        asiento: true,
      },
    });

    if (!nota) {
      throw new NotFoundException(`Nota de ajuste con ID '${id}' no existe.`);
    }

    if (nota.estado === 'ANULADA') {
      throw new BadRequestException('Esta nota de ajuste ya se encuentra anulada.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Revertir impacto físico en SaldoBodega, Articulo y Kardex
      for (const lin of nota.lineas) {
        const cantidad = Number(lin.cantidad);
        const articulo = await queryRunner.manager.findOne(Articulo, { where: { id: lin.articulo_id } });
        if (!articulo) continue;

        let saldoBodega = await queryRunner.manager.findOne(SaldoBodega, {
          where: {
            empresa_id: nota.empresa_id,
            bodega_id: nota.bodega_id,
            articulo_id: articulo.id,
          },
        });

        const stockPrevioBodega = saldoBodega ? Number(saldoBodega.stock_actual) : 0;
        const stockPrevioGlobal = Number(articulo.stock_actual);

        let nuevoStockBodega = stockPrevioBodega;
        let nuevoStockGlobal = stockPrevioGlobal;

        // Invertir el movimiento original
        if (lin.tipo_movimiento === 'ENTRADA') {
          // El ajuste original sumó, la anulación resta: VALIDAR QUE NO DEJE STOCK NEGATIVO
          if (stockPrevioBodega < cantidad) {
            throw new BadRequestException(
              `No es posible anular la nota de ajuste ${nota.numero_nota}: el stock actual en bodega para '${articulo.nombre}' (${stockPrevioBodega} unidades) es inferior a la cantidad a revertir (${cantidad} unidades).`
            );
          }
          nuevoStockBodega = Number((stockPrevioBodega - cantidad).toFixed(2));
          nuevoStockGlobal = Number((stockPrevioGlobal - cantidad).toFixed(2));
        } else {
          // El ajuste original restó, la anulación suma
          nuevoStockBodega = Number((stockPrevioBodega + cantidad).toFixed(2));
          nuevoStockGlobal = Number((stockPrevioGlobal + cantidad).toFixed(2));
        }

        if (saldoBodega) {
          saldoBodega.stock_actual = nuevoStockBodega;
          await queryRunner.manager.save(saldoBodega);
        }

        articulo.stock_actual = nuevoStockGlobal;
        await queryRunner.manager.save(articulo);

        // Registrar movimiento de reversión en Kardex
        const kardex = queryRunner.manager.create(KardexMovimiento, {
          empresa_id: nota.empresa_id,
          articulo_id: articulo.id,
          bodega_id: nota.bodega_id,
          tipo_movimiento_id: null,
          naturaleza: 'AJUSTE',
          fecha_movimiento: new Date().toISOString().slice(0, 10),
          documento_referencia: `REV-${nota.numero_nota}`,
          cantidad_entrada: lin.tipo_movimiento === 'SALIDA' ? cantidad : 0,
          costo_unitario_entrada: lin.tipo_movimiento === 'SALIDA' ? Number(lin.costo_unitario) : 0,
          costo_total_entrada: lin.tipo_movimiento === 'SALIDA' ? Number(lin.costo_total) : 0,
          cantidad_salida: lin.tipo_movimiento === 'ENTRADA' ? cantidad : 0,
          costo_unitario_salida: lin.tipo_movimiento === 'ENTRADA' ? Number(lin.costo_unitario) : 0,
          costo_total_salida: lin.tipo_movimiento === 'ENTRADA' ? Number(lin.costo_total) : 0,
          saldo_cantidad_resultante: nuevoStockBodega,
          costo_unitario_promedio_resultante: Number(articulo.costo_promedio),
          saldo_costo_total_resultante: Number((nuevoStockBodega * Number(articulo.costo_promedio)).toFixed(2)),
          observaciones: `ANULACIÓN de ${nota.numero_nota}: ${motivo}`,
        });
        await queryRunner.manager.save(kardex);
      }

      nota.estado = 'ANULADA';
      await queryRunner.manager.save(nota);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // 2. Anular el Asiento Contable asociado (generando asiento de reversión)
    if (nota.asiento_id) {
      try {
        await this.asientosService.anular(
          nota.asiento_id,
          `Anulación de Nota de Ajuste ${nota.numero_nota}: ${motivo}`,
          usuarioId,
        );
      } catch (asientoErr: any) {
        console.error(`Error anulando asiento contable ${nota.asiento_id}:`, asientoErr.message);
      }
    }

    // 3. Pista de Auditoría Obligatoria
    await this.auditoriaService.registrarLog({
      empresa_id: nota.empresa_id,
      usuario_id: usuarioId || null,
      usuario_email: 'sistema@pacyolo.com',
      modulo: 'INVENTARIOS',
      accion: 'ANULAR_NOTA_AJUSTE',
      entidad_id: nota.id,
      metodo_http: 'POST',
      ruta: `/api/v1/inventarios/ajustes/${id}/anular`,
      datos_nuevos: {
        numero_nota: nota.numero_nota,
        motivo,
        asiento_anulado_id: nota.asiento_id,
      },
    });

    return nota;
  }

  // =========================================================================
  // CONSULTA DE KARDEX Y SALDOS
  // =========================================================================

  async consultarKardex(filtro: {
    empresaId?: string;
    articuloId?: string;
    bodegaId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<KardexMovimiento[]> {
    const qb = this.kardexRepo.createQueryBuilder('k')
      .leftJoinAndSelect('k.articulo', 'art')
      .leftJoinAndSelect('k.bodega', 'b')
      .leftJoinAndSelect('k.tipo_movimiento', 'tm');

    if (filtro.empresaId) {
      qb.where('k.empresa_id = :empresaId', { empresaId: filtro.empresaId });
    }

    if (filtro.articuloId) {
      qb.andWhere('k.articulo_id = :articuloId', { articuloId: filtro.articuloId });
    }

    if (filtro.bodegaId) {
      qb.andWhere('k.bodega_id = :bodegaId', { bodegaId: filtro.bodegaId });
    }

    if (filtro.fechaDesde) {
      qb.andWhere('k.fecha_movimiento >= :fechaDesde', { fechaDesde: filtro.fechaDesde });
    }

    if (filtro.fechaHasta) {
      qb.andWhere('k.fecha_movimiento <= :fechaHasta', { fechaHasta: filtro.fechaHasta });
    }

    return await qb.orderBy('k.created_at', 'ASC').getMany();
  }

  async consultarExistenciasBodega(empresaId?: string, bodegaId?: string): Promise<SaldoBodega[]> {
    const qb = this.saldoBodegaRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.articulo', 'art')
      .leftJoinAndSelect('s.bodega', 'b');

    if (empresaId) {
      qb.where('s.empresa_id = :empresaId', { empresaId });
    }

    if (bodegaId) {
      qb.andWhere('s.bodega_id = :bodegaId', { bodegaId });
    }

    return await qb.orderBy('art.nombre', 'ASC').getMany();
  }

  // =========================================================================
  // TRASLADOS ENTRE BODEGAS
  // =========================================================================

  async registrarTrasladoBodegas(dto: CreateTrasladoDto): Promise<{
    numero_traslado: string;
    fecha_traslado: string;
    bodega_origen_id: string;
    bodega_destino_id: string;
    lineas_trasladadas: number;
    mensaje: string;
  }> {
    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException('El traslado debe contener al menos un artículo.');
    }
    if (dto.bodega_origen_id === dto.bodega_destino_id) {
      throw new BadRequestException('La bodega de origen no puede ser igual a la bodega de destino.');
    }

    const bodegaOrigen = await this.bodegaRepo.findOne({ where: { id: dto.bodega_origen_id } });
    if (!bodegaOrigen) {
      throw new NotFoundException(`La bodega de origen con ID '${dto.bodega_origen_id}' no existe.`);
    }

    const bodegaDestino = await this.bodegaRepo.findOne({ where: { id: dto.bodega_destino_id } });
    if (!bodegaDestino) {
      throw new NotFoundException(`La bodega de destino con ID '${dto.bodega_destino_id}' no existe.`);
    }

    let tmTraslado = await this.tipoMovimientoRepo.findOne({ where: { codigo: 'TRASLADO' } });
    const tipoMovId = tmTraslado ? tmTraslado.id : null;

    const conteo = await this.kardexRepo.count({
      where: {
        documento_referencia: Like('TR-%'),
        ...(dto.empresa_id ? { empresa_id: dto.empresa_id } : {}),
      },
    });
    const numeroTraslado = `TR-${String(Math.floor(conteo / 2) + 1).padStart(4, '0')}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const lin of dto.lineas) {
        const articulo = await queryRunner.manager.findOne(Articulo, { where: { id: lin.articulo_id } });
        if (!articulo) {
          throw new NotFoundException(`El artículo con ID '${lin.articulo_id}' no existe.`);
        }

        const cantidad = Number(lin.cantidad);
        if (cantidad <= 0) {
          throw new BadRequestException(`La cantidad a trasladar debe ser mayor a cero para '${articulo.nombre}'.`);
        }

        // 1. Validar y descontar stock en bodega origen
        let saldoOrigen = await queryRunner.manager.findOne(SaldoBodega, {
          where: {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_origen_id,
            articulo_id: articulo.id,
          },
        });

        const stockOrigenPrevio = saldoOrigen ? Number(saldoOrigen.stock_actual) : 0;
        if (!saldoOrigen || stockOrigenPrevio < cantidad) {
          throw new BadRequestException(
            `Stock insuficiente en bodega '${bodegaOrigen.nombre}' para '${articulo.nombre}'. Disponible: ${stockOrigenPrevio}, Solicitado: ${cantidad}`,
          );
        }

        const costoUnitario = saldoOrigen ? Number(saldoOrigen.costo_promedio) : Number(articulo.costo_promedio);
        const costoTotal = Number((cantidad * costoUnitario).toFixed(2));

        const nuevoStockOrigen = Number((stockOrigenPrevio - cantidad).toFixed(2));
        saldoOrigen.stock_actual = nuevoStockOrigen;
        await queryRunner.manager.save(saldoOrigen);

        // 2. Incrementar stock en bodega destino
        let saldoDestino = await queryRunner.manager.findOne(SaldoBodega, {
          where: {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_destino_id,
            articulo_id: articulo.id,
          },
        });

        const stockDestinoPrevio = saldoDestino ? Number(saldoDestino.stock_actual) : 0;
        const costoDestinoPrevio = saldoDestino ? Number(saldoDestino.costo_promedio) : costoUnitario;
        const nuevoStockDestino = Number((stockDestinoPrevio + cantidad).toFixed(2));
        const nuevoCostoDestino = nuevoStockDestino > 0
          ? Number(((stockDestinoPrevio * costoDestinoPrevio + cantidad * costoUnitario) / nuevoStockDestino).toFixed(2))
          : costoUnitario;

        if (!saldoDestino) {
          saldoDestino = queryRunner.manager.create(SaldoBodega, {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_destino_id,
            articulo_id: articulo.id,
            stock_actual: nuevoStockDestino,
            costo_promedio: nuevoCostoDestino,
          });
        } else {
          saldoDestino.stock_actual = nuevoStockDestino;
          saldoDestino.costo_promedio = nuevoCostoDestino;
        }
        await queryRunner.manager.save(saldoDestino);

        // 3. Kardex: Salida de Bodega Origen
        const kardexSalida = queryRunner.manager.create(KardexMovimiento, {
          empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
          articulo_id: articulo.id,
          bodega_id: dto.bodega_origen_id,
          tipo_movimiento_id: tipoMovId,
          naturaleza: 'SALIDA',
          fecha_movimiento: dto.fecha_traslado,
          documento_referencia: numeroTraslado,
          cantidad_entrada: 0,
          costo_unitario_entrada: 0,
          costo_total_entrada: 0,
          cantidad_salida: cantidad,
          costo_unitario_salida: costoUnitario,
          costo_total_salida: costoTotal,
          saldo_cantidad_resultante: nuevoStockOrigen,
          costo_unitario_promedio_resultante: Number(saldoOrigen.costo_promedio),
          saldo_costo_total_resultante: Number((nuevoStockOrigen * Number(saldoOrigen.costo_promedio)).toFixed(2)),
          observaciones: `Traslado salida hacia '${bodegaDestino.nombre}' - Ref: ${numeroTraslado}. ${dto.observaciones || ''}`,
        });
        await queryRunner.manager.save(kardexSalida);

        // 4. Kardex: Entrada a Bodega Destino
        const kardexEntrada = queryRunner.manager.create(KardexMovimiento, {
          empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
          articulo_id: articulo.id,
          bodega_id: dto.bodega_destino_id,
          tipo_movimiento_id: tipoMovId,
          naturaleza: 'ENTRADA',
          fecha_movimiento: dto.fecha_traslado,
          documento_referencia: numeroTraslado,
          cantidad_entrada: cantidad,
          costo_unitario_entrada: costoUnitario,
          costo_total_entrada: costoTotal,
          cantidad_salida: 0,
          costo_unitario_salida: 0,
          costo_total_salida: 0,
          saldo_cantidad_resultante: nuevoStockDestino,
          costo_unitario_promedio_resultante: nuevoCostoDestino,
          saldo_costo_total_resultante: Number((nuevoStockDestino * nuevoCostoDestino).toFixed(2)),
          observaciones: `Traslado entrada desde '${bodegaOrigen.nombre}' - Ref: ${numeroTraslado}. ${dto.observaciones || ''}`,
        });
        await queryRunner.manager.save(kardexEntrada);
      }

      await queryRunner.commitTransaction();

      return {
        numero_traslado: numeroTraslado,
        fecha_traslado: dto.fecha_traslado,
        bodega_origen_id: dto.bodega_origen_id,
        bodega_destino_id: dto.bodega_destino_id,
        lineas_trasladadas: dto.lineas.length,
        mensaje: `Traslado ${numeroTraslado} completado exitosamente entre bodegas.`,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async listarTraslados(empresaId?: string): Promise<any[]> {
    const qb = this.kardexRepo.createQueryBuilder('k')
      .leftJoinAndSelect('k.articulo', 'art')
      .leftJoinAndSelect('k.bodega', 'bod')
      .where("k.documento_referencia LIKE 'TR-%'")
      .andWhere("k.naturaleza = 'SALIDA'");

    if (empresaId) {
      qb.andWhere('k.empresa_id = :empresaId', { empresaId });
    }

    return await qb.orderBy('k.created_at', 'DESC').getMany();
  }
}
