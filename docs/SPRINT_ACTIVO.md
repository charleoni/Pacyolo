# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: 2 horas diarias base)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/02-retenciones-cxp`  
*Última Versión Publicada:* `v0.1.0-sprint1` (Fusionado en `develop` y `main`)

---

## 🎯 SPRINT 2: Motor de Retenciones, Mapeo & Cuentas por Pagar (CxP)
- **Objetivo del Sprint:** Dotar a PACYOLO de la inteligencia tributaria colombiana (Retefuente, ReteICA, ReteIVA, IVA) y del flujo completo de compras y pasivos: causación de facturas de proveedores con retenciones automáticas, generación del asiento contable de pasivo y posterior pago con comprobante de egreso (`EGR`).
- **Entregables Evaluativos para el Usuario:**
  - Configuración de reglas tributarias con bases mínimas y cuentas contables NIIF (2365, 2367, 2368, 2408).
  - Endpoint de causación de compras/servicios donde el usuario sólo envía subtotal y concepto, y el sistema calcula y asienta automáticamente las retenciones y la cuenta por pagar.
  - Endpoint de consulta de cartera de proveedores (CxP) por vencer y vencidas.
  - Endpoint de pago total o parcial generando el comprobante de egreso (`EGR`) y cruzando saldos.
  - Suite de pruebas unitarias y E2E que demuestren que los cálculos tributarios cuadran al centavo.

---

### 📋 Desglose de Micro-Tareas Sprint 2 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :-: | :-: | :-: |
| **2.1** | Reglas de Impuestos | Entidad `cont_impuestos_reglas`, DTOs y CRUD para configurar retenciones (Retefuente compras/servicios/honorarios, ReteICA, ReteIVA, IVA) con bases mínimas y cuentas contables asociadas. | 2h | `[ ]` Pendiente | - |
| **2.2** | Motor Tributario | Servicio de cálculo `ImpuestosService`: evalúa base gravable vs base mínima, calcula tarifas y devuelve el desglose de líneas de débito/crédito con cuentas NIIF. | 2h | `[ ]` Pendiente | - |
| **2.3** | Mapeo de Conceptos | Entidad y servicio de plantillas (`cont_plantillas_mapeo`) para traducir conceptos ("COMPRA_MERCANCIA", "HONORARIOS", "MANTENIMIENTO") a cuentas de gasto/costo y pasivo. | 2h | `[ ]` Pendiente | - |
| **2.4** | Módulo de CxP | Entidad `cont_cuentas_por_pagar`, DTOs y servicio de causación: genera la factura de compra, calcula retenciones y crea el asiento contable balanceado. | 2h | `[ ]` Pendiente | - |
| **2.5** | Pago y Egreso (EGR) | Servicio y endpoints para pagar facturas de proveedores: creación del comprobante de egreso (`EGR`), cruce de saldo en CxP y abono a banco/caja. | 2h | `[ ]` Pendiente | - |
| **2.6** | Pruebas & Documentación | Pruebas automatizadas (unitarias + E2E) con casos reales de la DIAN + actualización de Swagger y colección de Postman/Thunder Client. | 2h | `[ ]` Pendiente | - |

---

## 📜 Historial de Sprints Cerrados

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
| **2** | 17/10/2026 | En curso | **Cierre Sprint 1 & Setup Sprint 2** | Aprobación del usuario recibida. Merge de `sprint/01-core-ledger` a `develop` y `main`. Etiquetado del release oficial `v0.1.0-sprint1` y sincronización con GitHub. Creación de la rama `sprint/02-retenciones-cxp`. Planificación detallada del Sprint 2. | Todo listo para arrancar la Tarea 2.1. |

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
