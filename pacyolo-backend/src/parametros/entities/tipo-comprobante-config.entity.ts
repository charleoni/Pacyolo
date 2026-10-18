import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'cont_tipos_comprobante', schema: 'contabilidad' })
@Unique(['empresa_id', 'codigo'])
export class TipoComprobanteConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 10 })
  codigo: string; // 'DIA', 'ING', 'EGR', 'CAU', 'AJU', 'APE', 'NC', 'ND'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 10, default: '' })
  prefijo: string; // 'DIA-', 'RC-', 'CE-', etc.

  @Column({ type: 'int', default: 1 })
  consecutivo_inicial: number;

  @Column({ type: 'int', default: 0 })
  consecutivo_actual: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
