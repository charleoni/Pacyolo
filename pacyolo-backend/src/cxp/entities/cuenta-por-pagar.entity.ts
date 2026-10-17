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

export enum EstadoCuentaPorPagar {
  PENDIENTE = 'PENDIENTE',
  PAGADA_PARCIAL = 'PAGADA_PARCIAL',
  PAGADA_TOTAL = 'PAGADA_TOTAL',
  ANULADA = 'ANULADA',
}

@Entity({ name: 'cont_cuentas_por_pagar', schema: 'contabilidad' })
@Index(['empresa_id', 'tercero_id'])
@Index(['empresa_id', 'estado'])
@Index(['empresa_id', 'fecha_vencimiento'])
export class CuentaPorPagar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  tercero_id: string;

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'tercero_id' })
  tercero: Tercero;

  @Column({ type: 'uuid' })
  asiento_id: string; // Asiento de causación (tipo CAU)

  @ManyToOne(() => Asiento)
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento;

  @Column({ type: 'uuid' })
  cuenta_pasivo_id: string; // Cuenta 220505 o 2335xx donde se acreditó la deuda

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_pasivo_id' })
  cuenta_pasivo: PucCuenta;

  @Column({ type: 'varchar', length: 50 })
  numero_factura_proveedor: string; // Ej: FAC-8491

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  subtotal: number; // Subtotal antes de impuestos y retenciones

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_iva: number; // IVA descontable

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_retenciones: number; // Suma de Retefuente, ReteICA, etc.

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  monto_total: number; // Valor neto final facturado a pagar al proveedor

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  saldo_pendiente: number; // Saldo remanente por pagar

  @Column({
    type: 'enum',
    enum: EstadoCuentaPorPagar,
    default: EstadoCuentaPorPagar.PENDIENTE,
  })
  estado: EstadoCuentaPorPagar;

  @Column({ type: 'varchar', length: 255, nullable: true })
  glosa: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
