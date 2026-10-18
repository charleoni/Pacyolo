# 📜 PACYOLO — Changelog Oficial de Versiones

Todas las versiones notables de este proyecto están documentadas en este archivo según los principios de [Semantic Versioning](https://semver.org/).

---

## [v0.6.0-sprint6] - 2026-10-17
### 🚀 Operación Contable Manual en Web & Módulo de Auditoría Inmutable
- **Auditoría Inmutable Transversal (`core_audit_logs`):**
  - Tabla de auditoría inmutable en esquema `core` para registrar de forma automática todas las operaciones HTTP (`POST`, `PUT`, `PATCH`, `DELETE`) en el ERP.
  - Interceptor global `AuditInterceptor` con captura de IP, user-agent, tenant, usuario autenticado, método, ruta y snapshots de datos anteriores y nuevos con ofuscación estricta de contraseñas y tokens.
  - Endpoints de consulta con filtrado avanzado por rango de fechas, usuario, módulo y acción (`GET /api/v1/auditoria`), resumen de actividad de 24h (`GET /api/v1/auditoria/resumen`) y detalle (`GET /api/v1/auditoria/:id`).
  - Visor de pistas de auditoría en Angular (`/dashboard/auditoria`) con tarjetas de métricas, filtrado dinámico y modal de inspección de JSON.
- **Formulario de Comprobante Contable / Asiento de Diario (Partida Doble):**
  - Componente modal `CrearAsientoModalComponent` con rejilla dinámica de apuntes (mínimo 2 líneas).
  - Selector de cuentas auxiliares imputables del PUC y terceros.
  - Balanza de comprobación en vivo: suma de débitos, suma de créditos y cálculo de descuadre en tiempo real. Bloqueo estricto del botón de guardado ante descuadres.
  - Visualización expandible de líneas contables por comprobante en el Libro Diario (`/dashboard/asientos`).
  - Anulación formal de comprobantes con exigencia de motivo documentado y generación automática de asiento de reversión NIIF.
- **Directorio Web de Terceros (`/dashboard/terceros`):**
  - Gestión integral de Clientes, Proveedores y Empleados.
  - Cálculo oficial en vivo del Dígito de Verificación (DV) DIAN según Algoritmo Módulo 11 (Estatuto Tributario colombiano).
  - Clasificación de régimen de IVA, gran contribuyente y autorretenedor.
- **Cuentas por Pagar & Egresos (`/dashboard/cxp`):**
  - Formulario de causación de compras a proveedores con liquidación de IVA descontable y retenciones en la fuente (`POST /api/v1/cxp/causar`).
  - Panel ejecutivo de cartera de proveedores (total adeudado, vencida vs por vencer).
  - Emisión de pagos y generación de comprobantes oficiales de egreso `EGR` afectando cuentas de caja/banco.
- **Pruebas Automatizadas:** 53 pruebas unitarias y 33 pruebas E2E pasando al 100%.

---

## [v0.5.0-sprint5] - 2026-10-17
### 🌐 Frontend Web Autónomo (Angular Standalone & Signals)
- Scaffolding de `pacyolo-web` con Angular Standalone y TailwindCSS v3.
- `AuthService` reactivo con Signals, manejo de sesiones y tenant activo.
- `authInterceptor` para inyección de token JWT y `x-empresa-id`.
- Vistas de Resumen, Explorador de PUC, Libro Diario, Bandeja de Borradores y Administración de Usuarios/Roles RBAC.

---

## [v0.4.0-sprint4] - 2026-10-17
### 🔐 Autenticación, Usuarios y Control de Acceso RBAC Multi-Tenant
- Entidades `core_usuarios` y `core_usuarios_empresas` con roles (`SUPER_ADMIN`, `ADMIN_EMPRESA`, `CONTADOR_LIDER`, `AUXILIAR_CONTABLE`, `AUDITOR_CONSULTA`).
- Cifrado seguro de contraseñas con bcrypt y emisión de tokens JWT.
- `@Roles()` y `RolesGuard` protegiendo endpoints sensibles.

---

## [v0.3.0-sprint3] - 2026-10-17
### 🔌 Interfaz de Integración Externa & Webhooks
- Ingesta de Facturas de Venta y Recaudos externos con soporte dual (`INMEDIATA` vs `REVISION_PREVIA`).
- Bandeja de borradores con aprobación y rechazo justificado.
- Motor de Webhooks con firma HMAC-SHA256 (`X-Pacyolo-Signature`).

---

## [v0.2.0-sprint2] - 2026-10-17
### ⚖️ Motor Tributario, Mapeo & Cuentas por Pagar (CxP)
- Motor de reglas tributarias (Retefuente, ReteICA, ReteIVA, IVA).
- Causación de compras (`CAU`), cartera de proveedores y egresos (`EGR`).

---

## [v0.1.0-sprint1] - 2026-10-17
### 🏛️ Cimientos del Core Ledger NIIF Universal
- Base de datos multi-tenant en PostgreSQL (`core` y `contabilidad`).
- Módulos de Empresas (DV Módulo 11), Terceros y PUC Colombia.
- Motor de partida doble con consecutivos automáticos y reversión contable.
