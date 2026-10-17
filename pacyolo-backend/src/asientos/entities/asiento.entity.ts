import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';
import { Tercero } from '../../terceros/entities/tercero.entity.js';

export enum TipoComprobante {
  ING = 'ING', // Ingreso / Recibo de Caja
  EGR = 'EGR', // Egreso / Comprobante de Pago
  DIA = 'DIA', // Diario
  CAU = 'CAU', // Causación de Cuentas por Pagar o Cobrar
  AJU = 'AJU', // Ajuste contable
  APE = 'APE', // Apertura / Saldos Iniciales
  CIE = 'CIE', // Cierre de Período
}

export enum EstadoAsiento {
  BORRADOR = 'BORRADOR',
  REVISION_INTEGRACION = 'REVISION_INTEGRACION', // Enviado por API externa pendiente de aprobación
  CONTABILIZADO = 'CONTABILIZADO',
  ANULADO = 'ANULADO',
}

@Entity({ name: 'cont_asientos', schema: 'contabilidad' })
@Unique(['empresa_id', 'tipo_comprobante', 'consecutivo'])
@Index(['empresa_id', 'tipo_comprobante', 'consecutivo'])
@Index(['empresa_id', 'fecha_contable'])
@Index(['origen_sistema', 'origen_documento_id'])
export class Asiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'enum', enum: TipoComprobante })
  tipo_comprobante: TipoComprobante;

  @Column({ type: 'int' })
  consecutivo: number;

  @Column({ type: 'varchar', length: 50 })
  numero_comprobante: string; // Ej: 'ING-000001', 'DIA-000042'

  @Column({ type: 'date' })
  fecha_contable: Date;

  @Column({ type: 'text' })
  glosa_general: string;

  @Column({
    type: 'enum',
    enum: EstadoAsiento,
    default: EstadoAsiento.CONTABILIZADO,
  })
  estado: EstadoAsiento;

  // ==========================================
  // Metadatos de Integración Externa
  // ==========================================
  @Column({ type: 'varchar', length: 50, default: 'MANUAL' })
  origen_sistema: string; // Ej: 'CONJUNTOS_PH', 'POS_RESTAURANTE', 'MANUAL'

  @Column({ type: 'varchar', length: 50, nullable: true })
  origen_documento_tipo: string; // Ej: 'CUOTA', 'PAGO_WOMPI', 'FACTURA_VENTA'

  @Column({ type: 'varchar', length: 100, nullable: true })
  origen_documento_id: string; // ID único en el sistema externo (idempotencia)

  // ==========================================
  // Totales Calculados
  // ==========================================
  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_debito: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_credito: number;

  @Column({ type: 'uuid', nullable: true })
  reversado_por_id: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @OneToMany(() => AsientoLinea, (linea) => linea.asiento, {
    cascade: true,
  })
  lineas: AsientoLinea[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity({ name: 'cont_asiento_lineas', schema: 'contabilidad' })
@Index(['asiento_id'])
@Index(['cuenta_id'])
@Index(['tercero_id'])
export class AsientoLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  asiento_id: string;

  @ManyToOne(() => Asiento, (asiento) => asiento.lineas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento;

  @Column({ type: 'uuid' })
  cuenta_id: string;

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_id' })
  cuenta: PucCuenta;

  @Column({ type: 'uuid', nullable: true })
  tercero_id: string;

  @ManyToOne(() => Tercero, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tercero_id' })
  tercero: Tercero;

  @Column({ type: 'uuid', nullable: true })
  centro_costo_id: string;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  debito: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  credito: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  base_impuesto: number; // Base gravable de retención o IVA si aplica

  @Column({ type: 'varchar', length: 255 })
  glosa_detalle: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  documento_referencia: string; // Ej: Factura FE-10023, Recibo Caja RC-501

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: Date; // Opcional para cuentas por cobrar o pagar

  @CreateDateColumn()
  created_at: Date;
}
