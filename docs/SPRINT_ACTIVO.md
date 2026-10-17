# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: 2 horas diarias base)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.

---

## 🎯 SPRINT 1: Cimientos del Core Ledger NIIF & Primer Comprobante
- **Objetivo del Sprint:** Disponer de la API base de PACYOLO (`pacyolo-backend`), la base de datos PostgreSQL conectada, el catálogo PUC NIIF sembrado, y el motor de partida doble capaz de registrar y consultar comprobantes contables con validación estricta de cuadre.
- **Entregable Evaluativo para el Usuario:**
  - Acceso a Swagger UI (`http://localhost:3000/api/docs`).
  - Capacidad de crear una empresa (tenant), consultar el árbol del PUC sembrado y registrar un comprobante contable cuadrado.
  - Validación de que si un comprobante está descuadrado por \$1 peso, la API lo rechaza con código `400 Bad Request`.
  - Suite de pruebas automatizadas ejecutables con `npm test`.

---

### 📋 Desglose de Micro-Tareas (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :-: | :-: | :-: |
| **1.1** | Setup Entorno | Inicializar estructura de carpetas en `C:\proyectos\PACYOLO` (`pacyolo-backend`, `pacyolo-bd`), setup de Git (`.gitignore`) y configuración de conexión PostgreSQL / Docker. | 2h | `[x]` Completado | 17/10/2026 |
| **1.2** | Scaffolding API | Inicializar proyecto NestJS limpio con TypeORM, ConfigModule, validadores globales (`class-validator`) y Swagger UI configurado en `/api/docs`. | 2h | `[x]` Completado | 17/10/2026 |
| **1.3** | Modelo Base (Tenants & Terceros) | Migrar y purificar desde Conjuntos: `EmpresaEntity` (Tenant/NIT con parámetro `modo_contabilizacion`) y `TerceroEntity` (Directorio único con validación de documento/RUT). | 2h | `[x]` Completado | 17/10/2026 |
| **1.4** | Catálogo PUC NIIF | Migrar `PucEntity` (jerarquía de 5 niveles, banderas `exige_tercero`, `exige_centro_costo`) + Seeder de cuentas estándar NIIF Colombia adaptado. | 2h | `[x]` Completado | 17/10/2026 |
| **1.5** | Entidades de Asientos | Migrar y purificar `AsientoEntity` (Cabecera, tipos `ING`, `EGR`, `DIA`, consecutivos, metadatos de integración) y `AsientoLineaEntity` (Débito/Crédito). | 2h | `[x]` Completado | 17/10/2026 |
| **1.6** | Motor de Partida Doble | Implementar `JournalService` con la regla inviolable `SUM(Débitos) == SUM(Créditos)`, secuenciador transaccional por tipo de comprobante y prevención de descuadres. | 2h | `[x]` Completado | 17/10/2026 |
| **1.7** | Endpoints de Comprobantes | Crear `POST /api/v1/asientos` y `GET /api/v1/asientos` con filtros por fecha, tipo y empresa, documentados en Swagger con ejemplos interactivos. | 2h | `[x]` Completado | 17/10/2026 |
| **1.8** | Pruebas Automatizadas & Demo | Construir suite de tests unitarios/E2E en Jest (casos felices y casos de rechazo por descuadre) + Colección de Postman / Thunder Client lista para evaluación del usuario. | 2h | `[x]` Completado | 17/10/2026 |

*Total Sprint 1: 100% COMPLETADO (8 de 8 tareas).*

---

## 📝 Bitácora Diaria de Avance (Daily Log)
*Se irá completando al final de cada jornada de trabajo.*

| Sesión # | Fecha | Horas Dedicadas | Tareas Abordadas | Logros del Día | Bloqueos / Notas |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | 17/10/2026 | 2h+ | **Sprint 1 Completo (1.1 a 1.8)** | Cimientos del Core Ledger NIIF completados al 100%. Repositorio Git enlazado a GitHub, base de datos `pacyolo_dev` conectada en PostgreSQL con 5 tablas creadas (`core_empresas`, `core_terceros`, `cont_puc_cuentas`, `cont_asientos`, `cont_asiento_lineas`). Motor de partida doble con consecutivos automáticos, endpoints documentados en Swagger y suites de tests unitarios y E2E pasando con 100% de éxito. Colección Postman generada. | **HITO ALCANZADO: SPRINT 1 COMPLETADO EXITOSAMENTE.** |

---

## 🔍 Criterios de Evaluación para el Usuario (Definition of Done)
Al finalizar las tareas del Sprint 1, el usuario realizará la siguiente prueba interactiva guiada:

1. [x] **Verificación de Base de Datos:** Comprobado que en PostgreSQL existen las 5 tablas maestras (`core_empresas`, `core_terceros`, `cont_puc_cuentas`, `cont_asientos`, `cont_asiento_lineas`).
2. [x] **Verificación en Swagger:** Disponible en `http://localhost:3000/api/docs` con esquemas y ejemplos interactivos.
3. [x] **Test Caso Exitoso:** Probado en E2E que registra un asiento cuadrado con consecutivo automático `DIA-000001` y código `201 Created`.
4. [x] **Test Caso Fallido (Integridad):** Probado en E2E y unitario que rechaza con `400 Bad Request` cualquier intento de descuadre o uso de cuentas no auxiliares.
5. [x] **Test Automatizado:** Suite unitaria y E2E ejecutadas al 100% en verde (`npm test` y `npm run test:e2e`).
6. [ ] **Aprobación Final del Usuario:** Dar el visto bueno para fusionar a `main` y etiquetar como `v0.1.0-sprint1`.

---

## 🔮 Backlog de Sprints Futuros

### Sprint 2: Motor de Retenciones, Mapeo & Cuentas por Pagar (CxP)
- Mapeo automático de eventos contables (`cont_plantillas_mapeo`).
- Motor de cálculo dinámico de Retefuente, ReteICA e IVA.
- Módulo de CxP: causación de compras y facturas de proveedores.
- Generación de comprobantes de egreso con retenciones aplicadas.

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
