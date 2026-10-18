import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'core_regimenes_fiscales', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class RegimenFiscal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  codigo: string; // 'RESPONSABLE_IVA', 'NO_RESPONSABLE_IVA', 'REGIMEN_SIMPLE', 'GRAN_CONTRIBUYENTE', 'AUTORRETENEDOR'

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codigo_responsabilidad_dian: string | null; // 'R-99-PN', 'O-13', 'O-23'

  @Column({ type: 'boolean', default: false })
  aplica_iva: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
