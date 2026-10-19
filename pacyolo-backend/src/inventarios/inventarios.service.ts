import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Articulo } from './entities/articulo.entity.js';
import { SaldoBodega } from './entities/saldo-bodega.entity.js';
import { KardexMovimiento } from './entities/kardex-movimiento.entity.js';
import { EntradaAlmacen } from './entities/entrada-almacen.entity.js';
import { EntradaAlmacenLinea } from './entities/entrada-almacen-linea.entity.js';
import { NotaAjuste } from './entities/nota-ajuste.entity.js';
import { NotaAjusteLinea } from './entities/nota-ajuste-linea.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { TipoMovimiento } from '../parametros/entities/tipo-movimiento.entity.js';
import {
  CreateArticuloDto,
  UpdateArticuloDto,
  CreateEntradaAlmacenDto,
  CreateNotaAjusteDto,
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
    Object.assign(art, {
      ...dto,
      codigo: dto.codigo ? dto.codigo.toUpperCase() : art.codigo,
    });
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
      let totalValorado = 0;
      const lineasEntrada: EntradaAlmacenLinea[] = [];

      for (const lin of dto.lineas) {
        const articulo = await queryRunner.manager.findOne(Articulo, { where: { id: lin.articulo_id } });
        if (!articulo) {
          throw new NotFoundException(`El artículo con ID '${lin.articulo_id}' no existe.`);
        }

        const cantidad = Number(lin.cantidad);
        const costoUnitario = Number(lin.costo_unitario);
        const costoTotal = Number((cantidad * costoUnitario).toFixed(2));
        totalValorado += costoTotal;

        // 1. Crear línea de entrada
        const nuevaLinea = queryRunner.manager.create(EntradaAlmacenLinea, {
          articulo_id: articulo.id,
          cantidad,
          costo_unitario: costoUnitario,
          costo_total: costoTotal,
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

      // 5. Crear cabecera EntradaAlmacen
      const entrada = queryRunner.manager.create(EntradaAlmacen, {
        empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
        numero_entrada: numeroEntrada,
        orden_compra_id: dto.orden_compra_id || null,
        proveedor_id: dto.proveedor_id,
        bodega_id: dto.bodega_id,
        tipo_movimiento_id: tipoMovId,
        numero_remision_proveedor: dto.numero_remision_proveedor || null,
        fecha_entrada: dto.fecha_entrada,
        estado: 'CONFIRMADA',
        total_valorado: totalValorado,
        observaciones: dto.observaciones || null,
        lineas: lineasEntrada,
      });

      const guardada = await queryRunner.manager.save(entrada);
      await queryRunner.commitTransaction();
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

  async listarNotasAjuste(empresaId?: string): Promise<NotaAjuste[]> {
    const qb = this.notaAjusteRepo.createQueryBuilder('n')
      .leftJoinAndSelect('n.bodega', 'b')
      .leftJoinAndSelect('n.lineas', 'l')
      .leftJoinAndSelect('l.articulo', 'art');

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAjuste = 0;
      const lineasAjuste: NotaAjusteLinea[] = [];

      for (const lin of dto.lineas) {
        const articulo = await queryRunner.manager.findOne(Articulo, { where: { id: lin.articulo_id } });
        if (!articulo) {
          throw new NotFoundException(`El artículo con ID '${lin.articulo_id}' no existe.`);
        }

        const cantidad = Number(lin.cantidad);
        const costoUnitario = Number(lin.costo_unitario || articulo.costo_promedio || 0);
        const costoTotal = Number((cantidad * costoUnitario).toFixed(2));
        totalAjuste += costoTotal;

        const nuevaLinea = queryRunner.manager.create(NotaAjusteLinea, {
          articulo_id: articulo.id,
          tipo_movimiento: lin.tipo_movimiento,
          cantidad,
          costo_unitario: costoUnitario,
          costo_total: costoTotal,
        });
        lineasAjuste.push(nuevaLinea);

        // Actualizar saldo por bodega
        let saldoBodega = await queryRunner.manager.findOne(SaldoBodega, {
          where: {
            empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
            bodega_id: dto.bodega_id,
            articulo_id: articulo.id,
          },
        });

        const stockPrevio = saldoBodega ? Number(saldoBodega.stock_actual) : 0;
        const stockGlobalPrevio = Number(articulo.stock_actual);

        let nuevoStockBodega = stockPrevio;
        let nuevoStockGlobal = stockGlobalPrevio;

        if (lin.tipo_movimiento === 'ENTRADA') {
          nuevoStockBodega = stockPrevio + cantidad;
          nuevoStockGlobal = stockGlobalPrevio + cantidad;
        } else {
          nuevoStockBodega = Math.max(0, stockPrevio - cantidad);
          nuevoStockGlobal = Math.max(0, stockGlobalPrevio - cantidad);
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

      const guardada = await queryRunner.manager.save(nota);
      await queryRunner.commitTransaction();
      return guardada;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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
}
