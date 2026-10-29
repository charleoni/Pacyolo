import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Articulo } from './articulo.entity.js';
import { Bodega } from '../../parametros/entities/bodega.entity.js';

@Entity({ name: 'inv_saldos_bodega', schema: 'core' })
@Unique(['empresa_id', 'articulo_id', 'bodega_id'])
export class SaldoBodega {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  empresa_id: string;

  @Column({ type: 'uuid' })
  @Index()
  articulo_id: string;

  @ManyToOne(() => Articulo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'uuid' })
  @Index()
  bodega_id: string;

  @ManyToOne(() => Bodega, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bodega_id' })
  bodega: Bodega;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  stock_actual: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_promedio: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
