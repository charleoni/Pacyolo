import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Articulo } from './articulo.entity.js';
import { Bodega } from '../../parametros/entities/bodega.entity.js';
import { TipoMovimiento } from '../../parametros/entities/tipo-movimiento.entity.js';

export type NaturalezaMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO';

@Entity({ name: 'inv_kardex_movimientos', schema: 'core' })
export class KardexMovimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  empresa_id: string;

  @Column({ type: 'uuid' })
  @Index()
  articulo_id: string;

  @ManyToOne(() => Articulo, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

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

  @Column({ type: 'varchar', length: 20 })
  naturaleza: NaturalezaMovimiento;

  @Column({ type: 'date' })
  fecha_movimiento: string;

  @Column({ type: 'varchar', length: 60 })
  documento_referencia: string; // ej: 'EA-0001', 'AJ-0001', 'FAC-0001'

  // Entradas
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  cantidad_entrada: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario_entrada: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total_entrada: number;

  // Salidas
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  cantidad_salida: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario_salida: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total_salida: number;

  // Saldos resultantes (Kardex continuo NIIF)
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  saldo_cantidad_resultante: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario_promedio_resultante: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  saldo_costo_total_resultante: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
