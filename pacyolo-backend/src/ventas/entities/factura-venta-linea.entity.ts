import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FacturaVenta } from './factura-venta.entity.js';
import { Articulo } from '../../inventarios/entities/articulo.entity.js';
import { Bodega } from '../../parametros/entities/bodega.entity.js';

@Entity({ name: 'ventas_facturas_lineas', schema: 'contabilidad' })
export class FacturaVentaLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  factura_id: string;

  @ManyToOne(() => FacturaVenta, (factura) => factura.lineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factura_id' })
  factura: FacturaVenta;

  @Column({ type: 'uuid' })
  articulo_id: string;

  @ManyToOne(() => Articulo)
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'uuid', nullable: true })
  bodega_id: string | null;

  @ManyToOne(() => Bodega, { nullable: true })
  @JoinColumn({ name: 'bodega_id' })
  bodega: Bodega | null;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  cantidad: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  precio_unitario: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  porcentaje_descuento: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  monto_descuento: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  tarifa_iva: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  monto_iva: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  tarifa_inc: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  monto_inc: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario: number; // Costo promedio ponderado móvil al momento de la venta

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total: number; // costo_unitario * cantidad
}
