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
| **1.4** | Catálogo PUC NIIF | Migrar `PucEntity` (jerarquía de 5 niveles, banderas `exige_tercero`, `exige_centro_costo`) + Seeder de cuentas estándar NIIF Colombia adaptado. | 2h | `[ ]` Pendiente | -- |
| **1.5** | Entidades de Asientos | Migrar y purificar `AsientoEntity` (Cabecera, tipos `ING`, `EGR`, `DIA`, consecutivos, metadatos de integración) y `AsientoLineaEntity` (Débito/Crédito). | 2h | `[ ]` Pendiente | -- |
| **1.6** | Motor de Partida Doble | Implementar `JournalService` con la regla inviolable `SUM(Débitos) == SUM(Créditos)`, secuenciador transaccional por tipo de comprobante y prevención de descuadres. | 2h | `[ ]` Pendiente | -- |
| **1.7** | Endpoints de Comprobantes | Crear `POST /api/v1/asientos` y `GET /api/v1/asientos` con filtros por fecha, tipo y empresa, documentados en Swagger con ejemplos interactivos. | 2h | `[ ]` Pendiente | -- |
| **1.8** | Pruebas Automatizadas & Demo | Construir suite de tests unitarios/E2E en Jest (casos felices y casos de rechazo por descuadre) + Colección de Postman / Thunder Client lista para evaluación del usuario. | 2h | `[ ]` Pendiente | -- |

*Total Estimado Sprint 1: ~16 horas (8 sesiones de 2 horas).*

---

## 📝 Bitácora Diaria de Avance (Daily Log)
*Se irá completando al final de cada jornada de trabajo.*

| Sesión # | Fecha | Horas Dedicadas | Tareas Abordadas | Logros del Día | Bloqueos / Notas |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | 17/10/2026 | 2h+ | Tareas 1.1, 1.2 y 1.3 | Repositorio Git en GitHub, BD `pacyolo_dev` creada con esquemas `core` y `contabilidad`, NestJS creado con Swagger y TypeORM. Módulos y entidades de `Empresas` y `Terceros` creados con cálculo de DV DIAN (Módulo 11), sincronizados en PostgreSQL (`core.core_empresas` y `core.core_terceros`). | Conexión y tablas verificadas con éxito en PostgreSQL. |

---

## 🔍 Criterios de Evaluación para el Usuario (Definition of Done)
Al finalizar las tareas del Sprint 1, el usuario realizará la siguiente prueba interactiva guiada:

1. [ ] **Verificación de Base de Datos:** Comprobar que en PostgreSQL existen las tablas de empresas, terceros, cuentas PUC y asientos.
2. [ ] **Verificación en Swagger:** Abrir navegador en `http://localhost:3000/api/docs`.
3. [ ] **Test Caso Exitoso:** Registrar un asiento contable cuadrado (ej. Débito Banco \$500.000 / Crédito Caja \$500.000) y recibir respuesta `201 Created` con el número consecutivo generado (ej. `DIA-000001`).
4. [ ] **Test Caso Fallido (Integridad):** Intentar registrar un asiento descuadrado (Débito \$500.000 / Crédito \$499.000) y comprobar que el sistema lo rechaza impidiendo la corrupción de saldos.
5. [ ] **Test Automatizado:** Correr `npm test` y verificar que todas las pruebas pasen en verde.
6. [ ] **Aprobación del Sprint:** Dar el visto bueno para fusionar a `main` y etiquetar como `v0.1.0-sprint1`.

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
