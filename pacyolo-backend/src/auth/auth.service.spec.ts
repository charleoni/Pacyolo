import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsuariosService: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUsuariosService = {
      findByEmailConPassword: vi.fn(),
      findOne: vi.fn(),
    };
    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock_jwt_token_xyz'),
    };

    authService = new AuthService(
      mockUsuariosService as unknown as UsuariosService,
      mockJwtService as unknown as JwtService,
    );
  });

  it('debe estar definido', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('debe rechazar con UnauthorizedException si el usuario no existe', async () => {
      mockUsuariosService.findByEmailConPassword.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'inexistente@correo.com', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar con UnauthorizedException si el usuario está inactivo', async () => {
      mockUsuariosService.findByEmailConPassword.mockResolvedValue({
        id: 'usr-1',
        email: 'inactivo@correo.com',
        activo: false,
        password_hash: 'hash',
      });

      await expect(
        authService.login({ email: 'inactivo@correo.com', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar con UnauthorizedException si la contraseña no coincide', async () => {
      const hashReal = await bcrypt.hash('Correcta2026*', 10);
      mockUsuariosService.findByEmailConPassword.mockResolvedValue({
        id: 'usr-1',
        email: 'contador@correo.com',
        activo: true,
        password_hash: hashReal,
        empresas: [],
      });

      await expect(
        authService.login({ email: 'contador@correo.com', password: 'ClaveEquivocada*' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe emitir token JWT y perfil de empresas si las credenciales son válidas', async () => {
      const passwordPlana = 'ContadorSeguro2026*';
      const hashReal = await bcrypt.hash(passwordPlana, 10);

      mockUsuariosService.findByEmailConPassword.mockResolvedValue({
        id: 'usr-1',
        email: 'contador@correo.com',
        nombres: 'Carlos',
        apellidos: 'Alcala',
        activo: true,
        es_super_admin: false,
        password_hash: hashReal,
        empresas: [
          {
            empresa_id: 'emp-1',
            rol: RolUsuario.CONTADOR_LIDER,
            activo: true,
            empresa: {
              id: 'emp-1',
              razon_social: 'Acme SAS',
              nit: '900123456',
              activo: true,
            },
          },
        ],
      });

      const resultado = await authService.login({
        email: 'contador@correo.com',
        password: passwordPlana,
      });

      expect(resultado).toBeDefined();
      expect(resultado.access_token).toBe('mock_jwt_token_xyz');
      expect(resultado.token_type).toBe('Bearer');
      expect(resultado.usuario.email).toBe('contador@correo.com');
      expect(resultado.usuario.empresas).toHaveLength(1);
      expect(resultado.usuario.empresas[0].rol).toBe(RolUsuario.CONTADOR_LIDER);
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  describe('getPerfil', () => {
    it('debe retornar perfil del usuario formateado', async () => {
      mockUsuariosService.findOne.mockResolvedValue({
        id: 'usr-1',
        email: 'contador@correo.com',
        nombres: 'Carlos',
        apellidos: 'Alcala',
        telefono: '3001234567',
        es_super_admin: false,
        activo: true,
        empresas: [
          {
            empresa_id: 'emp-1',
            rol: RolUsuario.CONTADOR_LIDER,
            activo: true,
            created_at: new Date(),
            empresa: {
              razon_social: 'Acme SAS',
              nit: '900123456',
            },
          },
        ],
      });

      const perfil = await authService.getPerfil('usr-1');
      expect(perfil).toBeDefined();
      expect(perfil.id).toBe('usr-1');
      expect(perfil.email).toBe('contador@correo.com');
      expect(perfil.empresas).toHaveLength(1);
      expect(perfil.empresas[0].razon_social).toBe('Acme SAS');
    });
  });
});
