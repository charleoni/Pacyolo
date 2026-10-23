import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Bodega } from '../../parametros/entities/bodega.entity.js';
import { Articulo } from './articulo.entity.js';
import { Asiento } from '../../asientos/entities/asiento.entity.js';

export type TipoAjusteInventario = 'SOBRANTE' | 'FALTANTE_MERMA' | 'CIERRE_INVENTARIO_FISICO';

@Entity({ name: 'inv_notas_ajuste', schema: 'core' })
@Unique(['empresa_id', 'numero_nota'])
export class NotaAjuste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  empresa_id: string;

  @Column({ type: 'varchar', length: 30 })
  numero_nota: string; // ej: AJ-0001

  @Column({ type: 'uuid' })
  @Index()
  bodega_id: string;

  @ManyToOne(() => Bodega, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bodega_id' })
  bodega: Bodega;

  @Column({ type: 'varchar', length: 40 })
  tipo_ajuste: TipoAjusteInventario;

  @Column({ type: 'date' })
  fecha_ajuste: string;

  @Column({ type: 'text' })
  justificacion: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_ajuste: number;

  @Column({ type: 'varchar', length: 20, default: 'APLICADA' })
  estado: 'APLICADA' | 'ANULADA';

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null;

  @ManyToOne(() => Asiento, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asiento_id' })
  asiento?: Asiento | null;

  @OneToMany(() => NotaAjusteLinea, (linea) => linea.nota_ajuste, {
    cascade: true,
    eager: true,
  })
  lineas: NotaAjusteLinea[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

@Entity({ name: 'inv_nota_ajuste_lineas', schema: 'core' })
export class NotaAjusteLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  nota_ajuste_id: string;

  @ManyToOne(() => NotaAjuste, (nota) => nota.lineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nota_ajuste_id' })
  nota_ajuste: NotaAjuste;

  @Column({ type: 'uuid' })
  @Index()
  articulo_id: string;

  @ManyToOne(() => Articulo, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'varchar', length: 20 })
  tipo_movimiento: 'ENTRADA' | 'SALIDA';

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  cantidad: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total: number;
}
