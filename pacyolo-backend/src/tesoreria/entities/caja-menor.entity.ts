import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { Tercero } from '../../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum EstadoCajaMenor {
  ABIERTA = 'ABIERTA',
  EN_REPOSICION = 'EN_REPOSICION',
  CERRADA = 'CERRADA',
}

@Entity({ name: 'teso_cajas_menores', schema: 'contabilidad' })
@Unique(['empresa_id', 'codigo'])
@Index(['empresa_id', 'codigo'])
export class CajaMenor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 30 })
  codigo: string; // Ej: 'CM-01'

  @Column({ type: 'varchar', length: 150 })
  nombre: string; // Ej: 'Caja Menor Administración Central'

  @Column({ type: 'uuid' })
  responsable_id: string;

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'responsable_id' })
  responsable: Tercero;

  @Column({ type: 'uuid' })
  cuenta_puc_id: string;

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_puc_id' })
  cuenta_puc: PucCuenta; // Subcuenta 110510XX

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  monto_fondo_fijo: number; // Monto oficial autorizado (ej. $1.000.000)

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  saldo_actual_efectivo: number; // Efectivo disponible en físico

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  saldo_en_vales: number; // Suma de vales de gastos legalizados no reembolsados

  @Column({
    type: 'enum',
    enum: EstadoCajaMenor,
    default: EstadoCajaMenor.ABIERTA,
  })
  estado: EstadoCajaMenor;

  @Column({ type: 'uuid', nullable: true })
  asiento_apertura_id?: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
