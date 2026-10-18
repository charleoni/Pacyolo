import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity.js';
import { UsuarioEmpresa } from './entities/usuario-empresa.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { AsignarRolEmpresaDto } from './dto/asignar-rol-empresa.dto.js';
import { RolUsuario } from './enums/rol-usuario.enum.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioEmpresa)
    private readonly usuarioEmpresaRepo: Repository<UsuarioEmpresa>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  /**
   * Crear nuevo usuario con password hasheada y asignación opcional de empresa
   */
  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const emailNorm = dto.email.trim().toLowerCase();
    const existente = await this.usuarioRepo.findOne({ where: { email: emailNorm } });
    if (existente) {
      throw new ConflictException(`Ya existe un usuario registrado con el email ${emailNorm}.`);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const usuario = this.usuarioRepo.create({
      email: emailNorm,
      password_hash: passwordHash,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      telefono: dto.telefono,
      activo: true,
      es_super_admin: false,
    });

    const guardado = await this.usuarioRepo.save(usuario);

    // Si se especificó empresa, vincular con su rol correspondiente
    if (dto.empresa_id) {
      await this.asignarRolEmpresa({
        usuario_id: guardado.id,
        empresa_id: dto.empresa_id,
        rol: dto.rol ?? RolUsuario.AUXILIAR_CONTABLE,
      });
    }

    const resUsuario = { ...guardado };
    delete (resUsuario as any).password_hash;
    return resUsuario as Usuario;
  }

  /**
   * Buscar usuario por email con su password_hash (para Login)
   */
  async findByEmailConPassword(email: string): Promise<Usuario | null> {
    return await this.usuarioRepo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password_hash')
      .leftJoinAndSelect('usuario.empresas', 'usuario_empresa')
      .leftJoinAndSelect('usuario_empresa.empresa', 'empresa')
      .where('usuario.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  /**
   * Buscar usuario por ID con sus empresas vinculadas
   */
  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: {
        empresas: {
          empresa: true,
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    return usuario;
  }

  /**
   * Listar usuarios pertenecientes a una empresa específica
   */
  async findByEmpresa(empresa_id: string): Promise<UsuarioEmpresa[]> {
    return await this.usuarioEmpresaRepo.find({
      where: { empresa_id },
      relations: {
        usuario: true,
      },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Asignar o actualizar rol de un usuario en una empresa
   */
  async asignarRolEmpresa(dto: AsignarRolEmpresaDto): Promise<UsuarioEmpresa> {
    const empresa = await this.empresaRepo.findOne({ where: { id: dto.empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${dto.empresa_id} no existe.`);
    }

    const usuario = await this.usuarioRepo.findOne({ where: { id: dto.usuario_id } });
    if (!usuario) {
      throw new NotFoundException(`El usuario con ID ${dto.usuario_id} no existe.`);
    }

    let membrecia = await this.usuarioEmpresaRepo.findOne({
      where: { usuario_id: dto.usuario_id, empresa_id: dto.empresa_id },
    });

    if (membrecia) {
      membrecia.rol = dto.rol;
      membrecia.activo = true;
      if (dto.asignado_por) membrecia.asignado_por = dto.asignado_por;
      return await this.usuarioEmpresaRepo.save(membrecia);
    }

    membrecia = this.usuarioEmpresaRepo.create({
      usuario_id: dto.usuario_id,
      empresa_id: dto.empresa_id,
      rol: dto.rol,
      activo: true,
      asignado_por: dto.asignado_por,
    });

    return await this.usuarioEmpresaRepo.save(membrecia);
  }

  /**
   * Actualizar rol de un usuario existente en una empresa específica
   */
  async updateRolEnEmpresa(
    usuario_id: string,
    empresa_id: string,
    nuevoRol: RolUsuario,
    modificado_por?: string,
  ): Promise<UsuarioEmpresa> {
    const membrecia = await this.usuarioEmpresaRepo.findOne({
      where: { usuario_id, empresa_id },
      relations: { usuario: true, empresa: true },
    });

    if (!membrecia) {
      throw new NotFoundException(
        `El usuario no tiene una membresía registrada en la empresa especificada.`,
      );
    }

    membrecia.rol = nuevoRol;
    membrecia.activo = true;
    if (modificado_por) {
      membrecia.asignado_por = modificado_por;
    }

    return await this.usuarioEmpresaRepo.save(membrecia);
  }

  /**
   * Desactivar o revocar acceso de un usuario a una empresa
   */
  async desactivarDeEmpresa(usuario_id: string, empresa_id: string): Promise<void> {
    const membrecia = await this.usuarioEmpresaRepo.findOne({
      where: { usuario_id, empresa_id },
    });

    if (!membrecia) {
      throw new NotFoundException(`El usuario no tiene membresía activa en esta empresa.`);
    }

    membrecia.activo = false;
    await this.usuarioEmpresaRepo.save(membrecia);
  }
}

