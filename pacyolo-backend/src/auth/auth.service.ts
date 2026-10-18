import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload, JwtPayloadEmpresa } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autenticar usuario con email y contraseña, generando token JWT
   */
  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.findByEmailConPassword(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas. Verifique correo o contraseña.');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('La cuenta de usuario se encuentra inactiva.');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas. Verifique correo o contraseña.');
    }

    // Filtrar empresas activas del usuario para armar el contexto multi-tenant
    const empresasActivas: JwtPayloadEmpresa[] = (usuario.empresas || [])
      .filter((ue) => ue.activo && ue.empresa && ue.empresa.activo)
      .map((ue) => ({
        empresa_id: ue.empresa_id,
        razon_social: ue.empresa.razon_social,
        nit: ue.empresa.nit,
        rol: ue.rol,
      }));

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      es_super_admin: usuario.es_super_admin,
      empresas: empresasActivas,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      token_type: 'Bearer',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        es_super_admin: usuario.es_super_admin,
        empresas: empresasActivas,
      },
    };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getPerfil(usuarioId: string) {
    const usuario = await this.usuariosService.findOne(usuarioId);
    return {
      id: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      es_super_admin: usuario.es_super_admin,
      activo: usuario.activo,
      empresas: (usuario.empresas || []).map((ue) => ({
        empresa_id: ue.empresa_id,
        razon_social: ue.empresa?.razon_social,
        nit: ue.empresa?.nit,
        rol: ue.rol,
        activo: ue.activo,
        created_at: ue.created_at,
      })),
    };
  }
}
