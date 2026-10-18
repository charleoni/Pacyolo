import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'core_clasificaciones_tercero', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class ClasificacionTercero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  codigo: string; // 'CLIENTE', 'PROVEEDOR', 'EMPLEADO', 'CONTRATISTA', 'ACCIONISTA', 'ACREEDOR'

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 7, default: '#6366f1' })
  color_badge: string; // Para visualización en la UI

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
