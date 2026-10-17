import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('PACYOLO — Ciclo de Vida Contable E2E', () => {
  let app: INestApplication;
  let empresaId: string;
  let terceroId: string;
  let cuentaCajaId: string;
  let cuentaBancoId: string;
  let cxpId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Debe registrar una nueva Empresa y calcular su DV de forma automática', async () => {
    const nitRandom = `901${Math.floor(100000 + Math.random() * 900000)}`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/empresas')
      .send({
        nit: nitRandom,
        razon_social: 'Compañía de Pruebas E2E S.A.S.',
        regimen_tributario: 'COMUN',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.nit).toBe(nitRandom);
    expect(res.body.dv).toBeDefined(); // Autocalculado por módulo 11
    expect(res.body.api_key_integracion).toBeDefined(); // Generada
    empresaId = res.body.id;
  });

  it('2. Debe sembrar el catálogo PUC NIIF Colombia estándar para la empresa', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/puc/sembrar/${empresaId}`)
      .expect(201);

    expect(res.body.total_cuentas).toBeGreaterThan(30);
  });

  it('3. Debe consultar las cuentas auxiliares para imputación contable', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/puc/auxiliares?empresa_id=${empresaId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const caja = res.body.find((c: any) => c.codigo === '11050501');
    const banco = res.body.find((c: any) => c.codigo === '11100501');

    expect(caja).toBeDefined();
    expect(banco).toBeDefined();

    cuentaCajaId = caja.id;
    cuentaBancoId = banco.id;
  });

  it('4. Debe registrar un Tercero asociado a la empresa', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/terceros')
      .send({
        empresa_id: empresaId,
        tipo_identificacion: 'NIT',
        numero_identificacion: '900999888',
        nombre_completo: 'Proveedor de Servicios S.A.S.',
        es_proveedor: true,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.numero_identificacion).toBe('900999888');
    terceroId = res.body.id;
  });

  it('5. Debe RECHAZAR con 400 un asiento contable descuadrado', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/asientos')
      .send({
        empresa_id: empresaId,
        tipo_comprobante: 'DIA',
        fecha_contable: '2026-10-17',
        glosa_general: 'Asiento intencionalmente descuadrado',
        lineas: [
          {
            cuenta_id: cuentaBancoId,
            debito: 1000000,
            credito: 0,
            glosa_detalle: 'Ingreso a bancos',
          },
          {
            cuenta_id: cuentaCajaId,
            debito: 0,
            credito: 999000, // Descuadre de $1.000
            glosa_detalle: 'Salida de caja',
          },
        ],
      })
      .expect(400);

    expect(res.body.message).toContain('Descuadre contable detectado');
  });

  it('6. Debe REGISTRAR con 201 un comprobante contable cuadrado con numeración DIA-000001', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/asientos')
      .send({
        empresa_id: empresaId,
        tipo_comprobante: 'DIA',
        fecha_contable: '2026-10-17',
        glosa_general: 'Traslado de fondos Caja a Bancos',
        lineas: [
          {
            cuenta_id: cuentaBancoId,
            debito: 1500000,
            credito: 0,
            glosa_detalle: 'Consignación en cuenta corriente',
          },
          {
            cuenta_id: cuentaCajaId,
            debito: 0,
            credito: 1500000,
            glosa_detalle: 'Salida de caja principal',
          },
        ],
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.consecutivo).toBe(1);
    expect(res.body.numero_comprobante).toBe('DIA-000001');
    expect(Number(res.body.total_debito)).toBe(1500000);
    expect(Number(res.body.total_credito)).toBe(1500000);
    expect(res.body.lineas).toHaveLength(2);
  });

  it('7. Debe consultar el Libro Diario de la empresa y reflejar el comprobante registrado', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/asientos?empresa_id=${empresaId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].numero_comprobante).toBe('DIA-000001');
  });

  it('8. Debe SEMBRAR con 201 las reglas estándar de impuestos y retenciones para la empresa', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/impuestos/sembrar/${empresaId}`)
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    const codigos = res.body.map((r: any) => r.codigo);
    expect(codigos).toContain('RETE_COMPRAS_2.5');
    expect(codigos).toContain('RETE_SERVICIOS_4.0');
    expect(codigos).toContain('RETE_HONORARIOS_10.0');
  });

  it('9. Debe LISTAR con 200 las reglas tributarias de la empresa con sus cuentas PUC asociadas', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/impuestos?empresa_id=${empresaId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    const reteCompras = res.body.find((r: any) => r.codigo === 'RETE_COMPRAS_2.5');
    expect(reteCompras).toBeDefined();
    expect(reteCompras.cuenta_credito).toBeDefined();
    expect(reteCompras.cuenta_credito.codigo).toBe('236540');
    expect(Number(reteCompras.base_minima)).toBe(1270000);
  });

  it('10. Debe CALCULAR con 200 retenciones e IVA para una compra de $2.500.000 con desglose contable', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/impuestos/calcular')
      .send({
        empresa_id: empresaId,
        tipo_operacion: 'COMPRA_GASTO',
        subtotal: 2500000,
        reglas: [
          { regla_id_o_codigo: 'IVA_19_DESCONTABLE' },
          { regla_id_o_codigo: 'RETE_COMPRAS_2.5' },
          { regla_id_o_codigo: 'RETEICA_BOGOTA_9.66' },
        ],
      })
      .expect(200);

    expect(res.body.subtotal).toBe(2500000);
    expect(res.body.total_iva).toBe(475000);
    expect(res.body.total_retenciones).toBe(86650);
    expect(res.body.total_neto).toBe(2888350);
    expect(res.body.detalles).toHaveLength(3);
    expect(res.body.lineas_asiento_sugeridas).toHaveLength(3);
  });

  it('11. Debe SEMBRAR con 201 las plantillas estándar de mapeo conceptual para la empresa', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/mapeo-conceptos/sembrar/${empresaId}`)
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    const codigos = res.body.map((p: any) => p.codigo_concepto);
    expect(codigos).toContain('COMPRA_INVENTARIO');
    expect(codigos).toContain('HONORARIOS_PROFESIONALES');
    expect(codigos).toContain('SERVICIOS_ASEO_VIGILANCIA');
  });

  it('12. Debe CONSULTAR con 200 la plantilla por código de concepto mnemónico', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/mapeo-conceptos/codigo/${empresaId}/COMPRA_INVENTARIO`)
      .expect(200);

    expect(res.body.codigo_concepto).toBe('COMPRA_INVENTARIO');
    expect(res.body.cuenta_debito).toBeDefined();
    expect(res.body.cuenta_debito.codigo).toBe('1435');
    expect(res.body.cuenta_credito).toBeDefined();
    expect(res.body.cuenta_credito.codigo).toBe('220505');
  });

  it('13. Debe CAUSAR con 201 una factura de compra a proveedor (CxP) generando asiento CAU y registro de deuda', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cxp/causar')
      .send({
        empresa_id: empresaId,
        tercero_id: terceroId,
        codigo_concepto: 'COMPRA_INVENTARIO',
        numero_factura_proveedor: 'FAC-E2E-001',
        fecha_emision: '2026-10-17',
        fecha_vencimiento: '2026-11-17',
        subtotal: 2500000,
        glosa: 'Factura E2E de compra de mercancías',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.asiento_id).toBeDefined();
    expect(res.body.asiento.numero_comprobante).toMatch(/^CAU-\d{6}$/);
    expect(Number(res.body.subtotal)).toBe(2500000);
    expect(Number(res.body.total_iva)).toBe(475000); // 19%
    expect(Number(res.body.total_retenciones)).toBe(86650); // 2.5% + 0.966%
    expect(Number(res.body.monto_total)).toBe(2888350); // Neto a pagar al proveedor
    expect(Number(res.body.saldo_pendiente)).toBe(2888350);
    expect(res.body.estado).toBe('PENDIENTE');
    expect(Number(res.body.asiento.total_debito)).toBe(Number(res.body.asiento.total_credito));
    cxpId = res.body.id;
  });

  it('14. Debe CONSULTAR el resumen de cartera de proveedores reflejando la deuda por vencer', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/cxp/cartera/${empresaId}`)
      .expect(200);

    expect(res.body.empresa_id).toBe(empresaId);
    expect(res.body.total_cartera).toBe(2888350);
    expect(res.body.total_por_vencer).toBe(2888350);
    expect(res.body.total_vencida).toBe(0);
    expect(res.body.total_facturas_pendientes).toBeGreaterThanOrEqual(1);
  });

  it('15. Debe PAGAR con 201 la factura generando comprobante de egreso EGR y liquidando saldo a cero', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cxp/pagar')
      .send({
        empresa_id: empresaId,
        cuenta_por_pagar_id: cxpId,
        cuenta_banco_id: cuentaBancoId,
        monto_pago: 2888350,
        fecha_pago: '2026-10-17',
        metodo_pago: 'TRANSFERENCIA',
        referencia_transaccion: 'TRX-BANCOLOMBIA-9921',
        glosa: 'Pago total factura proveedor por transferencia bancaria',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(Number(res.body.monto_pagado)).toBe(2888350);
    expect(res.body.asiento).toBeDefined();
    expect(res.body.asiento.numero_comprobante).toMatch(/^EGR-\d{6}$/);
    expect(Number(res.body.asiento.total_debito)).toBe(2888350);
    expect(Number(res.body.asiento.total_credito)).toBe(2888350);
    expect(Number(res.body.cuenta_por_pagar.saldo_pendiente)).toBe(0);
    expect(res.body.cuenta_por_pagar.estado).toBe('PAGADA_TOTAL');
  });

  it('16. Debe LISTAR con 200 el historial de pagos de la factura mostrando el comprobante EGR', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/cxp/${cxpId}/pagos`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].asiento.numero_comprobante).toMatch(/^EGR-\d{6}$/);
    expect(Number(res.body[0].monto_pagado)).toBe(2888350);
  });

  it('17. Debe CONSULTAR la cartera de proveedores reflejando deuda cero tras el pago total', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/cxp/cartera/${empresaId}`)
      .expect(200);

    expect(res.body.total_cartera).toBe(0);
    expect(res.body.total_facturas_pendientes).toBe(0);
  });
});





