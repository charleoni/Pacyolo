import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsuariosService } from './usuarios.service.js';
import { RolUsuario } from './enums/rol-usuario.enum.js';
import * as bcrypt from 'bcrypt';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockUsuarioRepo: any;
  let mockUsuarioEmpresaRepo: any;
  let mockEmpresaRepo: any;

  beforeEach(() => {
    mockUsuarioRepo = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: 'usr-uuid-1', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve({ id: 'usr-uuid-1', ...val })),
    };

    mockUsuarioEmpresaRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: 'ue-uuid-1', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve({ id: 'ue-uuid-1', ...val })),
    };

    mockEmpresaRepo = {
      findOne: vi.fn(),
    };

    service = new UsuariosService(mockUsuarioRepo, mockUsuarioEmpresaRepo, mockEmpresaRepo);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe hashear la contraseña con bcrypt al registrar un nuevo usuario', async () => {
    mockUsuarioRepo.findOne.mockResolvedValueOnce(null);

    const res = await service.create({
      email: 'contador@empresa.com',
      password: 'MiPassword123*',
      nombres: 'Carlos',
      apellidos: 'Alcalá',
    });

    expect(res.id).toBe('usr-uuid-1');
    expect(res.email).toBe('contador@empresa.com');
    expect(mockUsuarioRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password_hash: expect.any(String),
      }),
    );

    // Validar que el hash corresponda a la contraseña
    const saveCallArg = mockUsuarioRepo.save.mock.calls[0][0];
    const match = await bcrypt.compare('MiPassword123*', saveCallArg.password_hash);
    expect(match).toBe(true);
  });

  it('debe asignar el rol a un usuario en una empresa tenant', async () => {
    mockEmpresaRepo.findOne.mockResolvedValueOnce({ id: 'empresa-uuid-1' });
    mockUsuarioRepo.findOne.mockResolvedValueOnce({ id: 'usr-uuid-1' });
    mockUsuarioEmpresaRepo.findOne.mockResolvedValueOnce(null);

    const res = await service.asignarRolEmpresa({
      usuario_id: 'usr-uuid-1',
      empresa_id: 'empresa-uuid-1',
      rol: RolUsuario.CONTADOR_LIDER,
      asignado_por: 'admin@empresa.com',
    });

    expect(res.rol).toBe(RolUsuario.CONTADOR_LIDER);
    expect(mockUsuarioEmpresaRepo.save).toHaveBeenCalled();
  });
});
