import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'inv_categorias_articulos', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class CategoriaArticulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  codigo: string; // 'MERCANCIA', 'MATERIA_PRIMA', 'INSUMO', 'SERVICIO', 'ACTIVO_FIJO'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuenta_inventario: string | null; // ej. '143505'

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuenta_costo_venta: string | null; // ej. '613505'

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuenta_gasto: string | null; // ej. '513505'

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
