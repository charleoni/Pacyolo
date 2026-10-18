import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let mockReflector: any;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    rolesGuard = new RolesGuard(mockReflector as unknown as Reflector);
  });

  const createMockContext = (user: any, headers = {}, params = {}, body = {}) => {
    const request = {
      user,
      headers,
      params,
      body,
    };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir acceso si no hay roles requeridos en la ruta', () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const ctx = createMockContext(null);

    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });

  it('debe lanzar UnauthorizedException si la ruta requiere roles y no hay usuario autenticado', () => {
    mockReflector.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN_EMPRESA]);
    const ctx = createMockContext(null);

    expect(() => rolesGuard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('debe permitir acceso total si el usuario es SUPER_ADMIN', () => {
    mockReflector.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN_EMPRESA]);
    const user = {
      sub: 'usr-1',
      es_super_admin: true,
      empresas: [],
    };
    const ctx = createMockContext(user, { 'x-empresa-id': 'emp-1' });

    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario no pertenece a la empresa del header', () => {
    mockReflector.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN_EMPRESA]);
    const user = {
      sub: 'usr-1',
      es_super_admin: false,
      empresas: [
        {
          empresa_id: 'otra-empresa',
          rol: RolUsuario.ADMIN_EMPRESA,
        },
      ],
    };
    const ctx = createMockContext(user, { 'x-empresa-id': 'empresa-solicitada' });

    expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('debe lanzar ForbiddenException si pertenece a la empresa pero su rol no tiene privilegios', () => {
    mockReflector.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN_EMPRESA, RolUsuario.CONTADOR_LIDER]);
    const user = {
      sub: 'usr-1',
      es_super_admin: false,
      empresas: [
        {
          empresa_id: 'emp-1',
          rol: RolUsuario.AUXILIAR_CONTABLE, // Solo auxiliar
        },
      ],
    };
    const ctx = createMockContext(user, { 'x-empresa-id': 'emp-1' });

    expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('debe permitir acceso si el usuario pertenece a la empresa y tiene el rol requerido', () => {
    mockReflector.getAllAndOverride.mockReturnValue([RolUsuario.ADMIN_EMPRESA, RolUsuario.CONTADOR_LIDER]);
    const user = {
      sub: 'usr-1',
      es_super_admin: false,
      empresas: [
        {
          empresa_id: 'emp-1',
          rol: RolUsuario.CONTADOR_LIDER,
        },
      ],
    };
    const ctx = createMockContext(user, { 'x-empresa-id': 'emp-1' });

    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });
});
