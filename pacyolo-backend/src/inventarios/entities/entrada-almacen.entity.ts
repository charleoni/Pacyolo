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
import { TipoMovimiento } from '../../parametros/entities/tipo-movimiento.entity.js';
import { Articulo } from './articulo.entity.js';

export type EstadoEntradaAlmacen = 'CONFIRMADA' | 'ANULADA';

@Entity({ name: 'inv_entradas_almacen', schema: 'core' })
@Unique(['empresa_id', 'numero_entrada'])
export class EntradaAlmacen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  empresa_id: string;

  @Column({ type: 'varchar', length: 30 })
  numero_entrada: string; // ej: EA-0001

  @Column({ type: 'uuid', nullable: true })
  @Index()
  orden_compra_id: string | null;

  @Column({ type: 'uuid' })
  @Index()
  proveedor_id: string;

  @ManyToOne(() => Tercero, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Tercero;

  @Column({ type: 'uuid' })
  @Index()
  bodega_id: string;

  @ManyToOne(() => Bodega, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bodega_id' })
  bodega: Bodega;

  @Column({ type: 'uuid', nullable: true })
  tipo_movimiento_id: string | null;

  @ManyToOne(() => TipoMovimiento, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tipo_movimiento_id' })
  tipo_movimiento: TipoMovimiento | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  numero_remision_proveedor: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  numero_factura_proveedor: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  cxp_id: string | null;

  @Column({ type: 'date' })
  fecha_entrada: string;

  @Column({ type: 'varchar', length: 20, default: 'CONFIRMADA' })
  estado: EstadoEntradaAlmacen;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_valorado: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @OneToMany(() => EntradaAlmacenLinea, (linea) => linea.entrada_almacen, {
    cascade: true,
    eager: true,
  })
  lineas: EntradaAlmacenLinea[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

@Entity({ name: 'inv_entrada_lineas', schema: 'core' })
export class EntradaAlmacenLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  entrada_almacen_id: string;

  @ManyToOne(() => EntradaAlmacen, (entrada) => entrada.lineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entrada_almacen_id' })
  entrada_almacen: EntradaAlmacen;

  @Column({ type: 'uuid' })
  @Index()
  articulo_id: string;

  @ManyToOne(() => Articulo, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total: number;
}
