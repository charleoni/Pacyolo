import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Tercero } from '../../terceros/entities/tercero.entity.js';
import { Bodega } from '../../parametros/entities/bodega.entity.js';
import { Articulo } from '../../inventarios/entities/articulo.entity.js';
import { EntradaAlmacen } from '../../inventarios/entities/entrada-almacen.entity.js';
import { CuentaPorPagar } from '../../cxp/entities/cuenta-por-pagar.entity.js';

export type EstadoOrdenCompra =
  | 'BORRADOR'
  | 'APROBADA'
  | 'RECIBIDA_PARCIAL'
  | 'RECIBIDA_TOTAL'
  | 'CANCELADA';

@Entity({ name: 'compras_ordenes', schema: 'core' })
@Unique(['empresa_id', 'numero_orden'])
export class OrdenCompra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  empresa_id: string;

  @Column({ type: 'varchar', length: 30 })
  numero_orden: string; // ej: OC-0001

  @Column({ type: 'uuid' })
  @Index()
  proveedor_id: string;

  @ManyToOne(() => Tercero, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Tercero;

  @Column({ type: 'uuid', nullable: true })
  bodega_destino_id: string | null;

  @ManyToOne(() => Bodega, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bodega_destino_id' })
  bodega_destino: Bodega | null;

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({ type: 'date', nullable: true })
  fecha_entrega_esperada: string | null;

  @Column({ type: 'varchar', length: 20, default: 'CREDITO' })
  condicion_pago: 'CONTADO' | 'CREDITO';

  @Column({ type: 'int', default: 30 })
  dias_credito: number;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  metodo_pago: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_factura_proveedor: string | null;

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  cxp_id: string | null;

  @ManyToOne(() => CuentaPorPagar, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cxp_id' })
  cxp: CuentaPorPagar | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'BORRADOR',
  })
  estado: EstadoOrdenCompra;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_impuestos: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @OneToMany(() => OrdenCompraLinea, (linea) => linea.orden_compra, {
    cascade: true,
    eager: true,
  })
  lineas: OrdenCompraLinea[];

  @OneToMany(() => EntradaAlmacen, (ent) => ent.orden_compra)
  entradas: EntradaAlmacen[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

@Entity({ name: 'compras_orden_lineas', schema: 'core' })
export class OrdenCompraLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  orden_compra_id: string;

  @ManyToOne(() => OrdenCompra, (orden) => orden.lineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orden_compra_id' })
  orden_compra: OrdenCompra;

  @Column({ type: 'uuid' })
  @Index()
  articulo_id: string;

  @ManyToOne(() => Articulo, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  cantidad_solicitada: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  cantidad_recibida: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19 })
  porcentaje_iva: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;
}
