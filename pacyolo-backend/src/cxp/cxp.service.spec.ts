import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CxpService } from './cxp.service.js';
import { EstadoCuentaPorPagar } from './entities/cuenta-por-pagar.entity.js';
import { TipoComprobante } from '../asientos/entities/asiento.entity.js';

describe('CxpService — Módulo de Cuentas por Pagar (CxP)', () => {
  let service: CxpService;
  let mockCxpRepo: any;
  let mockEmpresaRepo: any;
  let mockTerceroRepo: any;
  let mockMapeoService: any;
  let mockImpuestosService: any;
  let mockAsientosService: any;

  const mockEmpresaId = '11111111-1111-1111-1111-111111111111';
  const mockProveedorId = '22222222-2222-2222-2222-222222222222';
  const mockCuentaGastoId = '33333333-3333-3333-3333-333333333333';
  const mockCuentaPasivoId = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    mockCxpRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ id: 'new-cxp-id', ...data })),
      save: vi.fn(async (data) => data),
      createQueryBuilder: vi.fn(),
    };

    mockEmpresaRepo = {
      findOne: vi.fn(),
    };

    mockTerceroRepo = {
      findOne: vi.fn(),
    };

    mockMapeoService = {
      findByCodigo: vi.fn(),
    };

    mockImpuestosService = {
      calcularImpuestos: vi.fn(),
    };

    mockAsientosService = {
      create: vi.fn(),
    };

    service = new CxpService(
      mockCxpRepo as any,
      mockEmpresaRepo as any,
      mockTerceroRepo as any,
      mockMapeoService as any,
      mockImpuestosService as any,
      mockAsientosService as any,
    );
  });

  it('debe causar una factura de proveedor generando asiento contable (CAU) y cuenta por pagar', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockTerceroRepo.findOne.mockResolvedValue({ id: mockProveedorId, empresa_id: mockEmpresaId });

    mockMapeoService.findByCodigo.mockResolvedValue({
      id: 'template-id',
      codigo_concepto: 'COMPRA_INVENTARIO',
      nombre: 'Compra de Inventario',
      cuenta_debito_id: mockCuentaGastoId,
      cuenta_credito_id: mockCuentaPasivoId,
      reglas_impuestos_codigos: ['IVA_19_DESCONTABLE', 'RETE_COMPRAS_2.5'],
      activo: true,
    });

    mockImpuestosService.calcularImpuestos.mockResolvedValue({
      subtotal: 2000000,
      total_iva: 380000,
      total_retenciones: 50000,
      total_neto: 2330000, // 2.000.000 + 380.000 - 50.000
      detalles: [],
      lineas_asiento_sugeridas: [
        {
          cuenta_id: 'c-iva',
          cuenta_codigo: '240802',
          cuenta_nombre: 'IVA Descontable',
          debito: 380000,
          credito: 0,
          base_impuesto: 2000000,
          glosa_detalle: 'IVA Descontable',
        },
        {
          cuenta_id: 'c-rete',
          cuenta_codigo: '236540',
          cuenta_nombre: 'Retefuente Compras',
          debito: 0,
          credito: 50000,
          base_impuesto: 2000000,
          glosa_detalle: 'Retefuente Compras',
        },
      ],
    });

    mockAsientosService.create.mockResolvedValue({
      id: 'asiento-cau-id',
      numero_comprobante: 'CAU-000001',
      total_debito: 2380000,
      total_credito: 2380000,
    });

    mockCxpRepo.findOne.mockResolvedValue({
      id: 'new-cxp-id',
      empresa_id: mockEmpresaId,
      tercero_id: mockProveedorId,
      asiento_id: 'asiento-cau-id',
      numero_factura_proveedor: 'FAC-1001',
      subtotal: 2000000,
      total_iva: 380000,
      total_retenciones: 50000,
      monto_total: 2330000,
      saldo_pendiente: 2330000,
      estado: EstadoCuentaPorPagar.PENDIENTE,
    });

    const dto = {
      empresa_id: mockEmpresaId,
      tercero_id: mockProveedorId,
      codigo_concepto: 'COMPRA_INVENTARIO',
      numero_factura_proveedor: 'FAC-1001',
      fecha_emision: '2026-10-17',
      fecha_vencimiento: '2026-11-17',
      subtotal: 2000000,
    };

    const res = await service.causarFactura(dto);

    expect(res).toBeDefined();
    expect(res.monto_total).toBe(2330000);
    expect(res.saldo_pendiente).toBe(2330000);
    expect(res.estado).toBe(EstadoCuentaPorPagar.PENDIENTE);
    expect(mockAsientosService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_comprobante: TipoComprobante.CAU,
        lineas: expect.arrayContaining([
          expect.objectContaining({ debito: 2000000, credito: 0 }),
          expect.objectContaining({ debito: 380000, credito: 0 }),
          expect.objectContaining({ debito: 0, credito: 50000 }),
          expect.objectContaining({ debito: 0, credito: 2330000 }),
        ]),
      }),
    );
  });

  it('debe rechazar la causación si el proveedor no pertenece a la empresa', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockTerceroRepo.findOne.mockResolvedValue(null);

    const dto = {
      empresa_id: mockEmpresaId,
      tercero_id: 'proveedor-inexistente',
      codigo_concepto: 'COMPRA_INVENTARIO',
      numero_factura_proveedor: 'FAC-1001',
      fecha_emision: '2026-10-17',
      fecha_vencimiento: '2026-11-17',
      subtotal: 1000000,
    };

    await expect(service.causarFactura(dto)).rejects.toThrow(NotFoundException);
  });

  it('debe rechazar la causación si la plantilla de mapeo está inactiva', async () => {
    mockEmpresaRepo.findOne.mockResolvedValue({ id: mockEmpresaId });
    mockTerceroRepo.findOne.mockResolvedValue({ id: mockProveedorId, empresa_id: mockEmpresaId });
    mockMapeoService.findByCodigo.mockResolvedValue({
      id: 'template-id',
      codigo_concepto: 'COMPRA_INVENTARIO',
      activo: false, // ¡Inactiva!
    });

    const dto = {
      empresa_id: mockEmpresaId,
      tercero_id: mockProveedorId,
      codigo_concepto: 'COMPRA_INVENTARIO',
      numero_factura_proveedor: 'FAC-1001',
      fecha_emision: '2026-10-17',
      fecha_vencimiento: '2026-11-17',
      subtotal: 1000000,
    };

    await expect(service.causarFactura(dto)).rejects.toThrow(BadRequestException);
  });

  it('debe consolidar el resumen de cartera clasificando facturas por vencer y vencidas', async () => {
    const facturas = [
      { saldo_pendiente: 1000000, fecha_vencimiento: '2099-12-31' }, // Por vencer
      { saldo_pendiente: 500000, fecha_vencimiento: '2020-01-01' }, // Vencida
    ];

    mockCxpRepo.find.mockResolvedValue(facturas);

    const resumen = await service.obtenerResumenCartera(mockEmpresaId);

    expect(resumen.total_cartera).toBe(1500000);
    expect(resumen.total_por_vencer).toBe(1000000);
    expect(resumen.total_vencida).toBe(500000);
    expect(resumen.total_facturas_pendientes).toBe(2);
  });
});
