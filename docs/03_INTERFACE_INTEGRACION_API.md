# 🔌 PACYOLO — Especificación de la Interfaz de Integración (API Externa)
## Documento de Análisis: Endpoints, Contratos JSON y Flujo de Comunicación

*Versión:* 1.0.0 (Fase de Análisis)  
*Fecha:* Octubre 2026  
*Estado:* Arquitectura Aprobada en Análisis  

---

## 1. Propósito de la Interfaz

La **Interfaz de Integración de PACYOLO** es la puerta de enlace estandarizada que permite a cualquier software externo enviar sus movimientos comerciales u operativos hacia PACYOLO para su causación contable legal.

### Casos de Uso Reales:
1. **Vertical Conjuntos (PH):** Al liquidar el mes, envía las cuotas de administración emitidas. Al confirmar pagos en línea de residentes (PSE/Wompi), envía los recaudos a bancos.
2. **Sistema POS (Restaurante o Comercio):** Al hacer el "Cierre de Caja Diario" (Z), envía un comprobante consolidado de ventas del día con desglose de medios de pago (efectivo, tarjeta, datáfono).
3. **Plataforma E-commerce:** Envía cada orden de compra pagada con su IVA generado correspondiente.
4. **Software de Facturación / Nómina:** Envía documentos electrónicos ya validados ante la DIAN para que se asienten en la contabilidad.

---

## 2. Seguridad, Autenticación e Idempotencia

### 2.1. Headers Obligatorios
Toda petición enviada a la API de integración debe incluir los siguientes encabezados HTTP:

```http
Content-Type: application/json
X-Pacyolo-Api-Key: pk_live_9f83b27a8109d43...  # Token único por empresa/tenant
X-Pacyolo-Tenant-NIT: 900123456-7              # NIT de la empresa a afectar
```

### 2.2. Garantía de No Duplicidad (Idempotencia)
Para evitar que una falla de red o reintento genere asientos contables duplicados, cada payload exige:
- `origen_sistema`: Nombre del software emisor (ej. `'CONJUNTOS_PH'`, `'POS_BAR'`, `'TIENDA_WEB'`).
- `origen_documento_id`: Identificador único de la transacción en el sistema externo (ej. `'CUOTA-2026-10-APTO-302'`, `'ORDEN-98124'`).

> 🛡️ **Comportamiento Idempotente:** Si PACYOLO recibe una petición con una combinación `origen_sistema` + `origen_documento_id` que ya fue procesada previamente para ese tenant, **no duplicará el asiento**, sino que responderá `200 OK` retornando el asiento existente y su estado actual.

---

## 3. Endpoints Estándar de Integración

### 3.1. Ingesta de Facturación / Cuentas por Cobrar (`POST /api/v1/integracion/facturas-venta`)
Se utiliza cuando el sistema externo emite una factura, cuenta de cobro o cuota periódica a un cliente/usuario.

#### Payload de Ejemplo (JSON enviado por sistema externo):
```json
{
  "origen_sistema": "CONJUNTOS_PH",
  "origen_documento_id": "CUOTA-2026-10-TORRE1-402",
  "fecha_emision": "2026-10-01",
  "fecha_vencimiento": "2026-10-20",
  "codigo_evento_mapeo": "FACTURACION_CUOTA_ADMIN",
  "concepto_general": "Cuota de Administración Octubre 2026 - Apto 402",
  "tercero": {
    "tipo_documento": "CC",
    "numero_documento": "1020304050",
    "nombre_completo": "Carlos Andrés Mendoza",
    "email": "carlos.mendoza@email.com",
    "telefono": "3001234567"
  },
  "items": [
    {
      "concepto": "Cuota Ordinaria Administración",
      "valor_bruto": 350000.00,
      "descuento": 0.00,
      "iva_porcentaje": 0.00
    }
  ]
}
```

#### Respuesta de PACYOLO (Modo `INMEDIATA`):
```json
{
  "status": "SUCCESS",
  "estado_asiento": "CONTABILIZADO",
  "asiento_id": "c4b312a0-8a8b-4a55-b44e-379e4313fa09",
  "consecutivo": 421,
  "numero_comprobante": "FAC-000421",
  "fecha": "2026-10-01",
  "partida_doble": {
    "total_debito": 350000.00,
    "total_credito": 350000.00,
    "lineas": [
      { "cuenta": "130505", "nombre": "Clientes / CxC Copropietarios", "debito": 350000.00, "credito": 0.00 },
      { "cuenta": "417505", "nombre": "Ingresos Cuotas Administración", "debito": 0.00, "credito": 350000.00 }
    ]
  }
}
```

#### Respuesta de PACYOLO (Modo `REVISION_PREVIA`):
```json
{
  "status": "QUEUED_FOR_REVIEW",
  "estado_asiento": "REVISION_INTEGRACION",
  "asiento_id": "c4b312a0-8a8b-4a55-b44e-379e4313fa09",
  "mensaje": "El comprobante fue registrado exitosamente en la bandeja de borradores pendientes por revisión del contador."
}
```

---

### 3.2. Ingesta de Recaudos y Pagos (`POST /api/v1/integracion/recaudos`)
Se utiliza cuando entra dinero al banco o caja (ej. pago de cliente por pasarela, transferencia o efectivo).

#### Payload de Ejemplo:
```json
{
  "origen_sistema": "CONJUNTOS_PH",
  "origen_documento_id": "PAGO-WOMPI-TRX-884920",
  "fecha_pago": "2026-10-05",
  "medio_pago": "BANCOLOMBIA_TRANSFERENCIA",
  "cuenta_banco_destino": "11100501", 
  "codigo_evento_mapeo": "RECAUDO_CARTERA",
  "concepto_general": "Recaudo Cuota Administración Octubre - Apto 402",
  "tercero_documento": "1020304050",
  "monto": 350000.00,
  "referencia_bancaria": "TRX-WOMPI-991203"
}
```

#### Causación automática generada por PACYOLO:
- **Débito:** `11100501` (Bancos Nacionales - Cta Corriente) → \$350.000
- **Crédito:** `13050501` (Cuentas por Cobrar Clientes / Residentes) → \$350.000

---

### 3.3. Ingesta de Gastos y Facturas de Compra (`POST /api/v1/integracion/gastos-compras`)
Se utiliza cuando se incurre en un gasto operativo con un proveedor.

#### Payload de Ejemplo:
```json
{
  "origen_sistema": "CONJUNTOS_PH",
  "origen_documento_id": "OC-MTTO-2026-88",
  "fecha_factura": "2026-10-10",
  "fecha_vencimiento": "2026-10-30",
  "proveedor": {
    "tipo_documento": "NIT",
    "numero_documento": "900555444",
    "digito_verificacion": "3",
    "nombre_completo": "Seguridad & Vigilancia Privada Ltda",
    "email": "facturacion@seguridad.com"
  },
  "centro_costo_codigo": "CC-SEDE-PRINCIPAL",
  "codigo_evento_mapeo": "GASTO_VIGILANCIA",
  "subtotal": 4500000.00,
  "calcular_retenciones_automaticas": true
}
```

#### Causación con Retenciones Automáticas generada por PACYOLO:
- **Débito (Gasto):** `513505` (Servicios de Vigilancia) → \$4.500.000
- **Crédito (Retención):** `236525` (Retefuente Servicios 4%) → \$180.000
- **Crédito (ReteICA):** `236805` (ReteICA Servicios 0.966%) → \$43.470
- **Crédito (CxP Proveedor):** `233525` (Cuentas por Pagar Proveedor) → \$4.276.530  
*(Partida Doble perfecta: \$4.500.000 Débito == \$4.500.000 Crédito)*

---

### 3.4. Ingesta de Asientos Contables Directos (`POST /api/v1/integracion/asiento-directo`)
Permite a cualquier sistema contable legacy o middleware inyectar directamente líneas arbitrarias de partida doble.

```json
{
  "origen_sistema": "MIGRACION_EXCEL",
  "origen_documento_id": "MIG-SALDOS-APERTURA-2026",
  "tipo_comprobante": "NOTA_CONTABLE",
  "fecha": "2026-01-01",
  "glosa": "Saldos iniciales de apertura NIIF",
  "lineas": [
    { "cuenta_codigo": "111005", "tercero_documento": "900123456", "debito": 15000000.00, "credito": 0.00, "glosa": "Saldo bancos" },
    { "cuenta_codigo": "310505", "tercero_documento": "900123456", "debito": 0.00, "credito": 15000000.00, "glosa": "Capital social suscrito" }
  ]
}
```

---

## 4. Webhooks de Notificación de Retorno (Outbound)

Cuando PACYOLO trabaja en modo `REVISION_PREVIA`, el sistema externo necesita saber cuándo el contador aprobó o rechazó una transacción.

Si la empresa tiene configurado `webhook_notificaciones_url`, PACYOLO enviará un `POST` al sistema externo:

```json
{
  "evento": "COMPROBANTE_APROBADO",
  "origen_sistema": "CONJUNTOS_PH",
  "origen_documento_id": "CUOTA-2026-10-TORRE1-402",
  "asiento_id": "c4b312a0-8a8b-4a55-b44e-379e4313fa09",
  "numero_comprobante": "FAC-000421",
  "aprobado_por": "Contadora Maria Lopez (TP 189204-T)",
  "fecha_aprobacion": "2026-10-02T10:14:20Z"
}
```
Esto le permite a *Conjuntos* (o a cualquier software conectado) marcar en su propia base de datos: *"Contabilizado en PACYOLO con comprobante FAC-000421"*.
