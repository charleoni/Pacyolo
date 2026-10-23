import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventariosService } from './inventarios.service.js';
import { Articulo } from './entities/articulo.entity.js';
import { SaldoBodega } from './entities/saldo-bodega.entity.js';
import { KardexMovimiento } from './entities/kardex-movimiento.entity.js';
import { EntradaAlmacen } from './entities/entrada-almacen.entity.js';
import { EntradaAlmacenLinea } from './entities/entrada-almacen-linea.entity.js';
import { NotaAjuste } from './entities/nota-ajuste.entity.js';
import { NotaAjusteLinea } from './entities/nota-ajuste-linea.entity.js';
import { Bodega } from '../parametros/entities/bodega.entity.js';
import { TipoMovimiento } from '../parametros/entities/tipo-movimiento.entity.js';
import { CxpService } from '../cxp/cxp.service.js';

describe('InventariosService', () => {
  let service: InventariosService;

  const mockRepo = () => ({
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
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

  const mockDataSource = {
    createQueryRunner: vi.fn().mockReturnValue({
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
      release: vi.fn(),
      manager: {
        findOne: vi.fn(),
        create: vi.fn().mockImplementation((_, dto) => dto),
        save: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 'test-saved-id', ...dto })),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventariosService,
        { provide: getRepositoryToken(Articulo), useFactory: mockRepo },
        { provide: getRepositoryToken(SaldoBodega), useFactory: mockRepo },
        { provide: getRepositoryToken(KardexMovimiento), useFactory: mockRepo },
        { provide: getRepositoryToken(EntradaAlmacen), useFactory: mockRepo },
        { provide: getRepositoryToken(EntradaAlmacenLinea), useFactory: mockRepo },
        { provide: getRepositoryToken(NotaAjuste), useFactory: mockRepo },
        { provide: getRepositoryToken(NotaAjusteLinea), useFactory: mockRepo },
        { provide: getRepositoryToken(Bodega), useFactory: mockRepo },
        { provide: getRepositoryToken(TipoMovimiento), useFactory: mockRepo },
        { provide: CxpService, useValue: { causarFactura: vi.fn() } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<InventariosService>(InventariosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe listar artículos usando el query builder', async () => {
    const articulos = await service.listarArticulos('empresa-1');
    expect(articulos).toEqual([]);
  });

  it('debe crear un nuevo artículo formateando el código a mayúsculas', async () => {
    const creado = await service.crearArticulo({
      codigo: 'art-001',
      nombre: 'Artículo de Prueba',
      tipo_articulo: 'INVENTARIABLE',
    });
    expect(creado.codigo).toBe('ART-001');
  });
});
