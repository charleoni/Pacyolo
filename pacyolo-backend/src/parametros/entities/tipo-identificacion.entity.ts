import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'core_tipos_identificacion', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class TipoIdentificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null; // null = disponible globalmente

  @Column({ type: 'varchar', length: 20 })
  codigo: string; // 'NIT', 'CC', 'CE', 'TI', 'PASAPORTE', 'PPT'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_dian: string | null; // '31' (NIT), '13' (CC), '22' (CE), '47' (PEP/PPT)

  @Column({ type: 'boolean', default: false })
  aplica_digito_verificacion: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean; // Si es semilla oficial preconfigurada

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
