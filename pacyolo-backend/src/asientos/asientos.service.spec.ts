import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AsientosService } from './asientos.service.js';
import { TipoComprobante } from './entities/asiento.entity.js';

describe('AsientosService — Motor de Partida Doble NIIF', () => {
  let service: AsientosService;
  let mockDataSource: any;
  let mockAsientoRepo: any;
  let mockPucRepo: any;

  beforeEach(() => {
    mockDataSource = {
      createQueryRunner: vi.fn(),
    };
    mockAsientoRepo = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    mockPucRepo = {
      find: vi.fn(),
    };

    service = new AsientosService(
      mockDataSource as any,
      mockAsientoRepo as any,
      mockPucRepo as any,
    );
  });

  it('debe rechazar un asiento contable descuadrado por 1 peso', async () => {
    const dtoDescuadrado: any = {
      empresa_id: '11111111-1111-1111-1111-111111111111',
      tipo_comprobante: TipoComprobante.DIA,
      fecha_contable: '2026-10-17',
      glosa_general: 'Prueba asiento descuadrado',
      lineas: [
        {
          cuenta_id: 'aaaa-1111',
          debito: 500000,
          credito: 0,
          glosa_detalle: 'Débito Bancos',
        },
        {
          cuenta_id: 'bbbb-2222',
          debito: 0,
          credito: 499999, // Descuadre intencional de $1 peso
          glosa_detalle: 'Crédito Caja',
        },
      ],
    };

    await expect(service.create(dtoDescuadrado)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe rechazar un asiento con valores en cero', async () => {
    const dtoCero: any = {
      empresa_id: '11111111-1111-1111-1111-111111111111',
      tipo_comprobante: TipoComprobante.DIA,
      fecha_contable: '2026-10-17',
      glosa_general: 'Prueba asiento en cero',
      lineas: [
        { cuenta_id: 'a', debito: 0, credito: 0, glosa_detalle: 'Línea 1' },
        { cuenta_id: 'b', debito: 0, credito: 0, glosa_detalle: 'Línea 2' },
      ],
    };

    await expect(service.create(dtoCero)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe rechazar imputación a una cuenta de nivel superior (no auxiliar)', async () => {
    const dtoValidoMatematicamente: any = {
      empresa_id: '11111111-1111-1111-1111-111111111111',
      tipo_comprobante: TipoComprobante.DIA,
      fecha_contable: '2026-10-17',
      glosa_general: 'Prueba cuenta no auxiliar',
      lineas: [
        { cuenta_id: 'cuenta-clase-1', debito: 100000, credito: 0, glosa_detalle: 'D' },
        { cuenta_id: 'cuenta-auxiliar-2', debito: 0, credito: 100000, glosa_detalle: 'C' },
      ],
    };

    // Simulamos que la cuenta 1 es de nivel superior (permite_movimiento = false)
    mockPucRepo.find.mockResolvedValue([
      { id: 'cuenta-clase-1', codigo: '1', nombre: 'ACTIVO', permite_movimiento: false },
      { id: 'cuenta-auxiliar-2', codigo: '11050501', nombre: 'Caja', permite_movimiento: true },
    ]);

    await expect(service.create(dtoValidoMatematicamente)).rejects.toThrow(
      BadRequestException,
    );
  });
});
