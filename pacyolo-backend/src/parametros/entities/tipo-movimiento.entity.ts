import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'inv_tipos_movimiento', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class TipoMovimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  codigo: string; // 'ENT_COMPRA', 'ENT_AJUSTE', 'SAL_MERMA', 'SAL_CONSUMO', 'TRASLADO'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, default: 'ENTRADA' })
  naturaleza: string; // 'ENTRADA', 'SALIDA', 'TRASLADO'

  @Column({ type: 'boolean', default: true })
  afecta_costo_promedio: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
