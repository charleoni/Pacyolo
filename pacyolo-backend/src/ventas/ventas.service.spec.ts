import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VentasService } from './ventas.service.js';
import { FacturaVenta, EstadoFacturaVenta } from './entities/factura-venta.entity.js';
import { FacturaVentaLinea } from './entities/factura-venta-linea.entity.js';
import { NotaCreditoVenta, MotivoNotaCredito, TipoReembolsoNotaCredito } from './entities/nota-credito-venta.entity.js';
import { NotaCreditoVentaLinea } from './entities/nota-credito-venta.entity.js';
import { Articulo } from '../inventarios/entities/articulo.entity.js';
import { SaldoBodega } from '../inventarios/entities/saldo-bodega.entity.js';
import { KardexMovimiento } from '../inventarios/entities/kardex-movimiento.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../puc/entities/puc.entity.js';
import { CuentaPorCobrar } from '../cxc/entities/cuenta-por-cobrar.entity.js';
import { RecaudoCxc } from '../cxc/entities/recaudo-cxc.entity.js';
import { AsientosService } from '../asientos/asientos.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';

describe('VentasService', () => {
  let service: VentasService;

  const mockRepo = () => ({
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue({ id: 'mock-id', activo: true }),
    create: vi.fn().mockImplementation((dto) => dto),
    save: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 'test-id', ...dto })),
    count: vi.fn().mockResolvedValue(0),
    createQueryBuilder: vi.fn().mockReturnValue({
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
      getOne: vi.fn().mockResolvedValue(null),
      getRawOne: vi.fn().mockResolvedValue({ suma: 0 }),
    }),
  });

  const mockAsientosService = {
    create: vi.fn().mockResolvedValue({ id: 'asiento-id', consecutivo: 101 }),
    anular: vi.fn().mockResolvedValue(true),
  };

  const mockAuditoriaService = {
    registrarLog: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        { provide: getRepositoryToken(FacturaVenta), useFactory: mockRepo },
        { provide: getRepositoryToken(FacturaVentaLinea), useFactory: mockRepo },
        { provide: getRepositoryToken(NotaCreditoVenta), useFactory: mockRepo },
        { provide: getRepositoryToken(NotaCreditoVentaLinea), useFactory: mockRepo },
        { provide: getRepositoryToken(Articulo), useFactory: mockRepo },
        { provide: getRepositoryToken(SaldoBodega), useFactory: mockRepo },
        { provide: getRepositoryToken(KardexMovimiento), useFactory: mockRepo },
        { provide: getRepositoryToken(Bodega), useFactory: mockRepo },
        { provide: getRepositoryToken(Tercero), useFactory: mockRepo },
        { provide: getRepositoryToken(PucCuenta), useFactory: mockRepo },
        { provide: getRepositoryToken(CuentaPorCobrar), useFactory: mockRepo },
        { provide: getRepositoryToken(RecaudoCxc), useFactory: mockRepo },
        { provide: AsientosService, useValue: mockAsientosService },
        { provide: AuditoriaService, useValue: mockAuditoriaService },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: vi.fn().mockReturnValue({
              connect: vi.fn(),
              startTransaction: vi.fn(),
              commitTransaction: vi.fn(),
              rollbackTransaction: vi.fn(),
              release: vi.fn(),
              manager: {
                create: vi.fn().mockImplementation((entity, dto) => ({ id: 'mock-saved-id', ...dto })),
                save: vi.fn().mockImplementation((entity, dto) => Promise.resolve({ id: 'mock-saved-id', ...dto })),
                findOne: vi.fn().mockResolvedValue({ id: 'mock-id', stock_actual: 100 }),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe listar facturas de venta', async () => {
    const resultado = await service.listarFacturas('empresa-id');
    expect(Array.isArray(resultado)).toBe(true);
  });

  it('debe listar notas crédito de venta', async () => {
    const resultado = await service.listarNotasCredito('empresa-id');
    expect(Array.isArray(resultado)).toBe(true);
  });
});
