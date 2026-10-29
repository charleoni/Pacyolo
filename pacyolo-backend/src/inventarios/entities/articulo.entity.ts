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
import { CategoriaArticulo } from '../../parametros/entities/categoria-articulo.entity.js';
import { UnidadMedida } from '../../parametros/entities/unidad-medida.entity.js';

export type TipoArticulo = 'INVENTARIABLE' | 'SERVICIO' | 'CONSUMIBLE';

@Entity({ name: 'inv_articulos', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class Articulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  codigo: string; // SKU o código interno

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'INVENTARIABLE',
  })
  tipo_articulo: TipoArticulo;

  @Column({ type: 'uuid', nullable: true })
  categoria_id: string | null;

  @ManyToOne(() => CategoriaArticulo, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaArticulo | null;

  @Column({ type: 'uuid', nullable: true })
  unidad_medida_id: string | null;

  @ManyToOne(() => UnidadMedida, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unidad_medida_id' })
  unidad_medida: UnidadMedida | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codigo_barras: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  precio_venta_sugerido: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_promedio: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  ultimo_costo_compra: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  stock_actual: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  stock_minimo: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  stock_maximo: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19 })
  tarifa_iva: number; // 0, 5, 19%

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  tarifa_inc: number; // 0, 8%

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuenta_inventario: string | null; // e.g. 143505

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuenta_costo_venta: string | null; // e.g. 613505

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuenta_gasto: string | null; // e.g. 513505

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
