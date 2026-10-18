# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: Bloques de ~2 Horas)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Arquitectura Maestra:* `C:\proyectos\PACYOLO\docs\ARQUITECTURA_ERP_PACYOLO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/06-operacion-contable-web`  
*Última Versión Publicada:* `v0.5.0-sprint5` (Fusionado en `develop` y `main`)

---

## 🎯 SPRINT 6: Operación Contable Manual en Web (Digitación & Documentos NIIF)
- **Objetivo del Sprint:** Dotar al Frontend Web (`pacyolo-web`) y Backend de las capacidades de captura manual para que el contador o auxiliar pueda sentarse a crear documentos contables reales directamente en el navegador con balanceo de partida doble en vivo, causación de compras con retenciones de Colombia, emisión de pagos/egresos y directorio de terceros.
- **Entregables Evaluativos para el Usuario:**
  - **Formulario de Comprobante Contable / Asiento de Diario:** Creación interactiva de asientos con rejilla dinámica de líneas (cuenta PUC, tercero, glosa, débito, crédito), cálculo de sumas iguales en tiempo real con indicador verde/rojo y bloqueo de guardado si hay descuadre.
  - **Formulario de Causación de Compras & Gastos (CxP):** Selección de proveedor, concepto comercial o cuenta de gasto, cálculo automático de Retefuente, ReteICA e IVA y registro de comprobante `CAU`.
  - **Formulario de Comprobante de Egreso / Pago (`EGR`):** Selección de factura de proveedor pendiente por pagar, afectación a Caja o Banco y cancelación de saldo.
  - **Gestión de Terceros en Web:** Directorio de clientes y proveedores con validación automática de Dígito de Verificación (DIAN Módulo 11).
  - **Suite de Pruebas Automatizadas:** Tests unitarios y E2E que certifiquen el flujo completo de digitación, causación y pago desde la web hacia el Core Ledger.

---

### 📋 Desglose de Micro-Tareas Sprint 6 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **6.1** | Formulario de Partida Doble | Componente Angular interactivo para nuevo asiento contable con selector de cuenta auxiliar del PUC, tercero, suma dinámica de débitos/créditos y envío a `POST /api/v1/asientos`. | 2h | `[ ]` Pendiente | - |
| **6.2** | Formulario de Causación de Compras | Interfaz web para causar compras a proveedores: cálculo en vivo de bases mínimas, retenciones (Retefuente, ReteICA) e IVA descontable con envío a `POST /api/v1/cxp/causar`. | 2h | `[ ]` Pendiente | - |
| **6.3** | Emisión de Comprobantes de Egreso | Modal / Pantalla para registrar pagos de facturas de proveedores: selección de cuenta de tesorería (Caja/Bancos), cancelación de cartera y generación de comprobante `EGR`. | 2h | `[ ]` Pendiente | - |
| **6.4** | Directorio Web de Terceros | Pantalla para crear y consultar clientes/proveedores con cálculo y validación de Dígito de Verificación (DV) DIAN Modulo 11. | 2h | `[ ]` Pendiente | - |
| **6.5** | Pruebas & Certificación Sprint 6 | Pruebas unitarias de componentes web, pruebas E2E de validación de comprobantes manuales, build limpio de front y back y release tag `v0.6.0-sprint6`. | 2h | `[ ]` Pendiente | - |

---

## 🔮 Backlog Estratégico de Sprints Futuros (Arquitectura ERP PACYOLO)

### 📌 SPRINT 7: Facturación Comercial Propia, Mostrador / POS & Cartera (CxC)
- **Facturación POS / Mostrador:** Tiras de caja rápidas para mostrador, restaurante, peluquería, carnicería o ferretería con propinas voluntarias e impuesto al consumo (INC 8%).
- **Facturación de Venta Estándar:** Emisión de facturas a crédito o al contado con IVA (0%, 5%, 19%) y retenciones practicadas por clientes.
- **Recaudos (`ING`):** Recibos de caja manuales para abonos y cancelaciones de cartera de clientes.
- **Reporte de Cartera CxC:** Antigüedad de saldos (corriente, 30, 60, 90+ días).

### 📌 SPRINT 8: Catálogo de Ítems, Inventarios & Kardex Paramétrico (NIC 2)
- **Catálogo Universal:** Soporte de `SERVICIO` (peluquería, consultoría), `PRODUCTO_SIMPLE` (papelería), `PRODUCTO_FRACCIONABLE` (carnicería/ferretería), `MATERIA_PRIMA` y `PRODUCTO_TERMINADO` (panaderías) y `SERIALIZADOS` (maquinaria/motos).
- **Unidades de Medida & Conversión:** Bultos a kilos, rollos a metros, cajas a unidades.
- **Kardex Valorado:** Entradas, salidas, mermas, traslados entre bodegas y valuación Promedio Ponderado.
- **Costeo Automático de Ventas:** Generación automática del asiento `Débito 61 (Costo) <-> Crédito 14 (Inventario)`.

### 📌 SPRINT 9: Tesorería, Cajas Menores & Conciliación Bancaria
- **Cajas Menores:** Fondo fijo, legalización de gastos menores con comprobantes y arqueos de caja periódicos.
- **Cuentas Bancarias:** Control de saldos en cuentas corrientes y de ahorros.
- **Motor de Conciliación Bancaria:** Importación de extractos bancarios oficiales (Excel/CSV de Bancolombia, Davivienda, etc.), cruce automático contra el libro auxiliar y causación automática de notas débito (4x1000 GMF, cuotas y comisiones).
- **Informe de Conciliación:** Resumen formal para revisoría fiscal y auditoría.

### 📌 SPRINT 10: Reportes Financieros Oficiales NIIF & Exportaciones
- **Balance de Comprobación:** Sumas y saldos a nivel de Clase, Grupo, Cuenta, Subcuenta y Auxiliar.
- **Estado de Situación Financiera (Balance General NIIF):** Activo = Pasivo + Patrimonio (Corriente / No Corriente).
- **Estado de Resultados Integral (P&G):** Ingresos, Costos, Utilidad Bruta, Gastos Operacionales, EBITDA y Utilidad Neta.
- **Certificados Tributarios:** Generación en PDF oficial de Certificados de Retención en la Fuente con firma digital.
- **Exportación a Excel:** Reportes tabulados con fórmulas y estructura para Medios Magnéticos DIAN.

### 📌 SPRINT 11: Activos Fijos & Propiedad, Planta y Equipo (NIC 16)
- **Ficha Técnica de Activos:** Códigos de placa, ubicación física, centro de costos y vida útil NIIF.
- **Motor de Depreciación Mensual Automática:** Asiento de fin de mes `Débito 5160 / 5260 <-> Crédito 1592`.
- **Deterioro y Bajas:** Retiro por obsolescencia y cálculo de utilidad/pérdida en venta de activos fijos.

### 📌 SPRINT 12: Nómina Electrónica & Seguridad Social (UGPP / DIAN)
- **Contratos Laborales & Devengos:** Sueldo básico, auxilio de transporte, horas extras diurnas/nocturnas/festivas y recargos.
- **Deducciones de Ley:** Salud (4%), Pensión (4%), Fondo de Solidaridad Pensional, retención en la fuente laboral.
- **Aportes Patronales & Provisiones:** EPS patronal, Pensión (12%), ARL, Parafiscales (SENA, ICBF, Caja) y provisión de Cesantías, Intereses, Prima y Vacaciones.
- **Contabilización Automática & Transmisión DIAN:** Asiento contable de nómina y generación del XML / CUNE para la DIAN.

---

## 📜 Historial de Sprints Cerrados

### ✅ SPRINT 5: Frontend Web Autónomo (Angular Standalone) (COMPLETADO 100%)
- **Versión de Cierre:** `v0.5.0-sprint5` (17/10/2026).
- **Logros:**
  - Scaffolding de `pacyolo-web` con Angular Standalone, Signals reactivos y TailwindCSS v3.
  - Capa de autenticación con `AuthService`, persistencia de sesión y `authGuard`.
  - `authInterceptor` para inyección de token Bearer y cabecera multi-tenant `x-empresa-id`.
  - Layout con selector persistente de empresa activa en tiempo real.
  - Vistas de consulta de PUC, Libro Diario de Asientos, Bandeja de Borradores de Integración y Administración de Usuarios/Roles RBAC.
  - Compilación limpia con `ng build` y pruebas con Vitest.

### ✅ SPRINT 4: Autenticación, Usuarios y Control de Acceso RBAC (COMPLETADO 100%)
- **Versión de Cierre:** `v0.4.0-sprint4` (17/10/2026).
- **Logros:**
  - Modelo de usuarios `core_usuarios` y membresías multi-tenant `core_usuarios_empresas` con roles (`SUPER_ADMIN`, `ADMIN_EMPRESA`, `CONTADOR_LIDER`, `AUXILIAR_CONTABLE`, `AUDITOR_CONSULTA`).
  - Hashing seguro con `bcrypt` (salt 10) y tokens JWT con contexto multi-tenant.
  - Endpoints `POST /api/v1/auth/login`, `GET /api/v1/auth/perfil` y CRUD de usuarios de empresa.
  - Guards `@Roles()` y `RolesGuard` verificando permisos por tenant y rechazando 401/403.
  - 46 pruebas unitarias y 33 pruebas E2E pasando al 100%.

### ✅ SPRINT 3: Interfaz de Integración Externa (API-First / Webhooks) (COMPLETADO 100%)
- **Versión de Cierre:** `v0.3.0-sprint3` (17/10/2026).
- **Logros:**
  - Ingesta de Facturas de Venta (`POST /api/v1/integracion/facturas-venta`) y Recaudos (`POST /api/v1/integracion/recaudos`) con idempotencia estricta.
  - Soporte dual: modo `INMEDIATA` vs `REVISION_PREVIA`.
  - Bandeja de borradores con aprobación y rechazo justificado de auditoría.
  - Motor de Webhooks (`core_webhooks`) con firma HMAC-SHA256 (`X-Pacyolo-Signature`).
  - 31 pruebas unitarias y 25 pruebas E2E pasando al 100%.

### ✅ SPRINT 2: Motor de Retenciones, Mapeo & Cuentas por Pagar (COMPLETADO 100%)
- **Versión de Cierre:** `v0.2.0-sprint2` (17/10/2026).
- **Logros:**
  - Motor de reglas tributarias (`cont_impuestos_reglas`) para Colombia (Retefuente, ReteICA, ReteIVA, IVA).
  - Módulo de CxP: causación de compras con retenciones automáticas (`CAU`), cartera ejecutiva y comprobantes de egreso (`EGR`).
  - 21 pruebas unitarias y 17 pruebas E2E pasando al 100%.

### ✅ SPRINT 1: Cimientos del Core Ledger NIIF & Primer Comprobante (COMPLETADO 100%)
- **Versión de Cierre:** `v0.1.0-sprint1` (17/10/2026).
- **Logros:**
  - PostgreSQL `pacyolo_dev` con esquemas `core` y `contabilidad`.
  - Módulos `Empresas` (DV Módulo 11), `Terceros` y `PUC` (árbol de 5 niveles).
  - Motor de partida doble con consecutivos automáticos y anulación por reversión NIIF.
  - 11 pruebas automatizadas pasando al 100%.

---

## 📝 Bitácora Diaria de Avance (Daily Log)

| Sesión # | Fecha | Horas Dedicadas | Tareas Abordadas | Logros del Día | Bloqueos / Notas |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **1** | 17/10/2026 | 2h+ | **Sprint 1 Completo (1.1 a 1.8)** | Cimientos del Core Ledger NIIF completados al 100%. Repositorio Git enlazado a GitHub, base de datos `pacyolo_dev` conectada en PostgreSQL con 5 tablas creadas (`core_empresas`, `core_terceros`, `cont_puc_cuentas`, `cont_asientos`, `cont_asiento_lineas`). Motor de partida doble con consecutivos automáticos, endpoints documentados en Swagger y suites de tests unitarios y E2E pasando con 100% de éxito. Colección Postman generada. | **HITO ALCANZADO: SPRINT 1 COMPLETADO EXITOSAMENTE.** |
| **2** | 17/10/2026 | 2h+ | **Sprint 2 Completo (2.1 a 2.6)** | Release `v0.1.0-sprint1` en GitHub. Rama `sprint/02-retenciones-cxp`. Implementado el motor tributario colombiano (Retefuente, ReteICA, IVA), mapeo de conceptos y ciclo completo de CxP: causación (`POST /api/v1/cxp/causar`), cartera de proveedores (`GET /api/v1/cxp/cartera/:empresa_id`), pago y comprobantes de egreso (`POST /api/v1/cxp/pagar`, `GET /api/v1/cxp/:id/pagos`). 21 pruebas unitarias y 17 pruebas E2E pasando al 100%. Build exitoso. | **HITO ALCANZADO: SPRINT 2 COMPLETADO EXITOSAMENTE.** Fusionado a `develop` y `main`, tag `v0.2.0-sprint2`. |
| **3** | 17/10/2026 | 2h+ | **Sprint 3 Completo (3.1 a 3.5)** | Rama `sprint/03-integracion-webhooks`. Entidades `cont_cuentas_por_cobrar`, `cont_recaudos_cxc`, `cont_borradores_integracion`, `core_webhooks` y `core_webhook_logs`. Endpoints de ingesta `POST /api/v1/integracion/facturas-venta` y `POST /api/v1/integracion/recaudos` con idempotencia estricta, liquidación automática de IVA y soporte dual (`INMEDIATA` vs `REVISION_PREVIA`). Bandeja de borradores con filtros avanzados por tipo, origen y rango de fechas. Aprobación de facturas y recaudos con emisión de comprobantes contables oficiales (`CAU` e `ING`), y rechazo con justificación documentada de auditoría. Motor de Webhooks con suscripciones, despacho asíncrono y firma criptográfica HMAC-SHA256 (`X-Pacyolo-Signature`). 31 pruebas unitarias y 25 pruebas E2E pasando al 100%. Build exitoso. | **HITO ALCANZADO: SPRINT 3 COMPLETADO EXITOSAMENTE.** Fusionado a `develop` y `main`, tag `v0.3.0-sprint3`. |
| **4** | 17/10/2026 | 2h+ | **Sprint 4 Completo (4.1 a 4.5)** | Rama `sprint/04-auth-rbac-seguridad`. Entidades `core_usuarios` y `core_usuarios_empresas` para relación multi-tenant N:M con rol específico por empresa (`SUPER_ADMIN`, `ADMIN_EMPRESA`, `CONTADOR_LIDER`, `AUXILIAR_CONTABLE`, `AUDITOR_CONSULTA`). Hash de contraseñas con bcrypt y generación de tokens JWT con payload contextual de empresas y roles. Endpoints `POST /api/v1/auth/login`, `GET /api/v1/auth/perfil`, administración completa de equipo de trabajo (`POST/GET/PATCH/DELETE /api/v1/usuarios`). Guards y decoradores `@Roles()` y `RolesGuard` aplicados a opciones sensibles (anulación contable protegida contra roles no autorizados). Suite con 46 pruebas unitarias y 33 pruebas E2E pasando al 100%. Compilación TypeScript limpia. | **HITO ALCANZADO: SPRINT 4 COMPLETADO EXITOSAMENTE.** |
| **5** | 17/10/2026 | 2h+ | **Sprint 5 Completo (5.1 a 5.5)** | Rama `sprint/05-frontend-web`. Scaffolding de `pacyolo-web` con Angular Standalone, Signals y TailwindCSS v3. Implementado servicio `AuthService` reactivo con login, logout, persistencia local y almacenamiento de tenant activo. `authInterceptor` funcional que adjunta automáticamente `Authorization: Bearer <JWT>` y cabecera multi-tenant `x-empresa-id`. `authGuard` para protección de rutas privadas. `DashboardLayoutComponent` con selector de empresa activa en tiempo real. Componente `PucExplorerComponent` con buscador interactivo y visualización de niveles/imputabilidad. `LibroDiarioComponent` con formato monetario de comprobantes. `BorradoresComponent` con bandeja de revisión, aprobación y rechazo justificado. `UsuariosAdminComponent` para gestión RBAC de equipo, cambio de roles y revocación de acceso. Build y tests unitarios de Angular pasando al 100%. | **HITO ALCANZADO: SPRINT 5 COMPLETADO EXITOSAMENTE.** |
