import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ImpuestosService } from './impuestos.service.js';
import { TipoImpuesto } from './entities/impuesto-regla.entity.js';

describe('ImpuestosService — Reglas Tributarias e Impuestos', () => {
  let service: ImpuestosService;
  let mockImpuestoRepo: any;
  let mockEmpresaRepo: any;
  let mockPucRepo: any;

  const mockEmpresaId = '11111111-1111-1111-1111-111111111111';
  const mockCuentaAuxiliarId = '22222222-2222-2222-2222-222222222222';
  const mockCuentaMayorId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    mockImpuestoRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ id: 'new-regla-id', ...data })),
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

    service = new ImpuestosService(
      mockImpuestoRepo as any,
      mockEmpresaRepo as any,
      mockPucRepo as any,
    );
  });

  it('debe crear exitosamente una regla de Retefuente vinculada a cuenta auxiliar', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockImpuestoRepo.findOne.mockResolvedValue(null); // No existe duplicado de código
    mockPucRepo.findOne.mockResolvedValue({
      id: mockCuentaAuxiliarId,
      empresa_id: mockEmpresaId,
      codigo: '236540',
      nombre: 'Retención por Compras',
      permite_movimiento: true,
    });

    const dto = {
      empresa_id: mockEmpresaId,
      tipo_impuesto: TipoImpuesto.RETEFUENTE,
      codigo: 'RETE_COMPRAS_2.5',
      nombre: 'Retefuente Compras 2.5%',
      porcentaje: 2.5,
      base_minima: 1270000,
      cuenta_credito_id: mockCuentaAuxiliarId,
    };

    const resultado = await service.create(dto);

    expect(resultado).toBeDefined();
    expect(resultado.codigo).toBe('RETE_COMPRAS_2.5');
    expect(resultado.porcentaje).toBe(2.5);
    expect(mockImpuestoRepo.save).toHaveBeenCalled();
  });

  it('debe rechazar la regla si el código ya existe en la misma empresa', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockImpuestoRepo.findOne.mockResolvedValue({ id: 'existing-id', codigo: 'RETE_COMPRAS_2.5' });

    const dto = {
      empresa_id: mockEmpresaId,
      tipo_impuesto: TipoImpuesto.RETEFUENTE,
      codigo: 'RETE_COMPRAS_2.5',
      nombre: 'Retefuente Duplicada',
      porcentaje: 2.5,
      cuenta_credito_id: mockCuentaAuxiliarId,
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('debe rechazar la regla si la cuenta de crédito NO es auxiliar (permite_movimiento === false)', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockImpuestoRepo.findOne.mockResolvedValue(null);
    mockPucRepo.findOne.mockResolvedValue({
      id: mockCuentaMayorId,
      empresa_id: mockEmpresaId,
      codigo: '2365',
      nombre: 'Retención en la Fuente (Cuenta de Grupo)',
      permite_movimiento: false, // ¡No es auxiliar!
    });

    const dto = {
      empresa_id: mockEmpresaId,
      tipo_impuesto: TipoImpuesto.RETEFUENTE,
      codigo: 'RETE_INVALIDA',
      nombre: 'Regla con cuenta de grupo',
      porcentaje: 2.5,
      cuenta_credito_id: mockCuentaMayorId,
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar la regla si la cuenta pertenece a otra empresa', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockImpuestoRepo.findOne.mockResolvedValue(null);
    mockPucRepo.findOne.mockResolvedValue({
      id: mockCuentaAuxiliarId,
      empresa_id: 'otra-empresa-distinta',
      codigo: '236540',
      nombre: 'Retención por Compras',
      permite_movimiento: true,
    });

    const dto = {
      empresa_id: mockEmpresaId,
      tipo_impuesto: TipoImpuesto.RETEFUENTE,
      codigo: 'RETE_OTRA_EMPRESA',
      nombre: 'Regla con cuenta ajena',
      porcentaje: 2.5,
      cuenta_credito_id: mockCuentaAuxiliarId,
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });
});
