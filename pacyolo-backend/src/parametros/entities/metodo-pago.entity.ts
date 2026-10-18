import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'core_metodos_pago', schema: 'core' })
@Unique(['empresa_id', 'codigo'])
export class MetodoPago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  empresa_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  codigo: string; // 'EFECTIVO', 'TRANSFERENCIA', 'CONSIGNACION', 'CHEQUE', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'BILLETERA'

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_dian: string | null; // '10' (Efectivo), '47' (Transferencia), etc.

  @Column({ type: 'boolean', default: false })
  exige_referencia: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_sistema: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
