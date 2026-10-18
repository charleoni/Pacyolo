# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: 2 horas diarias base)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/05-frontend-web`  
*Última Versión Publicada:* `v0.4.0-sprint4` (Fusionado en `develop` y `main`)

---

## 🎯 SPRINT 5: Frontend Web Autónomo (Angular Standalone)
- **Objetivo del Sprint:** Construir la interfaz de usuario web moderna, reactiva y desacoplada para PACYOLO en Angular 18/19 Standalone, conectada al backend REST/JWT: autenticación, selección de tenant activo, visualizador del PUC, Libro Diario, bandeja de revisión de borradores y gestión de usuarios/roles.
- **Entregables Evaluativos para el Usuario:**
  - Scaffolding de `pacyolo-web` con arquitectura por features y Tailwind/DaisyUI o Angular Material.
  - Módulo de Autenticación: Pantalla de Login, interceptor HTTP para Bearer JWT y guard de rutas.
  - Contexto de Empresa: Selector desplegable persistente de empresa activa (inyectando `x-empresa-id` en cada petición).
  - Explorador del PUC: Visualizador jerárquico del Plan Único de Cuentas NIIF.
  - Libro Diario de Asientos: Consulta de comprobantes contables con detalle de débitos y créditos.
  - Bandeja de Revisión de Integración: Aprobación y rechazo justificado de facturas y recaudos en borrador.
  - Gestión de Usuarios y Roles: Pantalla para invitar colaboradores, asignar roles y gestionar acceso.

---

### 📋 Desglose de Micro-Tareas Sprint 5 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **5.1** | Scaffolding & Core Architecture | Inicialización de `pacyolo-web` (Angular Standalone, Routing, Signals), configuración de TailwindCSS/componentes base y estructura modular. | 2h | `[ ]` Pendiente | - |
| **5.2** | Auth & Multi-tenant State | Pantalla de Login, `AuthService`, HTTP Interceptor para JWT y cabecera `x-empresa-id`, selector de empresa activa en Navbar. | 2h | `[ ]` Pendiente | - |
| **5.3** | Visualizador PUC & Libro Diario | Vistas de consulta del árbol de cuentas NIIF y consulta del Libro Diario de comprobantes contables con filtrado. | 2h | `[ ]` Pendiente | - |
| **5.4** | Bandeja de Borradores de Integración | Interfaz para visualizar facturas y recaudos externos en borrador con modal de aprobación y rechazo justificado. | 2h | `[ ]` Pendiente | - |
| **5.5** | Gestión de Usuarios & Roles (RBAC) | Vista administrativa para listar miembros del tenant, invitar colaboradores con rol y modificar roles/permisos. | 2h | `[ ]` Pendiente | - |

---

## 📜 Historial de Sprints Cerrados

### ✅ SPRINT 4: Autenticación, Usuarios y Control de Acceso RBAC (COMPLETADO 100%)
- **Versión de Cierre:** `v0.4.0-sprint4` (17/10/2026).
- **Logros:**
  - Modelo de usuarios `core_usuarios` y membresías multi-tenant `core_usuarios_empresas` con roles (`SUPER_ADMIN`, `ADMIN_EMPRESA`, `CONTADOR_LIDER`, `AUXILIAR_CONTABLE`, `AUDITOR_CONSULTA`).
  - Hashing seguro de contraseñas con `bcrypt` (salt 10) y emisión de JWT con contexto de tenant y rol.
  - Endpoints de autenticación `POST /api/v1/auth/login` y `GET /api/v1/auth/perfil`.
  - CRUD de administración de usuarios de tenant (`POST/GET/PATCH/DELETE /api/v1/usuarios`).
  - Guards de autorización `@Roles()` y `RolesGuard` verificando permisos por empresa y bloqueando accesos no autorizados con 401 y 403.
  - 46 pruebas unitarias y 33 pruebas E2E pasando al 100% en PostgreSQL. Build exitoso.

### ✅ SPRINT 3: Interfaz de Integración Externa (API-First / Webhooks) (COMPLETADO 100%)
- **Versión de Cierre:** `v0.3.0-sprint3` (17/10/2026).
- **Logros:**
  - Ingesta de Facturas de Venta (`POST /api/v1/integracion/facturas-venta`) con cálculo automático de CxC e IVA generado.
  - Ingesta de Recaudos / Cobros (`POST /api/v1/integracion/recaudos`) con cruce de saldos de clientes y emisión de comprobante `ING`.
  - Soporte de modo dual: `INMEDIATA` vs `REVISION_PREVIA`.
  - Bandeja de borradores con filtros avanzados por tipo, origen y fechas, con aprobación dual y rechazo justificado.
  - Motor de Webhooks (`core_webhooks`) con firma HMAC-SHA256 (`X-Pacyolo-Signature`) y despacho asíncrono.
  - 31 pruebas unitarias y 25 pruebas E2E pasando al 100%.

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
| **3** | 17/10/2026 | 2h+ | **Sprint 3 Completo (3.1 a 3.5)** | Rama `sprint/03-integracion-webhooks`. Entidades `cont_cuentas_por_cobrar`, `cont_recaudos_cxc`, `cont_borradores_integracion`, `core_webhooks` y `core_webhook_logs`. Endpoints de ingesta `POST /api/v1/integracion/facturas-venta` y `POST /api/v1/integracion/recaudos` con idempotencia estricta, liquidación automática de IVA y soporte dual (`INMEDIATA` vs `REVISION_PREVIA`). Bandeja de borradores con filtros avanzados por tipo, origen y rango de fechas. Aprobación de facturas y recaudos con emisión de comprobantes contables oficiales (`CAU` e `ING`), y rechazo con justificación documentada de auditoría. Motor de Webhooks con suscripciones, despacho asíncrono y firma criptográfica HMAC-SHA256 (`X-Pacyolo-Signature`). 31 pruebas unitarias y 25 pruebas E2E pasando al 100%. Build exitoso. | **HITO ALCANZADO: SPRINT 3 COMPLETADO EXITOSAMENTE.** Fusionado a `develop` y `main`, tag `v0.3.0-sprint3`. |
| **4** | 17/10/2026 | 2h+ | **Sprint 4 Completo (4.1 a 4.5)** | Rama `sprint/04-auth-rbac-seguridad`. Entidades `core_usuarios` y `core_usuarios_empresas` para relación multi-tenant N:M con rol específico por empresa (`SUPER_ADMIN`, `ADMIN_EMPRESA`, `CONTADOR_LIDER`, `AUXILIAR_CONTABLE`, `AUDITOR_CONSULTA`). Hash de contraseñas con bcrypt y generación de tokens JWT con payload contextual de empresas y roles. Endpoints `POST /api/v1/auth/login`, `GET /api/v1/auth/perfil`, administración completa de equipo de trabajo (`POST/GET/PATCH/DELETE /api/v1/usuarios`). Guards y decoradores `@Roles()` y `RolesGuard` aplicados a opciones sensibles (anulación contable protegida contra roles no autorizados). Suite con 46 pruebas unitarias y 33 pruebas E2E pasando al 100%. Compilación TypeScript limpia. | **HITO ALCANZADO: SPRINT 4 COMPLETADO EXITOSAMENTE.** |

---

## 🔮 Backlog de Sprints Futuros

### Sprint 5: Frontend Web Autónomo (Angular)
- Scaffolding de `pacyolo-web` con Angular Standalone.
- Módulo de Login y Selector de Empresa activa persistente.
- Vistas del Explorador del PUC y el Libro Diario.
- Pantalla de Gestión de Usuarios y Roles de la Empresa.
- Bandeja de revisión de borradores de integración.

### Sprint 6: Reportes NIIF & Certificaciones
- Balance de Comprobación, Situación Financiera y Estado de Resultados.
- Generador de comprobantes y certificados de retención en PDF.
- Exportación a Excel.
