import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'core_unidades_medida', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class UnidadMedida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 15 })
  codigo: string; // 'UND', 'KGM', 'MTR', 'GLI', 'CJ', 'PAQ'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_dian: string | null; // Código DIAN / ISO (ej. '94', 'KGM', 'MTR')

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
