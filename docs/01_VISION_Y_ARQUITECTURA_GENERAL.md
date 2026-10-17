# 📘 PACYOLO — Sistema Contable Universal & Motor Integrable
## Documento de Análisis: Visión, Negocio y Arquitectura General

*Versión:* 1.0.0 (Fase de Análisis)  
*Fecha:* Octubre 2026  
*Estado:* Arquitectura Aprobada en Análisis  

---

## 1. Declaración de Visión y Propósito

**PACYOLO** es un sistema contable moderno, multi-empresa y agnóstico a la industria, diseñado bajo la normatividad contable y fiscal colombiana (NIIF para Pymes y Microempresas / DUR 2420).

El sistema opera bajo un enfoque dual:
1. **Software Contable Autónomo (SaaS para Contadores y Empresas):** Permite a los contadores y empresas gestionar su contabilidad completa desde una aplicación web moderna (PUC, comprobantes de diario, terceros, cuentas por cobrar, cuentas por pagar, tesorería, impuestos, balances y estados financieros oficiales).
2. **Motor Contable Integrable (API-First / Headless Accounting Engine):** Expone interfaces estandarizadas (REST API / Webhooks / Archivos) para que **cualquier software vertical externo** (ej. *ConjuntOS* para propiedad horizontal, sistemas POS para restaurantes, tiendas e-commerce, software de facturación o aplicaciones médicas) pueda enviar transacciones operativas y delegar en PACYOLO toda su causación contable legal.

---

## 2. Modelo de Tenancy y Negocio (Multi-Empresa para Contadores)

### 2.1. Arquitectura de Aislamiento
- Un contador o firma contable puede registrar una única cuenta de usuario y tener acceso a múltiples **Tenants (Empresas)**, cada una identificada por su propio **NIT** y razón social.
- Cada empresa cuenta con libros contables, catálogo de cuentas PUC, comprobantes, terceros y saldos 100% independientes y aislados a nivel de datos.

```
┌────────────────────────────────────────────────────────┐
│             USUARIO CONTADOR / FIRMA                   │
│   (Credenciales globales, perfil profesional)          │
└──────────────────────────┬─────────────────────────────┘
                           │ Selecciona contexto de trabajo
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │   TENANT A   │ │   TENANT B   │ │   TENANT C   │
   │  Empresa ABC │ │  Conjunto XYZ│ │ Consultorio 1│
   │ NIT 900.111  │ │ NIT 800.222  │ │ NIT 901.333  │
   │ Libro Diario │ │ Libro Diario │ │ Libro Diario │
   │ PUC Propio   │ │ PUC Propio   │ │ PUC Propio   │
   └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 3. Modos de Contabilización en la Integración Externa

Para brindar total flexibilidad y control al contador, cada empresa/tenant dispone del parámetro de configuración:

> **`modo_contabilizacion_integracion`**: `INMEDIATA` | `REVISION_PREVIA`

| Modo | Comportamiento del Sistema | Caso de Uso Típico |
| :--- | :--- | :--- |
| **`INMEDIATA`** | Al recibir el evento vía API (ej. venta, recaudo, gasto), PACYOLO valida la partida doble y genera el asiento contable en estado `CONTABILIZADO`. Impacta saldos y balances en tiempo real sin intervención humana. | Operaciones rutinarias de alta volumetría (ej. recaudo masivo de cuotas o ventas POS diarias de alta confianza). |
| **`REVISION_PREVIA`** | Al recibir el evento, PACYOLO crea el asiento en estado `BORRADOR_INTEGRACION`. El contador recibe una alerta en su bandeja de entrada contable para revisar cuentas, ajustar terceros o imputaciones, y aprobarlo en un clic a `CONTABILIZADO`. | Operaciones complejas, gastos de proveedores, o empresas que exigen control estricto antes de afectar libros oficiales. |

---

## 4. Estructura de Capas de la Plataforma

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CANALES DE ENTRADA                                                       │
│    ┌───────────────────────────┐    ┌───────────────────────────────────┐   │
│    │  Web App PACYOLO (UI)     │    │  API Gateway de Integración       │   │
│    │  (Contador / Operador)    │    │  (Sistemas Externos: POS, PH, ERP)│   │
│    └─────────────┬─────────────┘    └─────────────────┬─────────────────┘   │
└──────────────────┼────────────────────────────────────┼─────────────────────┘
                   │                                    │
┌──────────────────▼────────────────────────────────────▼─────────────────────┐
│ 2. MOTOR DE TRADUCCIÓN Y CAUSACIÓN (Accounting Engine)                      │
│    - Validador de Identidad y Tenant (NIT / Token / Permisos)               │
│    - Evaluador de Modo: ¿Inmediata o Revisión Previa?                       │
│    - Motor de Mapeo de Conceptos (Reglas: Evento Externo ➔ Cuentas PUC)     │
│    - Liquidador de Impuestos y Retenciones (Retefuente, ReteICA, IVA)       │
│    - Validador Inviolable de Partida Doble (Débito == Crédito)              │
│    - Generador de Consecutivos Oficiales (ING-XXX, EGR-XXX, DIA-XXX)        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│ 3. NÚCLEO NIIF Y REGISTROS INMUTABLES (Core Ledger)                         │
│    - Catálogo PUC Jerárquico Dinámico                                       │
│    - Libro Diario & Movimientos                                             │
│    - Libro Mayor y Balances                                                 │
│    - Pista de Auditoría Legal (Audit Log inalterable)                       │
│    - Control de Cierres de Período (Bloqueo de libros cerrados)             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│ 4. SALIDAS, REPORTES Y CERTIFICACIONES                                      │
│    - Estados Financieros NIIF (Situación Financiera, Resultados/PyG)        │
│    - Balances de Prueba (8 y 10 columnas)                                   │
│    - Auxiliares por Tercero y por Cuenta                                    │
│    - Certificados de Retención en PDF para Proveedores                      │
│    - Informes de Conciliación Bancaria                                      │
│    - Exportación a Excel / PDF / Medios Magnéticos                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Principios de Diseño para PACYOLO

1. **Agnóstico al Negocio:** El Core desconoce qué es una "reserva", un "apartamento", una "cama de hospital" o una "mesa de restaurante". El Core solo entiende de:
   - `Terceros` (con NIT/CC)
   - `Documentos y Facturas` (por cobrar o por pagar)
   - `Cuentas Contables PUC`
   - `Valores Monetarios, Impuestos y Retenciones`
2. **Trazabilidad Extensible:** Cada asiento contable almacena metadatos de su origen (`origen_sistema`, `origen_documento_tipo`, `origen_documento_id`), permitiendo hacer *drill-down* hasta el registro original en el sistema que lo envió.
3. **Inalterabilidad NIIF:** En PACYOLO los comprobantes contabilizados no se borran; se anulan mediante asientos de reversión formal con fecha y motivo de auditoría.
