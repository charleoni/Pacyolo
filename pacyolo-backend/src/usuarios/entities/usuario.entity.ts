import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UsuarioEmpresa } from './usuario-empresa.entity.js';

@Entity({ name: 'core_usuarios', schema: 'core' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  @Index({ unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password_hash: string; // Excluido por defecto en consultas TypeORM por seguridad

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_super_admin: boolean; // Si es operador del SaaS con acceso irrestricto

  @OneToMany(() => UsuarioEmpresa, (ue) => ue.usuario)
  empresas: UsuarioEmpresa[];

  @Column({ type: 'timestamptz', nullable: true })
  ultimo_login_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
