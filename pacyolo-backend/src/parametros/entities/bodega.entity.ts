import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'inv_bodegas', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class Bodega {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  codigo: string; // 'BOD-01', 'BOD-AV', 'BOD-POS'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  responsable: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
