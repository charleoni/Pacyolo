import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ComprasService } from './compras.service.js';
import { OrdenCompra } from './entities/orden-compra.entity.js';
import { OrdenCompraLinea } from './entities/orden-compra-linea.entity.js';
import { Tercero } from '../terceros/entities/tercero.entity.js';
import { Articulo } from '../inventarios/entities/articulo.entity.js';
import { CxpService } from '../cxp/cxp.service.js';

describe('ComprasService', () => {
  let service: ComprasService;

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
      getMany: vi.fn().mockResolvedValue([]),
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprasService,
        { provide: getRepositoryToken(OrdenCompra), useFactory: mockRepo },
        { provide: getRepositoryToken(OrdenCompraLinea), useFactory: mockRepo },
        { provide: getRepositoryToken(Tercero), useFactory: mockRepo },
        { provide: getRepositoryToken(Articulo), useFactory: mockRepo },
        { provide: CxpService, useValue: { causarFactura: vi.fn() } },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<ComprasService>(ComprasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe listar órdenes de compra', async () => {
    const res = await service.listarOrdenes('empresa-1');
    expect(res).toEqual([]);
  });

  it('debe crear una orden de compra calculando subtotales e impuestos', async () => {
    const oc = await service.crearOrden({
      proveedor_id: 'prov-1',
      fecha_emision: '2026-10-19',
      lineas: [
        {
          articulo_id: 'art-1',
          cantidad_solicitada: 10,
          costo_unitario: 1000,
          porcentaje_iva: 19,
        },
      ],
    });

    expect(oc.numero_orden).toBe('OC-0001');
    expect(oc.subtotal).toBe(10000);
    expect(oc.total_impuestos).toBe(1900);
    expect(oc.total).toBe(11900);
    expect(oc.estado).toBe('BORRADOR');
  });
});
