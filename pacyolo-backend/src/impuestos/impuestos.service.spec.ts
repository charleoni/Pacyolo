import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ImpuestosService } from './impuestos.service.js';
import { TipoImpuesto } from './entities/impuesto-regla.entity.js';
import { TipoOperacionTributaria } from './dto/calcular-impuestos.dto.js';

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

  describe('calcularImpuestos — Motor de Liquidación y Retenciones', () => {
    it('debe liquidar IVA y retenciones correctamente cuando el valor supera las bases mínimas', async () => {
      mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });

      const reglaIva = {
        id: 'regla-iva-id',
        empresa_id: mockEmpresaId,
        codigo: 'IVA_19_DESCONTABLE',
        nombre: 'IVA Descontable 19%',
        tipo_impuesto: TipoImpuesto.IVA,
        porcentaje: 19.0,
        base_minima: 0,
        activo: true,
        cuenta_debito: { id: 'c-iva', codigo: '240802', nombre: 'IVA Descontable' },
        cuenta_credito: { id: 'c-iva', codigo: '240802', nombre: 'IVA Descontable' },
      };

      const reglaRete = {
        id: 'regla-rete-id',
        empresa_id: mockEmpresaId,
        codigo: 'RETE_COMPRAS_2.5',
        nombre: 'Retefuente Compras 2.5%',
        tipo_impuesto: TipoImpuesto.RETEFUENTE,
        porcentaje: 2.5,
        base_minima: 1270000,
        activo: true,
        cuenta_credito: { id: 'c-rete', codigo: '236540', nombre: 'Retención Compras' },
        cuenta_debito: null,
      };

      const reglaReteIca = {
        id: 'regla-ica-id',
        empresa_id: mockEmpresaId,
        codigo: 'RETEICA_BOGOTA_9.66',
        nombre: 'ReteICA 9.66x1000',
        tipo_impuesto: TipoImpuesto.RETEICA,
        porcentaje: 0.966,
        base_minima: 188000,
        activo: true,
        cuenta_credito: { id: 'c-ica', codigo: '2368', nombre: 'ReteICA' },
        cuenta_debito: null,
      };

      mockImpuestoRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.codigo === 'IVA_19_DESCONTABLE') return Promise.resolve(reglaIva);
        if (where.codigo === 'RETE_COMPRAS_2.5') return Promise.resolve(reglaRete);
        if (where.codigo === 'RETEICA_BOGOTA_9.66') return Promise.resolve(reglaReteIca);
        return Promise.resolve(null);
      });

      const resultado = await service.calcularImpuestos({
        empresa_id: mockEmpresaId,
        tipo_operacion: TipoOperacionTributaria.COMPRA_GASTO,
        subtotal: 2500000,
        reglas: [
          { regla_id_o_codigo: 'IVA_19_DESCONTABLE' },
          { regla_id_o_codigo: 'RETE_COMPRAS_2.5' },
          { regla_id_o_codigo: 'RETEICA_BOGOTA_9.66' },
        ],
      });

      expect(resultado.subtotal).toBe(2500000);
      expect(resultado.total_iva).toBe(475000); // 19% de 2.500.000
      expect(resultado.total_retenciones).toBe(86650); // 62.500 (Rete) + 24.150 (ICA)
      expect(resultado.total_neto).toBe(2888350); // 2.500.000 + 475.000 - 86.650
      expect(resultado.detalles).toHaveLength(3);
      expect(resultado.detalles.every((d) => d.aplica)).toBe(true);
      expect(resultado.lineas_asiento_sugeridas).toHaveLength(3);
    });

    it('debe omitir la retención (valor: 0) cuando la base no alcanza la base mínima legal', async () => {
      mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });

      const reglaRete = {
        id: 'regla-rete-id',
        empresa_id: mockEmpresaId,
        codigo: 'RETE_COMPRAS_2.5',
        nombre: 'Retefuente Compras 2.5%',
        tipo_impuesto: TipoImpuesto.RETEFUENTE,
        porcentaje: 2.5,
        base_minima: 1270000,
        activo: true,
        cuenta_credito: { id: 'c-rete', codigo: '236540', nombre: 'Retención Compras' },
        cuenta_debito: null,
      };

      mockImpuestoRepo.findOne.mockResolvedValue(reglaRete);

      const resultado = await service.calcularImpuestos({
        empresa_id: mockEmpresaId,
        tipo_operacion: TipoOperacionTributaria.COMPRA_GASTO,
        subtotal: 500000, // Menor a la base mínima de 1.270.000
        reglas: [{ regla_id_o_codigo: 'RETE_COMPRAS_2.5' }],
      });

      expect(resultado.subtotal).toBe(500000);
      expect(resultado.total_retenciones).toBe(0);
      expect(resultado.total_neto).toBe(500000);
      expect(resultado.detalles[0].aplica).toBe(false);
      expect(resultado.detalles[0].valor).toBe(0);
      expect(resultado.detalles[0].motivo_no_aplica).toContain('inferior a la base mínima');
      expect(resultado.lineas_asiento_sugeridas).toHaveLength(0);
    });
  });
});

