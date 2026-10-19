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

export enum TipoPersona {
  NATURAL = 'NATURAL',
  JURIDICA = 'JURIDICA',
}

export enum TipoIdentificacion {
  NIT = 'NIT',
  CC = 'CC',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE',
  TI = 'TI',
}

export enum RegimenIva {
  RESPONSABLE = 'RESPONSABLE',
  NO_RESPONSABLE = 'NO_RESPONSABLE',
}

@Entity({ name: 'core_terceros', schema: 'core' })
@Unique(['empresa_id', 'numero_identificacion'])
@Index(['empresa_id', 'numero_identificacion'])
export class Tercero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50, default: 'NATURAL' })
  tipo_persona: string;

  @Column({ type: 'varchar', length: 50, default: 'NIT', nullable: true })
  tipo_identificacion: string;

  @Column({ type: 'varchar', length: 30 })
  numero_identificacion: string;

  @Column({ type: 'int', nullable: true })
  digito_verificacion: number;

  @Column({ type: 'varchar', length: 255 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  primer_nombre: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  otros_nombres: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  primer_apellido: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  segundo_apellido: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razon_social: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 5, default: 'CO' })
  pais_codigo: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  departamento_codigo: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  departamento_nombre: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_municipio: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  ciudad_nombre: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  codigo_postal: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'NO_RESPONSABLE_IVA',
    nullable: true,
  })
  regimen_iva: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  responsabilidades_fiscales: string | null;

  @Column({ type: 'boolean', default: false })
  es_gran_contribuyente: boolean;

  @Column({ type: 'boolean', default: false })
  es_autorretenedor: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  actividad_economica_ciiu: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  banco_nombre: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  tipo_cuenta_bancaria: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_cuenta_bancaria: string | null;

  @Column({ type: 'boolean', default: true })
  es_cliente: boolean;

  @Column({ type: 'boolean', default: false })
  es_proveedor: boolean;

  @Column({ type: 'boolean', default: false })
  es_empleado: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
