import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { OrdenCompra, EstadoOrdenCompra } from './entities/orden-compra.entity.js';
import { OrdenCompraLinea } from './entities/orden-compra-linea.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { Articulo } from '../inventarios/entities/articulo.entity.js';
import { CreateOrdenCompraDto } from './dto/compras.dto.js';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(OrdenCompra)
    private readonly ordenRepo: Repository<OrdenCompra>,
    @InjectRepository(OrdenCompraLinea)
    private readonly lineaRepo: Repository<OrdenCompraLinea>,
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
    @InjectRepository(Articulo)
    private readonly articuloRepo: Repository<Articulo>,
    private readonly dataSource: DataSource,
  ) {}

  async listarOrdenes(empresaId?: string, estado?: string): Promise<OrdenCompra[]> {
    const qb = this.ordenRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.proveedor', 'p')
      .leftJoinAndSelect('o.bodega_destino', 'b')
      .leftJoinAndSelect('o.lineas', 'l')
      .leftJoinAndSelect('l.articulo', 'art');

    if (empresaId) {
      qb.where('o.empresa_id = :empresaId', { empresaId });
    }

    if (estado) {
      qb.andWhere('o.estado = :estado', { estado });
    }

    return await qb.orderBy('o.created_at', 'DESC').getMany();
  }

  async obtenerOrden(id: string): Promise<OrdenCompra> {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: {
        proveedor: true,
        bodega_destino: true,
        lineas: {
          articulo: true,
        },
      },
    });
    if (!orden) {
      throw new NotFoundException(`La orden de compra con ID '${id}' no existe.`);
    }
    return orden;
  }

  async crearOrden(dto: CreateOrdenCompraDto): Promise<OrdenCompra> {
    if (!dto.lineas || dto.lineas.length === 0) {
      throw new BadRequestException('La orden de compra debe contener al menos una línea de producto.');
    }

    // Verificar proveedor
    const proveedor = await this.terceroRepo.findOne({ where: { id: dto.proveedor_id } });
    if (!proveedor) {
      throw new NotFoundException(`El proveedor con ID '${dto.proveedor_id}' no existe.`);
    }

    // Generar consecutivo OC-XXXX
    let numeroOrden = dto.numero_orden;
    if (!numeroOrden) {
      const conteo = await this.ordenRepo.count({
        where: { empresa_id: dto.empresa_id ? dto.empresa_id : IsNull() },
      });
      numeroOrden = `OC-${String(conteo + 1).padStart(4, '0')}`;
    }

    let subtotalGeneral = 0;
    let impuestosGeneral = 0;
    let totalGeneral = 0;

    const lineasEntities: OrdenCompraLinea[] = [];

    for (const lin of dto.lineas) {
      const articulo = await this.articuloRepo.findOne({ where: { id: lin.articulo_id } });
      if (!articulo) {
        throw new NotFoundException(`El artículo con ID '${lin.articulo_id}' no existe.`);
      }

      const cantidad = Number(lin.cantidad_solicitada);
      const costo = Number(lin.costo_unitario);
      const ivaTarifa = lin.porcentaje_iva !== undefined ? Number(lin.porcentaje_iva) : Number(articulo.tarifa_iva || 19);

      const subtotalLinea = Number((cantidad * costo).toFixed(2));
      const ivaLinea = Number(((subtotalLinea * ivaTarifa) / 100).toFixed(2));
      const totalLinea = Number((subtotalLinea + ivaLinea).toFixed(2));

      subtotalGeneral += subtotalLinea;
      impuestosGeneral += ivaLinea;
      totalGeneral += totalLinea;

      const nuevaLinea = this.lineaRepo.create({
        articulo_id: articulo.id,
        cantidad_solicitada: cantidad,
        cantidad_recibida: 0,
        costo_unitario: costo,
        porcentaje_iva: ivaTarifa,
        subtotal: subtotalLinea,
        total: totalLinea,
      });
      lineasEntities.push(nuevaLinea);
    }

    const nuevaOrden = this.ordenRepo.create({
      empresa_id: dto.empresa_id || '00000000-0000-0000-0000-000000000000',
      numero_orden: numeroOrden,
      proveedor_id: dto.proveedor_id,
      bodega_destino_id: dto.bodega_destino_id || null,
      fecha_emision: dto.fecha_emision,
      fecha_entrega_esperada: dto.fecha_entrega_esperada || null,
      estado: 'BORRADOR',
      subtotal: subtotalGeneral,
      total_impuestos: impuestosGeneral,
      total: totalGeneral,
      observaciones: dto.observaciones || null,
      lineas: lineasEntities,
    });

    return await this.ordenRepo.save(nuevaOrden);
  }

  async cambiarEstado(id: string, nuevoEstado: EstadoOrdenCompra): Promise<OrdenCompra> {
    const orden = await this.obtenerOrden(id);
    orden.estado = nuevoEstado;
    return await this.ordenRepo.save(orden);
  }

  async registrarRecepcionParcial(
    ordenId: string,
    recepciones: { articulo_id: string; cantidad: number }[],
  ): Promise<OrdenCompra> {
    const orden = await this.obtenerOrden(ordenId);

    let todasCompletas = true;
    let algunaRecibida = false;

    for (const linea of orden.lineas) {
      const match = recepciones.find((r) => r.articulo_id === linea.articulo_id);
      if (match) {
        linea.cantidad_recibida = Number((Number(linea.cantidad_recibida) + Number(match.cantidad)).toFixed(2));
        await this.lineaRepo.save(linea);
      }

      if (Number(linea.cantidad_recibida) > 0) {
        algunaRecibida = true;
      }
      if (Number(linea.cantidad_recibida) < Number(linea.cantidad_solicitada)) {
        todasCompletas = false;
      }
    }

    if (todasCompletas) {
      orden.estado = 'RECIBIDA_TOTAL';
    } else if (algunaRecibida) {
      orden.estado = 'RECIBIDA_PARCIAL';
    }

    return await this.ordenRepo.save(orden);
  }
}
