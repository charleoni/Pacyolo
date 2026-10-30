import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { CajaMenor } from './caja-menor.entity.js';
import { Tercero } from '../../terceros/entities/tercero.entity.js';

export enum ResultadoArqueo {
  CUADRADO = 'CUADRADO',
  SOBRANTE = 'SOBRANTE',
  FALTANTE = 'FALTANTE',
}

@Entity({ name: 'teso_cajas_menores_arqueos', schema: 'contabilidad' })
@Unique(['empresa_id', 'consecutivo'])
@Index(['empresa_id', 'caja_menor_id'])
export class CajaMenorArqueo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  caja_menor_id: string;

  @ManyToOne(() => CajaMenor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caja_menor_id' })
  caja_menor: CajaMenor;

  @Column({ type: 'varchar', length: 50 })
  consecutivo: string; // Ej: 'ARQ-0001'

  @Column({ type: 'timestamp' })
  fecha_arqueo: Date;

  @Column({ type: 'uuid', nullable: true })
  auditor_id?: string | null; // Usuario que ejecuta el arqueo

  @Column({ type: 'uuid' })
  custodio_id: string;

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'custodio_id' })
  custodio: Tercero; // Responsable de la caja

  @Column({ type: 'jsonb', nullable: true })
  desglose_efectivo: Record<string, number>; // Ej: { "100000": 2, "50000": 4, "20000": 10, "monedas": 15000 }

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  total_efectivo_fisico: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  total_vales_comprobantes: number;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  total_fondo_contado: number; // total_efectivo_fisico + total_vales_comprobantes

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  monto_fondo_fijo: number; // Fondo asignado originalmente

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  diferencia: number; // total_fondo_contado - monto_fondo_fijo

  @Column({
    type: 'enum',
    enum: ResultadoArqueo,
    default: ResultadoArqueo.CUADRADO,
  })
  resultado: ResultadoArqueo;

  @Column({ type: 'uuid', nullable: true })
  asiento_id?: string | null; // Asiento automático de sobrante (4295) o faltante (1365 / 5395)

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @CreateDateColumn()
  created_at: Date;
}
