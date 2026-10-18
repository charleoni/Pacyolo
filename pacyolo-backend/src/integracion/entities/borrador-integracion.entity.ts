import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { Asiento } from '../../asientos/entities/asiento.entity.js';

export enum TipoBorradorIntegracion {
  FACTURA_VENTA = 'FACTURA_VENTA',
  RECAUDO_COBRO = 'RECAUDO_COBRO',
  FACTURA_COMPRA = 'FACTURA_COMPRA',
  PAGO_EGRESO = 'PAGO_EGRESO',
}

export enum EstadoBorradorIntegracion {
  PENDIENTE_REVISION = 'PENDIENTE_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity({ name: 'cont_borradores_integracion', schema: 'contabilidad' })
@Unique(['empresa_id', 'origen_sistema', 'origen_documento_id'])
@Index(['empresa_id', 'estado'])
@Index(['empresa_id', 'tipo_documento'])
export class BorradorIntegracion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({
    type: 'enum',
    enum: TipoBorradorIntegracion,
  })
  tipo_documento: TipoBorradorIntegracion;

  @Column({ type: 'varchar', length: 50 })
  origen_sistema: string; // Ej: 'SHOPIFY', 'FACTURADOR_DIAN', 'ERP_COMERCIAL'

  @Column({ type: 'varchar', length: 100 })
  origen_documento_id: string; // Ej: 'ORDER-9921', 'INV-5501'

  @Column({
    type: 'enum',
    enum: EstadoBorradorIntegracion,
    default: EstadoBorradorIntegracion.PENDIENTE_REVISION,
  })
  estado: EstadoBorradorIntegracion;

  @Column({ type: 'jsonb' })
  payload_datos: Record<string, any>; // El DTO recibido originalmente

  @Column({ type: 'jsonb', nullable: true })
  asiento_propuesto: Record<string, any>; // Las líneas y cuentas contables pre-calculadas

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null; // Asiento contable final cuando se aprueba

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento | null;

  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  revisado_por: string;

  @Column({ type: 'timestamptz', nullable: true })
  revisado_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
