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
});
