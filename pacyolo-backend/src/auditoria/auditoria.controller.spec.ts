import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaController } from './auditoria.controller.js';
import { AuditoriaService } from './auditoria.service.js';
import { NotFoundException } from '@nestjs/common';

describe('AuditoriaController', () => {
  let controller: AuditoriaController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      consultarLogs: vi.fn().mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0 }),
      obtenerResumenReciente: vi.fn().mockResolvedValue({ total24h: 5, porModulo: { ASIENTOS: 3, CXP: 2 } }),
      obtenerDetalle: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditoriaController],
      providers: [
        {
          provide: AuditoriaService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuditoriaController>(AuditoriaController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe consultar logs delegando al servicio con tenant del header', async () => {
    const req = { user: { es_super_admin: false } };
    const res = await controller.consultarLogs({}, 'empresa-uuid-1', req);
    expect(mockService.consultarLogs).toHaveBeenCalledWith('empresa-uuid-1', {});
    expect(res.total).toBe(0);
  });

  it('debe obtener el resumen de 24h', async () => {
    const req = { user: { es_super_admin: false } };
    const res = await controller.obtenerResumen('empresa-uuid-1', req);
    expect(mockService.obtenerResumenReciente).toHaveBeenCalledWith('empresa-uuid-1');
    expect(res.total24h).toBe(5);
  });

  it('debe lanzar NotFoundException si no existe el log', async () => {
    mockService.obtenerDetalle.mockResolvedValue(null);
    await expect(controller.obtenerDetalle('non-existent')).rejects.toThrow(NotFoundException);
  });
});
