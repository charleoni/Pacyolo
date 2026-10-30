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
import { CuentaPorCobrar } from './cuenta-por-cobrar.entity.js';
import { Asiento } from '../../asientos/entities/asiento.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum MetodoRecaudo {
  TRANSFERENCIA = 'TRANSFERENCIA',
  PASARELA_PAGO = 'PASARELA_PAGO',
  CONSIGNACION = 'CONSIGNACION',
  CHEQUE = 'CHEQUE',
  EFECTIVO = 'EFECTIVO',
}

@Entity({ name: 'cont_recaudos_cxc', schema: 'contabilidad' })
@Index(['empresa_id', 'cuenta_por_cobrar_id'])
@Index(['empresa_id', 'origen_sistema', 'origen_documento_id'])
export class RecaudoCxc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  cuenta_por_cobrar_id: string;

  @ManyToOne(() => CuentaPorCobrar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_por_cobrar_id' })
  cuenta_por_cobrar: CuentaPorCobrar;

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null; // Comprobante de ingreso (tipo ING), nulo si está en borrador

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento | null;

  @Column({ type: 'uuid' })
  cuenta_banco_id: string; // Cuenta auxiliar de Banco/Caja donde ingresa el dinero (1110xx, 1105xx)

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_banco_id' })
  cuenta_banco: PucCuenta;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  monto_recaudo: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  descuento_pronto_pago: number;

  @Column({ type: 'date' })
  fecha_recaudo: string;

  @Column({
    type: 'enum',
    enum: MetodoRecaudo,
    default: MetodoRecaudo.TRANSFERENCIA,
  })
  metodo_recaudo: MetodoRecaudo;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia_transaccion: string; // ID de transacción de pasarela o número de comprobante de banco

  @Column({ type: 'varchar', length: 50, default: 'INTEGRACION_EXTERNA' })
  origen_sistema: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  origen_documento_id: string;

  @Column({ type: 'text', nullable: true })
  glosa: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
