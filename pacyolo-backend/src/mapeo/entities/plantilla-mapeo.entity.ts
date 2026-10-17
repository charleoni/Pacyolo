import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum TipoConceptoMapeo {
  COMPRA_GASTO = 'COMPRA_GASTO', // Para facturas de proveedores / compras / servicios
  VENTA_INGRESO = 'VENTA_INGRESO', // Para facturación a clientes / ingresos operacionales
}

@Entity({ name: 'cont_plantillas_mapeo', schema: 'contabilidad' })
@Unique(['empresa_id', 'codigo_concepto'])
@Index(['empresa_id', 'tipo_concepto'])
export class PlantillaMapeo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50 })
  codigo_concepto: string; // Ej: COMPRA_INVENTARIO, HONORARIOS_ASESORIA, SERVICIOS_ASEO

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @Column({ type: 'enum', enum: TipoConceptoMapeo, default: TipoConceptoMapeo.COMPRA_GASTO })
  tipo_concepto: TipoConceptoMapeo;

  @Column({ type: 'uuid' })
  cuenta_debito_id: string; // Para COMPRA_GASTO es la cuenta de gasto o inventario (51xx, 1435)

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_debito_id' })
  cuenta_debito: PucCuenta;

  @Column({ type: 'uuid' })
  cuenta_credito_id: string; // Para COMPRA_GASTO es la cuenta de pasivo/CxP (220505, 2335xx)

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_credito_id' })
  cuenta_credito: PucCuenta;

  @Column({ type: 'simple-array', nullable: true })
  reglas_impuestos_codigos: string[]; // Códigos de reglas por defecto, ej: ['IVA_19_DESCONTABLE', 'RETE_COMPRAS_2.5']

  @Column({ type: 'boolean', default: true })
  aplica_retencion: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
