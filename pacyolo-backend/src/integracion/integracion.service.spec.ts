import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegracionService } from './integracion.service.js';
import { ModoContabilizacion } from './dto/ingestar-factura-venta.dto.js';
import { TipoComprobante } from '../asientos/entities/asiento.entity.js';

describe('IntegracionService', () => {
  let service: IntegracionService;
  let mockBorradorRepo: any;
  let mockCxcRepo: any;
  let mockTerceroRepo: any;
  let mockAsientosService: any;
  let mockMapeoService: any;
  let mockImpuestosService: any;

  beforeEach(() => {
    mockBorradorRepo = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: 'borrador-uuid-1', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve({ id: 'borrador-uuid-1', ...val })),
      find: vi.fn(),
    };

    mockCxcRepo = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: 'cxc-uuid-1', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve({ id: 'cxc-uuid-1', ...val })),
      find: vi.fn(),
    };

    mockTerceroRepo = {
      findOne: vi.fn(),
    };

    mockAsientosService = {
      create: vi.fn(),
    };

    mockMapeoService = {
      findByCodigo: vi.fn(),
    };

    mockImpuestosService = {
      calcularImpuestos: vi.fn(),
    };

    service = new IntegracionService(
      mockBorradorRepo,
      mockCxcRepo,
      mockTerceroRepo,
      mockAsientosService,
      mockMapeoService,
      mockImpuestosService,
    );
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('ingestarFacturaVenta', () => {
    const dtoBase = {
      empresa_id: 'empresa-uuid-1',
      origen_sistema: 'SHOPIFY',
      origen_documento_id: 'ORDER-1001',
      numero_factura: 'FAC-1001',
      cliente_id: 'cliente-uuid-1',
      codigo_concepto: 'VENTA_MERCANCIAS',
      fecha_emision: '2026-10-17',
      fecha_vencimiento: '2026-11-17',
      subtotal: 1000000,
    };

    it('debe devolver respuesta idempotente si la factura ya fue contabilizada', async () => {
      mockCxcRepo.findOne.mockResolvedValueOnce({
        id: 'cxc-existente-uuid',
        numero_factura: 'FAC-1001',
        asiento: { id: 'asiento-123', numero_comprobante: 'CAU-000010' },
      });

      const res = await service.ingestarFacturaVenta(dtoBase as any);

      expect(res.idempotente).toBe(true);
      expect(res.tipo).toBe('CONTABILIZADO_INMEDIATO');
      expect(res.cuenta_por_cobrar.id).toBe('cxc-existente-uuid');
      expect(mockAsientosService.create).not.toHaveBeenCalled();
    });

    it('debe devolver respuesta idempotente si la factura ya existe en borrador', async () => {
      mockCxcRepo.findOne.mockResolvedValueOnce(null);
      mockBorradorRepo.findOne.mockResolvedValueOnce({
        id: 'borrador-existente-uuid',
        origen_documento_id: 'ORDER-1001',
      });

      const res = await service.ingestarFacturaVenta(dtoBase as any);

      expect(res.idempotente).toBe(true);
      expect(res.tipo).toBe('BORRADOR_INTEGRACION');
      expect(res.borrador.id).toBe('borrador-existente-uuid');
      expect(mockAsientosService.create).not.toHaveBeenCalled();
    });

    it('debe contabilizar de inmediato en modo INMEDIATA calculando IVA y generando CxC', async () => {
      mockCxcRepo.findOne.mockResolvedValueOnce(null);
      mockBorradorRepo.findOne.mockResolvedValueOnce(null);
      mockTerceroRepo.findOne.mockResolvedValueOnce({
        id: 'cliente-uuid-1',
        nombre_completo: 'CLIENTE TEST S.A.S.',
      });

      mockMapeoService.findByCodigo.mockResolvedValueOnce({
        id: 'plantilla-1',
        codigo_concepto: 'VENTA_MERCANCIAS',
        nombre: 'Venta de Bienes y Mercancías',
        cuenta_debito_id: 'cuenta-130505-uuid',
        cuenta_credito_id: 'cuenta-4135-uuid',
        reglas_impuestos_codigos: ['IVA_19_GENERADO'],
      });

      mockImpuestosService.calcularImpuestos.mockResolvedValueOnce({
        subtotal: 1000000,
        total_iva: 190000,
        total_retenciones: 0,
        total_neto: 1190000,
        lineas_asiento_sugeridas: [
          {
            cuenta_id: 'cuenta-240801-uuid',
            debito: 0,
            credito: 190000,
            base_impuesto: 1000000,
            glosa_detalle: 'IVA Generado 19%',
          },
        ],
      });

      mockAsientosService.create.mockResolvedValueOnce({
        id: 'asiento-generado-uuid',
        numero_comprobante: 'CAU-000050',
        total_debito: 1190000,
        total_credito: 1190000,
      });

      const res = await service.ingestarFacturaVenta({
        ...dtoBase,
        modo_contabilizacion: ModoContabilizacion.INMEDIATA,
      } as any);

      expect(res.idempotente).toBe(false);
      expect(res.tipo).toBe('CONTABILIZADO_INMEDIATO');
      expect(res.asiento.numero_comprobante).toBe('CAU-000050');
      expect(res.cuenta_por_cobrar.saldo_pendiente).toBe(1190000);
      expect(mockAsientosService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_comprobante: TipoComprobante.CAU,
          origen_sistema: 'SHOPIFY',
          origen_documento_id: 'ORDER-1001',
        }),
      );
    });

    it('debe guardar en bandeja de revisión si el modo es REVISION_PREVIA', async () => {
      mockCxcRepo.findOne.mockResolvedValueOnce(null);
      mockBorradorRepo.findOne.mockResolvedValueOnce(null);
      mockTerceroRepo.findOne.mockResolvedValueOnce({
        id: 'cliente-uuid-1',
        nombre_completo: 'CLIENTE TEST S.A.S.',
      });

      mockMapeoService.findByCodigo.mockResolvedValueOnce({
        id: 'plantilla-1',
        codigo_concepto: 'VENTA_MERCANCIAS',
        nombre: 'Venta de Bienes y Mercancías',
        cuenta_debito_id: 'cuenta-130505-uuid',
        cuenta_credito_id: 'cuenta-4135-uuid',
        reglas_impuestos_codigos: ['IVA_19_GENERADO'],
      });

      mockImpuestosService.calcularImpuestos.mockResolvedValueOnce({
        subtotal: 1000000,
        total_iva: 190000,
        total_retenciones: 0,
        total_neto: 1190000,
        lineas_asiento_sugeridas: [],
      });

      const res = await service.ingestarFacturaVenta({
        ...dtoBase,
        modo_contabilizacion: ModoContabilizacion.REVISION_PREVIA,
      } as any);

      expect(res.idempotente).toBe(false);
      expect(res.tipo).toBe('BORRADOR_INTEGRACION');
      expect(res.borrador.estado).toBe('PENDIENTE_REVISION');
      expect(mockAsientosService.create).not.toHaveBeenCalled();
      expect(mockCxcRepo.save).not.toHaveBeenCalled();
    });
  });
});
