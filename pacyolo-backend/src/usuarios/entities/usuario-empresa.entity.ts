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
import { Usuario } from './usuario.entity.js';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { RolUsuario } from '../enums/rol-usuario.enum.js';

@Entity({ name: 'core_usuarios_empresas', schema: 'core' })
@Unique(['usuario_id', 'empresa_id'])
@Index(['empresa_id', 'rol'])
@Index(['usuario_id', 'activo'])
export class UsuarioEmpresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @ManyToOne(() => Usuario, (u) => u.empresas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.AUXILIAR_CONTABLE,
  })
  rol: RolUsuario;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 150, nullable: true })
  asignado_por: string; // Email o ID de quien asignó el rol

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
