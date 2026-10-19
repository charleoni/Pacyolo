import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ParametrosController } from './parametros.controller.js';
import { ParametrosService } from './parametros.service.js';

describe('ParametrosController', () => {
  let controller: ParametrosController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      sembrarSemillasGlobales: vi.fn().mockResolvedValue(undefined),
      listarTiposIdentificacion: vi.fn().mockResolvedValue([]),
      crearTipoIdentificacion: vi.fn().mockResolvedValue({ id: '1' }),
      listarTiposPersona: vi.fn().mockResolvedValue([]),
      crearTipoPersona: vi.fn().mockResolvedValue({ id: '2' }),
      listarRegimenesFiscales: vi.fn().mockResolvedValue([]),
      listarDepartamentos: vi.fn().mockResolvedValue([{ codigo: '11', nombre: 'Bogotá, D.C.' }]),
      buscarMunicipios: vi.fn().mockResolvedValue([{ codigo: '11001', nombre: 'Bogotá, D.C.' }]),
      cambiarEstado: vi.fn().mockResolvedValue({ id: '1', activo: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParametrosController],
      providers: [
        {
          provide: ParametrosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ParametrosController>(ParametrosController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe listar departamentos delegando al servicio', async () => {
    const res = await controller.listarDepartamentos();
    expect(mockService.listarDepartamentos).toHaveBeenCalled();
    expect(res.length).toBe(1);
    expect(res[0].codigo).toBe('11');
  });

  it('debe buscar municipios por término y departamento', async () => {
    const res = await controller.buscarMunicipios('Bogotá', '11');
    expect(mockService.buscarMunicipios).toHaveBeenCalledWith('Bogotá', '11');
    expect(res.length).toBe(1);
    expect(res[0].codigo).toBe('11001');
  });

  it('debe cambiar estado de un catálogo', async () => {
    const res = await controller.cambiarEstado('municipios', 'm-uuid', { activo: false });
    expect(mockService.cambiarEstado).toHaveBeenCalledWith('municipios', 'm-uuid', false);
    expect(res.activo).toBe(false);
  });
});
