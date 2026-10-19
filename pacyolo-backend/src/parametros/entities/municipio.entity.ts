import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'core_municipios', schema: 'core' })
@Unique(['codigo'])
export class Municipio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  @Index()
  codigo: string; // Código DANE 5 dígitos ('11001', '05001', '76001', etc.)

  @Column({ type: 'varchar', length: 150 })
  @Index()
  nombre: string;

  @Column({ type: 'varchar', length: 10 })
  @Index()
  departamento_codigo: string; // '11', '05', etc.

  @Column({ type: 'varchar', length: 100 })
  departamento_nombre: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
