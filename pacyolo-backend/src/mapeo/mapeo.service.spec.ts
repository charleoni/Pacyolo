import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MapeoService } from './mapeo.service.js';
import { TipoConceptoMapeo } from './entities/plantilla-mapeo.entity.js';

describe('MapeoService — Plantillas de Mapeo Contable', () => {
  let service: MapeoService;
  let mockMapeoRepo: any;
  let mockEmpresaRepo: any;
  let mockPucRepo: any;

  const mockEmpresaId = '11111111-1111-1111-1111-111111111111';
  const mockCuentaGastoId = '22222222-2222-2222-2222-222222222222';
  const mockCuentaPasivoId = '33333333-3333-3333-3333-333333333333';
  const mockCuentaMayorId = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    mockMapeoRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ id: 'new-mapeo-id', ...data })),
      save: vi.fn(async (data) => data),
      remove: vi.fn(async () => undefined),
      createQueryBuilder: vi.fn(),
    };

    mockEmpresaRepo = {
      findOne: vi.fn(),
    };

    mockPucRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
    };

    service = new MapeoService(
      mockMapeoRepo as any,
      mockEmpresaRepo as any,
      mockPucRepo as any,
    );
  });

  it('debe crear exitosamente una plantilla de mapeo con cuentas auxiliares', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockMapeoRepo.findOne.mockResolvedValue(null);
    mockPucRepo.findOne.mockImplementation(({ where }: any) => {
      if (where.id === mockCuentaGastoId) {
        return Promise.resolve({
          id: mockCuentaGastoId,
          empresa_id: mockEmpresaId,
          codigo: '513505',
          nombre: 'Servicios de Aseo y Vigilancia',
          permite_movimiento: true,
        });
      }
      if (where.id === mockCuentaPasivoId) {
        return Promise.resolve({
          id: mockCuentaPasivoId,
          empresa_id: mockEmpresaId,
          codigo: '233510',
          nombre: 'Costos por Pagar - Vigilancia y Aseo',
          permite_movimiento: true,
        });
      }
      return Promise.resolve(null);
    });

    const dto = {
      empresa_id: mockEmpresaId,
      codigo_concepto: 'SERVICIOS_ASEO_VIGILANCIA',
      nombre: 'Servicios de Aseo y Vigilancia',
      tipo_concepto: TipoConceptoMapeo.COMPRA_GASTO,
      cuenta_debito_id: mockCuentaGastoId,
      cuenta_credito_id: mockCuentaPasivoId,
      reglas_impuestos_codigos: ['IVA_19_DESCONTABLE', 'RETE_SERVICIOS_4.0'],
    };

    const res = await service.create(dto);

    expect(res).toBeDefined();
    expect(res.codigo_concepto).toBe('SERVICIOS_ASEO_VIGILANCIA');
    expect(mockMapeoRepo.save).toHaveBeenCalled();
  });

  it('debe rechazar la plantilla si el código de concepto ya existe en la empresa', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockMapeoRepo.findOne.mockResolvedValue({ id: 'existing-id', codigo_concepto: 'COMPRA_INVENTARIO' });

    const dto = {
      empresa_id: mockEmpresaId,
      codigo_concepto: 'COMPRA_INVENTARIO',
      nombre: 'Compra Duplicada',
      cuenta_debito_id: mockCuentaGastoId,
      cuenta_credito_id: mockCuentaPasivoId,
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('debe rechazar la plantilla si alguna cuenta NO es auxiliar (cuenta de grupo o mayor)', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockMapeoRepo.findOne.mockResolvedValue(null);
    mockPucRepo.findOne.mockResolvedValue({
      id: mockCuentaMayorId,
      empresa_id: mockEmpresaId,
      codigo: '5135',
      nombre: 'Servicios Generales (Cuenta Mayor)',
      permite_movimiento: false, // ¡No es auxiliar!
    });

    const dto = {
      empresa_id: mockEmpresaId,
      codigo_concepto: 'CONCEPTO_INVALIDO',
      nombre: 'Concepto con cuenta no auxiliar',
      cuenta_debito_id: mockCuentaMayorId,
      cuenta_credito_id: mockCuentaPasivoId,
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('debe consultar una plantilla por su código mnemónico de concepto', async () => {
    const plantillaMock = {
      id: 'template-id',
      empresa_id: mockEmpresaId,
      codigo_concepto: 'COMPRA_INVENTARIO',
      nombre: 'Compra de Inventario',
      cuenta_debito: { codigo: '1435' },
      cuenta_credito: { codigo: '220505' },
    };

    mockMapeoRepo.findOne.mockResolvedValue(plantillaMock);

    const res = await service.findByCodigo(mockEmpresaId, 'COMPRA_INVENTARIO');

    expect(res).toBeDefined();
    expect(res.codigo_concepto).toBe('COMPRA_INVENTARIO');
    expect(res.cuenta_debito.codigo).toBe('1435');
  });
});
