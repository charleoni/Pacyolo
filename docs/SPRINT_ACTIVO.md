# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: 2 horas diarias base)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/03-integracion-webhooks`  
*Última Versión Publicada:* `v0.2.0-sprint2` (Fusionado en `develop` y `main`)

---

## 🎯 SPRINT 3: Interfaz de Integración Externa (API-First / Webhooks & Idempotencia)
- **Objetivo del Sprint:** Permitir que sistemas externos (ERPs comerciales, facturadores electrónicos, plataformas de nómina o e-commerce) sincronicen transacciones en PACYOLO con endpoints desacoplados (`POST /api/v1/integracion/facturas-venta`, `POST /api/v1/integracion/recaudos`), garantizando idempotencia estricta, soporte para modo `INMEDIATA` vs `REVISION_PREVIA` (borradores pendientes de aprobación), y notificación asíncrona mediante Webhooks firmados.
- **Entregables Evaluativos para el Usuario:**
  - Endpoint de ingesta de Facturas de Venta (`POST /api/v1/integracion/facturas-venta`) con cálculo automático de cuentas por cobrar (CxC), IVA generado y autorretenciones.
  - Endpoint de Recaudos / Cobros (`POST /api/v1/integracion/recaudos`) que cancela saldos de CxC e ingresa dinero a cuentas bancarias/caja.
  - Soporte de modo de contabilización: `INMEDIATA` (genera comprobante contable directo) o `REVISION_PREVIA` (queda en bandeja de borradores `PENDIENTE_REVISION`).
  - Bandeja y endpoints para listar, aprobar o rechazar comprobantes en borrador.
  - Sistema de Webhooks con firma HMAC-SHA256 para notificar al sistema externo cuando un comprobante es aprobado o rechazado.
  - Suite de pruebas unitarias y E2E que validen ingesta masiva, idempotencia y despacho de webhooks.

---

### 📋 Desglose de Micro-Tareas Sprint 3 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **3.1** | Ingesta Facturas Venta | DTOs, endpoint `POST /api/v1/integracion/facturas-venta`, mapeo de conceptos de venta, validación de idempotencia (`origen_sistema` + `origen_documento_id`) y generación de CxC / comprobante `FAC` o borrador. | 2h | `[x]` Completado | 17/10/2026 |
| **3.2** | Ingesta Recaudos (CxC) | Endpoint `POST /api/v1/integracion/recaudos` para registrar cobros de facturas de clientes, cruce de saldos de cartera CxC y comprobante de ingreso `ING`. | 2h | `[ ]` Pendiente | - |
| **3.3** | Bandeja de Borradores | Endpoints para consultar documentos en revisión (`GET /api/v1/integracion/borradores`), aprobar borrador (`POST /api/v1/integracion/borradores/:id/aprobar`) generando asiento contable, o rechazarlo (`POST /api/v1/integracion/borradores/:id/rechazar`). | 2h | `[ ]` Pendiente | - |
| **3.4** | Motor de Webhooks | Entidad y servicio de suscripción de Webhooks (`core_webhooks`), cola o despachador de eventos HTTP con firma criptográfica HMAC-SHA256 y reintentos ante fallos. | 2h | `[ ]` Pendiente | - |
| **3.5** | Pruebas & Documentación | Pruebas unitarias y E2E de sincronización externa, simulación de webhook receiver y documentación OpenAPI / Postman. | 2h | `[ ]` Pendiente | - |

---

## 📜 Historial de Sprints Cerrados

### ✅ SPRINT 2: Motor de Retenciones, Mapeo & Cuentas por Pagar (COMPLETADO 100%)
- **Versión de Cierre:** `v0.2.0-sprint2` (17/10/2026).
- **Logros:**
  - Motor de reglas tributarias (`cont_impuestos_reglas`) y seeder estándar de Colombia (Retefuente, ReteICA, ReteIVA, IVA).
  - Servicio tributario con control de bases mínimas y cuentas contables NIIF (2365, 2367, 2368, 2408).
  - Plantillas de mapeo comercial a cuentas contables (`cont_plantillas_mapeo`).
  - Módulo de CxP (`cont_cuentas_por_pagar`): causación de compras con retenciones automáticas y comprobante `CAU`, cartera ejecutiva por vencer y vencida.
  - Pago y Comprobante de Egreso (`cont_pagos_cxp`): liquidación de pasivo a `$0.00` y emisión de `EGR`.
  - 21 pruebas unitarias y 17 pruebas E2E pasando al 100%.

### ✅ SPRINT 1: Cimientos del Core Ledger NIIF & Primer Comprobante (COMPLETADO 100%)
- **Versión de Cierre:** `v0.1.0-sprint1` (17/10/2026).
- **Logros:**
  - Base de datos PostgreSQL `pacyolo_dev` con esquemas `core` y `contabilidad`.
  - Módulos `Empresas` (tenants con validación de dígito de verificación DIAN Modulo 11), `Terceros` y `PUC` (árbol de 5 niveles + seeder NIIF universal).
  - Motor de partida doble con bloqueo pesimista de consecutivos (`DIA-000001`, `ING-000001`, `EGR-000001`), anulación por contra-asiento NIIF y validación estricta de cuentas auxiliares.
  - 11 pruebas automatizadas pasando al 100% (unitarias + E2E en Vitest).
  - Documentación Swagger en `/api/docs` y Colección Postman exportada.

---

## 📝 Bitácora Diaria de Avance (Daily Log)

| Sesión # | Fecha | Horas Dedicadas | Tareas Abordadas | Logros del Día | Bloqueos / Notas |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | 17/10/2026 | 2h+ | **Sprint 1 Completo (1.1 a 1.8)** | Cimientos del Core Ledger NIIF completados al 100%. Repositorio Git enlazado a GitHub, base de datos `pacyolo_dev` conectada en PostgreSQL con 5 tablas creadas (`core_empresas`, `core_terceros`, `cont_puc_cuentas`, `cont_asientos`, `cont_asiento_lineas`). Motor de partida doble con consecutivos automáticos, endpoints documentados en Swagger y suites de tests unitarios y E2E pasando con 100% de éxito. Colección Postman generada. | **HITO ALCANZADO: SPRINT 1 COMPLETADO EXITOSAMENTE.** |
| **2** | 17/10/2026 | 2h+ | **Sprint 2 Completo (2.1 a 2.6)** | Release `v0.1.0-sprint1` en GitHub. Rama `sprint/02-retenciones-cxp`. Implementado el motor tributario colombiano (Retefuente, ReteICA, IVA), mapeo de conceptos y ciclo completo de CxP: causación (`POST /api/v1/cxp/causar`), cartera de proveedores (`GET /api/v1/cxp/cartera/:empresa_id`), pago y comprobantes de egreso (`POST /api/v1/cxp/pagar`, `GET /api/v1/cxp/:id/pagos`). 21 pruebas unitarias y 17 pruebas E2E pasando al 100%. Build exitoso. | **HITO ALCANZADO: SPRINT 2 COMPLETADO EXITOSAMENTE.** Fusionado a `develop` y `main`, tag `v0.2.0-sprint2`. |
| **3** | 17/10/2026 | 2h+ | **Sprint 3 (Tarea 3.1)** | Rama `sprint/03-integracion-webhooks`. Entidades `cont_cuentas_por_cobrar` y `cont_borradores_integracion`. Endpoint `POST /api/v1/integracion/facturas-venta` con idempotencia estricta, liquidación automática de IVA y soporte dual: contabilización `INMEDIATA` y `REVISION_PREVIA` con bandeja de aprobación. 26 pruebas unitarias y 19 pruebas E2E pasando al 100%. Build exitoso. | Tarea 3.1 completada con éxito. Listo para abordar Tarea 3.2 (Ingesta de Recaudos / Cobros). |

---

## 🔮 Backlog de Sprints Futuros

### Sprint 3: Interfaz de Integración Externa (API-First / Webhooks)
- Endpoints de ingesta: `POST /api/v1/integracion/facturas-venta`, `POST /api/v1/integracion/recaudos`.
- Mecanismo de Idempotencia (`origen_sistema` + `origen_documento_id`).
- Lógica del parámetro: `INMEDIATA` vs `REVISION_PREVIA`.
- Webhook de notificación al sistema emisor cuando el comprobante es aprobado.

### Sprint 4: Frontend Web Autónomo (Angular)
- Scaffolding de `pacyolo-web`.
- Selector de empresa / tenant en la barra superior.
- Vistas del Explorador del PUC y el Libro Diario.
- Bandeja de revisión de borradores de integración.

### Sprint 5: Reportes NIIF & Certificaciones
- Balance de Comprobación, Situación Financiera y Estado de Resultados.
- Generador de comprobantes y certificados de retención en PDF.
- Exportación a Excel.
