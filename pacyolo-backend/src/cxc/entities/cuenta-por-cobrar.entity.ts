import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { Tercero } from '../../terceros/entities/tercero.entity.js';
import { Asiento } from '../../asientos/entities/asiento.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum EstadoCuentaPorCobrar {
  PENDIENTE = 'PENDIENTE',
  COBRADA_PARCIAL = 'COBRADA_PARCIAL',
  COBRADA_TOTAL = 'COBRADA_TOTAL',
  ANULADA = 'ANULADA',
}

@Entity({ name: 'cont_cuentas_por_cobrar', schema: 'contabilidad' })
@Index(['empresa_id', 'tercero_id'])
@Index(['empresa_id', 'estado'])
@Index(['empresa_id', 'fecha_vencimiento'])
export class CuentaPorCobrar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  tercero_id: string; // Cliente

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'tercero_id' })
  tercero: Tercero;

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null; // Asiento contable (tipo CAU / FAC), nulo si está en borrador

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento | null;

  @Column({ type: 'uuid' })
  cuenta_activo_id: string; // Cuenta 130505 donde se debitó la cartera

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_activo_id' })
  cuenta_activo: PucCuenta;

  @Column({ type: 'varchar', length: 50 })
  numero_factura: string; // Ej: FAC-1001

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_impuestos: number; // IVA generado u otros tributos

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_retenciones: number; // Retenciones practicadas por el cliente a favor nuestro

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total_factura: number; // Monto total liquidado a cobrar

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  saldo_pendiente: number; // Saldo insoluto de la cartera

  @Column({
    type: 'enum',
    enum: EstadoCuentaPorCobrar,
    default: EstadoCuentaPorCobrar.PENDIENTE,
  })
  estado: EstadoCuentaPorCobrar;

  @Column({ type: 'varchar', length: 50, default: 'INTEGRACION_EXTERNA' })
  origen_sistema: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  origen_documento_id: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
