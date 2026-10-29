import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { CuentaPorPagar } from './cuenta-por-pagar.entity.js';
import { Asiento } from '../../asientos/entities/asiento.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum MetodoPago {
  TRANSFERENCIA = 'TRANSFERENCIA',
  CONSIGNACION = 'CONSIGNACION',
  CHEQUE = 'CHEQUE',
  EFECTIVO = 'EFECTIVO',
}

@Entity({ name: 'cont_pagos_cxp', schema: 'contabilidad' })
@Index(['empresa_id', 'cuenta_por_pagar_id'])
export class PagoCxp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  cuenta_por_pagar_id: string;

  @ManyToOne(() => CuentaPorPagar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_por_pagar_id' })
  cuenta_por_pagar: CuentaPorPagar;

  @Column({ type: 'uuid' })
  asiento_id: string; // Comprobante de egreso (tipo EGR)

  @ManyToOne(() => Asiento)
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento;

  @Column({ type: 'uuid' })
  cuenta_banco_id: string; // Cuenta auxiliar de Banco/Caja (1110xx, 1105xx)

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_banco_id' })
  cuenta_banco: PucCuenta;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  monto_pagado: number;

  @Column({ type: 'date' })
  fecha_pago: string;

  @Column({ type: 'enum', enum: MetodoPago, default: MetodoPago.TRANSFERENCIA })
  metodo_pago: MetodoPago;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia_transaccion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  glosa: string | null;

  @Column({ type: 'varchar', length: 20, default: 'APLICADO' })
  estado: 'APLICADO' | 'ANULADO';

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string | null;

  @Column({ type: 'text', nullable: true })
  motivo_anulacion: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  anulado_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  anulado_por: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
