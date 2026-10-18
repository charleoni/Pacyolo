import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaLog } from './entities/auditoria-log.entity.js';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (log) => ({ id: 'mock-uuid', ...log, created_at: new Date() })),
      createQueryBuilder: vi.fn().mockReturnValue({
        andWhere: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
        getMany: vi.fn().mockResolvedValue([]),
      }),
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: getRepositoryToken(AuditoriaLog),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe registrar un log de auditoría y redactar contraseñas/tokens sensibles', async () => {
    const payload = {
      empresa_id: 'empresa-123',
      usuario_email: 'contador@pacyolo.com',
      metodo_http: 'POST',
      ruta: '/api/v1/auth/login',
      accion: 'LOGIN',
      modulo: 'AUTH',
      datos_nuevos: {
        email: 'contador@pacyolo.com',
        password: 'PasswordSuperSecreta123',
        token: 'jwt-token-12345',
      },
    };

    const res = await service.registrarLog(payload as any);

    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
    expect(res).toBeDefined();
    // Verifica que password y token fueron redactados
    const createArgs = mockRepo.create.mock.calls[0][0];
    expect(createArgs.datos_nuevos.password).toBe('***REDACTED***');
    expect(createArgs.datos_nuevos.token).toBe('***REDACTED***');
  });

  it('debe consultar logs aplicando paginación y filtros', async () => {
    const res = await service.consultarLogs('empresa-123', {
      modulo: 'ASIENTOS',
      accion: 'CREATE',
      limit: 20,
      offset: 0,
    });

    expect(res.data).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.limit).toBe(20);
  });
});
