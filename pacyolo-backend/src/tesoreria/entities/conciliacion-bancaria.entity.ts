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
import { CuentaBancaria } from './cuenta-bancaria.entity.js';
import { ExtractoBancario } from './extracto-bancario.entity.js';

export enum EstadoConciliacion {
  EN_PROCESO = 'EN_PROCESO',
  APROBADA = 'APROBADA',
  ANULADA = 'ANULADA',
}

export enum TipoPartidaConciliatoria {
  MATCH_EXACTO = 'MATCH_EXACTO', // Coincidencia 100% extracto vs libro
  CHEQUE_EN_TRANSITO = 'CHEQUE_EN_TRANSITO', // En libros (+) no en extracto
  CONSIGNACION_EN_TRANSITO = 'CONSIGNACION_EN_TRANSITO', // En libros no en extracto
  NOTA_DEBITO_PENDIENTE = 'NOTA_DEBITO_PENDIENTE', // En extracto (GMF/comisión) no contabilizado
  NOTA_CREDITO_PENDIENTE = 'NOTA_CREDITO_PENDIENTE', // En extracto (interés/abono) no contabilizado
}

@Entity({ name: 'teso_conciliaciones_bancarias', schema: 'contabilidad' })
@Unique(['empresa_id', 'cuenta_bancaria_id', 'periodo_anio', 'periodo_mes'])
@Index(['empresa_id', 'cuenta_bancaria_id'])
export class ConciliacionBancaria {
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

  @Column({ type: 'uuid' })
  extracto_id: string;

  @ManyToOne(() => ExtractoBancario)
  @JoinColumn({ name: 'extracto_id' })
  extracto: ExtractoBancario;

  @Column({ type: 'varchar', length: 50 })
  consecutivo: string; // Ej: 'CON-2026-10-01'

  @Column({ type: 'int' })
  periodo_anio: number; // Ej: 2026

  @Column({ type: 'int' })
  periodo_mes: number; // 1 a 12

  @Column({ type: 'date' })
  fecha_conciliacion: Date;

  // ==========================================
  // Valores Base de Cuadre
  // ==========================================
  @Column({ type: 'decimal', precision: 16, scale: 2 })
  saldo_extracto_bancario: number;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  saldo_libros_contables: number;

  // ==========================================
  // Partidas Conciliatorias
  // ==========================================
  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_cheques_en_transito: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_consignaciones_en_transito: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_notas_debito_pendientes: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_notas_credito_pendientes: number;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  saldo_conciliado_extracto: number; // Saldo final extracto ajustado

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  saldo_conciliado_libros: number; // Saldo final libros ajustado

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  diferencia_descuadre: number; // Debe ser 0.00 para permitir aprobación formal

  @Column({
    type: 'enum',
    enum: EstadoConciliacion,
    default: EstadoConciliacion.EN_PROCESO,
  })
  estado: EstadoConciliacion;

  @Column({ type: 'varchar', length: 150 })
  elaborado_por: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  revisado_por?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  aprobado_por?: string; // Contador o Revisor Fiscal

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(() => ConciliacionPartida, (partida) => partida.conciliacion, {
    cascade: true,
  })
  partidas: ConciliacionPartida[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity({ name: 'teso_conciliaciones_partidas', schema: 'contabilidad' })
@Index(['conciliacion_id'])
export class ConciliacionPartida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conciliacion_id: string;

  @ManyToOne(() => ConciliacionBancaria, (c) => c.partidas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conciliacion_id' })
  conciliacion: ConciliacionBancaria;

  @Column({
    type: 'enum',
    enum: TipoPartidaConciliatoria,
  })
  tipo_partida: TipoPartidaConciliatoria;

  @Column({ type: 'uuid', nullable: true })
  extracto_linea_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  asiento_linea_id?: string | null;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 255 })
  concepto: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia?: string | null;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  valor: number;

  @Column({ type: 'uuid', nullable: true })
  causado_en_asiento_id?: string | null; // Asiento automático generado para conciliar notas del extracto

  @CreateDateColumn()
  created_at: Date;
}
