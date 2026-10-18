import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParametrosService } from './parametros.service.js';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity.js';
import { TipoPersona } from './entities/tipo-persona.entity.js';
import { RegimenFiscal } from './entities/regimen-fiscal.entity.js';
import { ClasificacionTercero } from './entities/clasificacion-tercero.entity.js';
import { TipoComprobanteConfig } from './entities/tipo-comprobante-config.entity.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';
import { Departamento } from './entities/departamento.entity.js';
import { Municipio } from './entities/municipio.entity.js';

describe('ParametrosService', () => {
  let service: ParametrosService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (entity) => ({ id: 'mock-uuid', ...entity })),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParametrosService,
        { provide: getRepositoryToken(TipoIdentificacion), useValue: mockRepo },
        { provide: getRepositoryToken(TipoPersona), useValue: mockRepo },
        { provide: getRepositoryToken(RegimenFiscal), useValue: mockRepo },
        { provide: getRepositoryToken(ClasificacionTercero), useValue: mockRepo },
        { provide: getRepositoryToken(TipoComprobanteConfig), useValue: mockRepo },
        { provide: getRepositoryToken(MetodoPago), useValue: mockRepo },
        { provide: getRepositoryToken(Departamento), useValue: mockRepo },
        { provide: getRepositoryToken(Municipio), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ParametrosService>(ParametrosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe sembrar semillas globales si no existen', async () => {
    await service.sembrarSemillasGlobales();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('debe crear un nuevo tipo de identificación personalizado', async () => {
    const res = await service.crearTipoIdentificacion({
      codigo: 'PPT',
      nombre: 'Permiso Especial',
      aplica_digito_verificacion: false,
    });
    expect(res).toBeDefined();
    expect(res.codigo).toBe('PPT');
  });

  it('debe listar tipos de comprobante combinando defaults globales y de empresa', async () => {
    const res = await service.listarTiposComprobante('empresa-123');
    expect(res).toEqual([]);
    expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('debe activar o inactivar un parámetro existente', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'mock-id', activo: true });
    const res = await service.cambiarEstado('tipos-identificacion', 'mock-id', false);
    expect(res.activo).toBe(false);
  });

  it('debe listar departamentos oficiales DANE', async () => {
    const res = await service.listarDepartamentos();
    expect(res).toEqual([]);
    expect(mockRepo.find).toHaveBeenCalled();
  });

  it('debe buscar municipios oficiales DANE por término o departamento', async () => {
    const res = await service.buscarMunicipios('Bogotá', '11');
    expect(res).toEqual([]);
    expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
  });
});
