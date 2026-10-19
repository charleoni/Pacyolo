import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TercerosController } from './terceros.controller.js';
import { TercerosService } from './terceros.service.js';

describe('TercerosController', () => {
  let controller: TercerosController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      create: vi.fn().mockImplementation(async (dto) => ({ id: 'mock-1', ...dto })),
      findByEmpresa: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue({ id: 'mock-1', nombre_completo: 'Carlos' }),
      update: vi.fn().mockImplementation(async (id, dto) => ({ id, ...dto })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TercerosController],
      providers: [
        {
          provide: TercerosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TercerosController>(TercerosController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe crear un tercero delegando al servicio', async () => {
    const dto = {
      empresa_id: 'empresa-123',
      tipo_identificacion: 'CC',
      numero_identificacion: '1020304050',
      nombre_completo: 'Carlos Mendoza',
    };
    const res = await controller.create(dto as any);
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(res.id).toBe('mock-1');
  });

  it('debe actualizar la ficha integral delegando al servicio', async () => {
    const updateDto = {
      ciudad_nombre: 'Medellín',
      codigo_municipio: '05001',
    };
    const res = await controller.update('mock-1', updateDto);
    expect(mockService.update).toHaveBeenCalledWith('mock-1', updateDto);
    expect(res.ciudad_nombre).toBe('Medellín');
  });
});
