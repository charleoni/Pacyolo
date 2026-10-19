import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TercerosService } from './terceros.service.js';
import { Tercero, TipoIdentificacion } from './entities/tercero.entity.js';
import { ConflictException } from '@nestjs/common';

describe('TercerosService', () => {
  let service: TercerosService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (entity) => ({ id: 'mock-uuid', ...entity })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TercerosService,
        {
          provide: getRepositoryToken(Tercero),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<TercerosService>(TercerosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe crear un tercero con cálculo automático de DV para NIT', async () => {
    const dto = {
      empresa_id: 'empresa-123',
      tipo_identificacion: TipoIdentificacion.NIT,
      numero_identificacion: '900123456',
      nombre_completo: 'DISTRIBUIDORA NACIONAL SAS',
      razon_social: 'DISTRIBUIDORA NACIONAL SAS',
      pais_codigo: 'CO',
      codigo_municipio: '11001',
    };

    const res = await service.create(dto);
    expect(res).toBeDefined();
    expect(res.digito_verificacion).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('debe resolver el nombre completo a partir de nombres desglosados en persona natural', async () => {
    const dto = {
      empresa_id: 'empresa-123',
      tipo_identificacion: 'CC',
      numero_identificacion: '1020304050',
      nombre_completo: '',
      primer_nombre: 'Carlos',
      otros_nombres: 'Andrés',
      primer_apellido: 'Mendoza',
      segundo_apellido: 'Silva',
      pais_codigo: 'CO',
      codigo_municipio: '05001',
    };

    const res = await service.create(dto);
    expect(res.nombre_completo).toBe('Carlos Andrés Mendoza Silva');
  });

  it('debe lanzar ConflictException si el documento ya existe en la empresa', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'existente-id' });

    await expect(
      service.create({
        empresa_id: 'empresa-123',
        tipo_identificacion: 'CC',
        numero_identificacion: '1020304050',
        nombre_completo: 'Tercero Duplicado',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe actualizar la ficha integral del tercero y sus datos de localización', async () => {
    mockRepo.findOne.mockResolvedValueOnce({
      id: 'mock-uuid',
      empresa_id: 'empresa-123',
      numero_identificacion: '900123456',
      nombre_completo: 'Antiguo Nombre',
      pais_codigo: 'CO',
    });

    const res = await service.update('mock-uuid', {
      razon_social: 'NUEVA RAZON SOCIAL SAS',
      codigo_municipio: '76001',
      ciudad_nombre: 'Cali',
      departamento_codigo: '76',
      departamento_nombre: 'Valle del Cauca',
      banco_nombre: 'Bancolombia',
      tipo_cuenta_bancaria: 'AHORROS',
      numero_cuenta_bancaria: '987654321',
    });

    expect(res.nombre_completo).toBe('NUEVA RAZON SOCIAL SAS');
    expect(res.ciudad_nombre).toBe('Cali');
    expect(res.banco_nombre).toBe('Bancolombia');
  });
});
