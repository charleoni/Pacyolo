import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TesoreriaService } from './tesoreria.service.js';
import { EstadoCajaMenor } from './entities/caja-menor.entity.js';
import { EstadoGastoCajaMenor } from './entities/caja-menor-gasto.entity.js';
import { ResultadoArqueo } from './entities/caja-menor-arqueo.entity.js';
import { TipoMovimientoExtracto } from './entities/extracto-bancario.entity.js';
import { BadRequestException } from '@nestjs/common';

describe('TesoreriaService', () => {
  let service: TesoreriaService;
  let mockCajaRepo: any;
  let mockGastoRepo: any;
  let mockArqueoRepo: any;
  let mockCuentaBancariaRepo: any;
  let mockExtractoRepo: any;
  let mockExtractoLineaRepo: any;
  let mockConciliacionRepo: any;
  let mockPartidaRepo: any;
  let mockPucRepo: any;
  let mockTerceroRepo: any;
  let mockAsientoLineaRepo: any;
  let mockAsientosService: any;
  let mockAuditoriaService: any;
  let mockDataSource: any;

  beforeEach(() => {
    mockCajaRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'caja-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'caja-1' })),
    };

    mockGastoRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      findByIds: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((data) => ({ ...data, id: 'gasto-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'gasto-1' })),
    };

    mockArqueoRepo = {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((data) => ({ ...data, id: 'arq-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'arq-1' })),
      find: vi.fn(),
    };

    mockCuentaBancariaRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'cta-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'cta-1' })),
    };

    mockExtractoRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'ext-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'ext-1' })),
    };

    mockExtractoLineaRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'ext-lin-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'ext-lin-1' })),
    };

    mockConciliacionRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'conc-1' })),
      save: vi.fn((data) => Promise.resolve({ ...data, id: data.id || 'conc-1' })),
    };

    mockPartidaRepo = {
      delete: vi.fn(),
      create: vi.fn((data) => ({ ...data, id: 'part-1' })),
    };

    mockPucRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 'puc-1', codigo: '11051001', nombre: 'Caja Menor', permite_movimiento: true }),
    };

    mockTerceroRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 'ter-1', nombre_completo: 'Custodio Prueba' }),
    };

    mockAsientoLineaRepo = {
      createQueryBuilder: vi.fn().mockReturnValue({
        innerJoinAndSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
    };

    mockAsientosService = {
      create: vi.fn().mockResolvedValue({ id: 'asiento-1', numero_comprobante: 'EGR-0001' }),
    };

    mockAuditoriaService = {
      registrarLog: vi.fn().mockResolvedValue(true),
    };

    mockDataSource = {};

    service = new TesoreriaService(
      mockCajaRepo,
      mockGastoRepo,
      mockArqueoRepo,
      mockCuentaBancariaRepo,
      mockExtractoRepo,
      mockExtractoLineaRepo,
      mockConciliacionRepo,
      mockPartidaRepo,
      mockPucRepo,
      mockTerceroRepo,
      mockAsientoLineaRepo,
      mockAsientosService,
      mockAuditoriaService,
      mockDataSource,
    );
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('Cajas Menores', () => {
    it('debe crear una caja menor exitosamente', async () => {
      mockCajaRepo.findOne.mockResolvedValue(null);

      const res = await service.crearCajaMenor(
        'empresa-1',
        {
          codigo: 'CM-01',
          nombre: 'Caja Menor Principal',
          responsable_id: 'ter-1',
          cuenta_puc_id: 'puc-1',
          monto_fondo_fijo: 500000,
        },
        { id: 'usr-1', email: 'admin@pacyolo.com' },
      );

      expect(res).toBeDefined();
      expect(mockCajaRepo.save).toHaveBeenCalled();
      expect(mockAuditoriaService.registrarLog).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CREAR_CAJA_MENOR', modulo: 'TESORERIA' }));
    });

    it('debe registrar un gasto y actualizar el saldo en efectivo y en vales', async () => {
      mockCajaRepo.findOne.mockResolvedValue({
        id: 'caja-1',
        empresa_id: 'empresa-1',
        codigo: 'CM-01',
        saldo_actual_efectivo: 500000,
        saldo_en_vales: 0,
        estado: EstadoCajaMenor.ABIERTA,
      });

      const gasto = await service.registrarGasto(
        'empresa-1',
        {
          caja_menor_id: 'caja-1',
          fecha_gasto: '2026-10-29',
          tercero_id: 'ter-2',
          concepto: 'Taxis y transporte',
          cuenta_gasto_id: 'puc-gasto',
          subtotal: 50000,
          total: 50000,
        },
        { id: 'usr-1', email: 'admin@pacyolo.com' },
      );

      expect(gasto).toBeDefined();
      expect(gasto.total).toBe(50000);
      expect(mockCajaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          saldo_actual_efectivo: 450000,
          saldo_en_vales: 50000,
        }),
      );
    });

    it('debe rechazar un gasto si el saldo en efectivo de la caja es insuficiente', async () => {
      mockCajaRepo.findOne.mockResolvedValue({
        id: 'caja-1',
        empresa_id: 'empresa-1',
        saldo_actual_efectivo: 20000,
        estado: EstadoCajaMenor.ABIERTA,
      });

      await expect(
        service.registrarGasto(
          'empresa-1',
          {
            caja_menor_id: 'caja-1',
            fecha_gasto: '2026-10-29',
            tercero_id: 'ter-2',
            concepto: 'Papelería grande',
            cuenta_gasto_id: 'puc-gasto',
            subtotal: 80000,
            total: 80000,
          },
          { id: 'usr-1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe calcular correctamente un arqueo de caja menor cuadrado', async () => {
      mockCajaRepo.findOne.mockResolvedValue({
        id: 'caja-1',
        empresa_id: 'empresa-1',
        codigo: 'CM-01',
        monto_fondo_fijo: 500000,
        responsable_id: 'ter-1',
      });

      // Vales legalizados pendientes = 150.000
      mockGastoRepo.find.mockResolvedValue([{ total: 100000 }, { total: 50000 }]);

      // Efectivo físico contado = 350.000 (Total = 500.000 -> Cuadrado)
      const arqueo = await service.registrarArqueo(
        'empresa-1',
        {
          caja_menor_id: 'caja-1',
          fecha_arqueo: '2026-10-29',
          total_efectivo_fisico: 350000,
        },
        { id: 'usr-1' },
      );

      expect(arqueo.resultado).toBe(ResultadoArqueo.CUADRADO);
      expect(arqueo.diferencia).toBe(0);
      expect(arqueo.total_fondo_contado).toBe(500000);
    });

    it('debe detectar un faltante de caja si el efectivo físico no completa el fondo', async () => {
      mockCajaRepo.findOne.mockResolvedValue({
        id: 'caja-1',
        empresa_id: 'empresa-1',
        codigo: 'CM-01',
        monto_fondo_fijo: 500000,
        responsable_id: 'ter-1',
        cuenta_puc_id: 'puc-1',
      });

      mockGastoRepo.find.mockResolvedValue([{ total: 100000 }]);
      // Efectivo contado = 380.000 -> Total contado = 480.000 -> Faltante = -20.000
      const arqueo = await service.registrarArqueo(
        'empresa-1',
        {
          caja_menor_id: 'caja-1',
          fecha_arqueo: '2026-10-29',
          total_efectivo_fisico: 380000,
        },
        { id: 'usr-1' },
      );

      expect(arqueo.resultado).toBe(ResultadoArqueo.FALTANTE);
      expect(arqueo.diferencia).toBe(-20000);
    });
  });
});
