import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { CuentaBancaria } from './cuenta-bancaria.entity.js';

export enum EstadoExtracto {
  BORRADOR = 'BORRADOR',
  CONCILIADO_PARCIAL = 'CONCILIADO_PARCIAL',
  CONCILIADO_TOTAL = 'CONCILIADO_TOTAL',
}

export enum TipoMovimientoExtracto {
  DEBITO = 'DEBITO', // Retiro / Cargo bancario (GMF, comisión, cheque cobrado)
  CREDITO = 'CREDITO', // Depósito / Abono (consignación, transferencia recibida, intereses)
}

@Entity({ name: 'teso_extractos_bancarios', schema: 'contabilidad' })
@Unique(['empresa_id', 'cuenta_bancaria_id', 'periodo_anio', 'periodo_mes'])
@Index(['empresa_id', 'cuenta_bancaria_id'])
export class ExtractoBancario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  cuenta_bancaria_id: string;

  @ManyToOne(() => CuentaBancaria, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuenta_bancaria: CuentaBancaria;

  @Column({ type: 'int' })
  periodo_anio: number; // Ej: 2026

  @Column({ type: 'int' })
  periodo_mes: number; // 1 a 12

  @Column({ type: 'date' })
  fecha_corte: Date;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  saldo_inicial: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_creditos_depositos: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_debitos_retiros: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  saldo_final: number; // saldo_inicial + total_creditos - total_debitos

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre_archivo_origen?: string | null;

  @Column({
    type: 'enum',
    enum: EstadoExtracto,
    default: EstadoExtracto.BORRADOR,
  })
  estado: EstadoExtracto;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @OneToMany(() => ExtractoBancarioLinea, (linea) => linea.extracto, {
    cascade: true,
  })
  lineas: ExtractoBancarioLinea[];

  @CreateDateColumn()
  created_at: Date;
}

@Entity({ name: 'teso_extractos_bancarios_lineas', schema: 'contabilidad' })
@Index(['extracto_id'])
@Index(['conciliado'])
export class ExtractoBancarioLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  extracto_id: string;

  @ManyToOne(() => ExtractoBancario, (ext) => ext.lineas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'extracto_id' })
  extracto: ExtractoBancario;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string; // Ej: 'Cobro GMF 4x1000', 'Transferencia recibida Wompi', 'Comisión chequera'

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia?: string | null; // Número de cheque, autorización o transferencia

  @Column({
    type: 'enum',
    enum: TipoMovimientoExtracto,
  })
  tipo_movimiento: TipoMovimientoExtracto;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  valor: number;

  @Column({ type: 'boolean', default: false })
  conciliado: boolean;

  @Column({ type: 'uuid', nullable: true })
  asiento_linea_id?: string | null; // Vinculación con cont_asiento_lineas

  @CreateDateColumn()
  created_at: Date;
}
