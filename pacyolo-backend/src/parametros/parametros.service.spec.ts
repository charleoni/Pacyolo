import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParametrosService } from './parametros.service.js';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity.js';
import { TipoPersona } from './entities/tipo-persona.entity.js';
import { RegimenFiscal } from './entities/regimen-fiscal.entity.js';
import { ClasificacionTercero } from './entities/clasificacion-tercero.entity.js';
import { TipoComprobanteConfig } from './entities/tipo-comprobante-config.entity.js';
import { MetodoPago } from './entities/metodo-pago.entity.js';
import { Departamento } from './entities/departamento.entity.js';
import { Municipio } from './entities/municipio.entity.js';
import { UnidadMedida } from './entities/unidad-medida.entity.js';
import { CategoriaArticulo } from './entities/categoria-articulo.entity.js';
import { Bodega } from './entities/bodega.entity.js';
import { TipoMovimiento } from './entities/tipo-movimiento.entity.js';

describe('ParametrosService', () => {
  let service: ParametrosService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (entity) => ({ id: 'mock-uuid', ...entity })),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParametrosService,
        { provide: getRepositoryToken(TipoIdentificacion), useValue: mockRepo },
        { provide: getRepositoryToken(TipoPersona), useValue: mockRepo },
        { provide: getRepositoryToken(RegimenFiscal), useValue: mockRepo },
        { provide: getRepositoryToken(ClasificacionTercero), useValue: mockRepo },
        { provide: getRepositoryToken(TipoComprobanteConfig), useValue: mockRepo },
        { provide: getRepositoryToken(MetodoPago), useValue: mockRepo },
        { provide: getRepositoryToken(Departamento), useValue: mockRepo },
        { provide: getRepositoryToken(Municipio), useValue: mockRepo },
        { provide: getRepositoryToken(UnidadMedida), useValue: mockRepo },
        { provide: getRepositoryToken(CategoriaArticulo), useValue: mockRepo },
        { provide: getRepositoryToken(Bodega), useValue: mockRepo },
        { provide: getRepositoryToken(TipoMovimiento), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ParametrosService>(ParametrosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe sembrar semillas globales si no existen', async () => {
    await service.sembrarSemillasGlobales();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('debe crear un nuevo tipo de identificación personalizado', async () => {
    const res = await service.crearTipoIdentificacion({
      codigo: 'PPT',
      nombre: 'Permiso Especial',
      aplica_digito_verificacion: false,
    });
    expect(res).toBeDefined();
    expect(res.codigo).toBe('PPT');
  });

  it('debe listar tipos de comprobante combinando defaults globales y de empresa', async () => {
    const res = await service.listarTiposComprobante('empresa-123');
    expect(res).toEqual([]);
    expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('debe activar o inactivar un parámetro existente si no está en uso', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'mock-id', codigo: 'CC', nombre: 'Cédula', activo: true });
    const res = await service.cambiarEstado('tipos-identificacion', 'mock-id', false);
    expect(res.activo).toBe(false);
  });

  it('debe rechazar la inactivación con BadRequestException si el parámetro está en uso', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'mock-id', codigo: 'NIT', nombre: 'NIT', activo: true });
    vi.spyOn(service, 'consultarConteosUso').mockResolvedValueOnce(new Map([['NIT', 5]]));

    await expect(service.cambiarEstado('tipos-identificacion', 'mock-id', false)).rejects.toThrow(
      'No es posible inactivar el parámetro'
    );
  });

  it('debe actualizar los atributos de un parámetro', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'mock-id', codigo: 'CC', nombre: 'Cédula', activo: true });
    const res = await service.actualizarParametro('tipos-identificacion', 'mock-id', {
      nombre: 'Cédula de Ciudadanía Colombiana',
      codigo_dian: '13',
    });
    expect(res).toBeDefined();
    expect(res.nombre).toBe('Cédula de Ciudadanía Colombiana');
  });

  it('debe rechazar modificar el código si el parámetro está en uso', async () => {
    mockRepo.findOne.mockResolvedValueOnce({ id: 'mock-id', codigo: 'NIT', nombre: 'NIT', activo: true });
    vi.spyOn(service, 'consultarConteosUso').mockResolvedValueOnce(new Map([['NIT', 10]]));

    await expect(
      service.actualizarParametro('tipos-identificacion', 'mock-id', {
        codigo: 'NIT_NUEVO',
      })
    ).rejects.toThrow('No es posible cambiar el código');
  });

  it('debe listar departamentos oficiales DANE', async () => {
    const res = await service.listarDepartamentos();
    expect(res).toEqual([]);
    expect(mockRepo.find).toHaveBeenCalled();
  });

  it('debe buscar municipios oficiales DANE por término o departamento', async () => {
    const res = await service.buscarMunicipios('Bogotá', '11');
    expect(res).toEqual([]);
    expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('debe crear y listar unidades de medida oficiales DIAN/ISO', async () => {
    const creado = await service.crearUnidadMedida({ codigo: 'UND', nombre: 'Unidad', codigo_dian: '94' });
    expect(creado).toBeDefined();
    expect(creado.codigo).toBe('UND');

    const lista = await service.listarUnidadesMedida('emp-1');
    expect(lista).toBeDefined();
  });

  it('debe crear y listar categorías de artículos con cuentas NIIF', async () => {
    const creado = await service.crearCategoriaArticulo({
      codigo: 'MERCANCIA',
      nombre: 'Mercancía Venta',
      cuenta_inventario: '143505',
    });
    expect(creado).toBeDefined();
    expect(creado.codigo).toBe('MERCANCIA');

    const lista = await service.listarCategoriasArticulos('emp-1');
    expect(lista).toBeDefined();
  });

  it('debe crear y listar bodegas de almacenamiento', async () => {
    const creado = await service.crearBodega({ codigo: 'BOD-01', nombre: 'Bodega Principal' });
    expect(creado).toBeDefined();
    expect(creado.codigo).toBe('BOD-01');

    const lista = await service.listarBodegas('emp-1');
    expect(lista).toBeDefined();
  });

  it('debe crear y listar tipos de movimientos de inventario', async () => {
    const creado = await service.crearTipoMovimiento({ codigo: 'ENT_COMPRA', nombre: 'Entrada Compra', naturaleza: 'ENTRADA' });
    expect(creado).toBeDefined();
    expect(creado.codigo).toBe('ENT_COMPRA');

    const lista = await service.listarTiposMovimiento('emp-1');
    expect(lista).toBeDefined();
  });
});
