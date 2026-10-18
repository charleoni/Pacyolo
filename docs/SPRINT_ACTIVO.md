# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: Bloques de ~2 Horas)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Arquitectura Maestra:* `C:\proyectos\PACYOLO\docs\ARQUITECTURA_ERP_PACYOLO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/07-tablas-maestras-dinamicas`  
*Última Versión Publicada:* `v0.6.0-sprint6` (Fusionado en `develop` y `main`)

---

## 🎯 SPRINT 7: Motor Universal de Tablas Maestras & Parametrización Dinámica (Cero Enums)
- **Objetivo del Sprint:** Erradicar todo hardcoding / enums en los formularios del ERP. Construir el módulo relacional de **Tablas Maestras Paramétricas** donde cada dato seleccionable (Tipos de Identificación, Tipos de Persona, Regímenes Fiscales / IVA, Clasificaciones de Terceros, Tipos de Comprobantes Contables y Métodos de Pago) tenga su propio ciclo de vida (CRUD completo, activación/desactivación, impresión, validación de integridad referencial y auditoría) tanto a nivel de semillas globales como personalizable por tenant.
- **Entregables Evaluativos para el Usuario:**
  - **Módulo Backend de Maestras Paramétricas:** Entidades en PostgreSQL con CRUD completo:
    - `core_tipos_identificacion`: Código, nombre, código DIAN, bandera de si aplica o no Dígito de Verificación.
    - `core_tipos_persona`: Código, nombre, exige o no razón social.
    - `core_regimenes_fiscales`: Código, nombre, responsabilidad fiscal DIAN, régimen de IVA.
    - `core_clasificaciones_tercero`: Roles comerciales (Cliente, Proveedor, Empleado, etc.).
    - `cont_tipos_comprobante`: Prefijo, nombre, consecutivo oficial y naturaleza.
    - `core_metodos_pago`: Medios de pago con código DIAN.
  - **Panel Web de Administración y Configuración (`/dashboard/configuracion/maestras`):** Interfaz para consultar, crear, editar, activar/inactivar e imprimir/exportar cada tabla maestra.
  - **Formularios Dinámicos con Creación Rápida:** Refactorización del formulario de Terceros, Asientos y CxP para consumir las tablas maestras con botón `[+ Nuevo]` modal inline.
  - **Suite de Pruebas Automatizadas:** Pruebas unitarias y E2E que certifiquen el CRUD y la integridad referencial.

---

### 📋 Desglose de Micro-Tareas Sprint 7 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **7.1** | Modelo Relacional de Maestras (Backend) | Creación de entidades TypeORM para tipos de identificación, persona, regímenes, clasificaciones, tipos de comprobante y métodos de pago con soporte multi-tenant y semillas oficiales Colombia. | 2h | `[ ]` Pendiente | - |
| **7.2** | Endpoints CRUD & Reglas de Integridad | Controladores y servicios REST (`GET`, `POST`, `PUT`, `DELETE` lógico/inactivar) con protección contra borrado si el registro está en uso por terceros o asientos. | 2h | `[ ]` Pendiente | - |
| **7.3** | Panel Web de Tablas Maestras | Vista en Angular (`/dashboard/configuracion/maestras`) con pestañas para administrar cada catálogo, buscador, estados activo/inactivo e impresión/exportación. | 2h | `[ ]` Pendiente | - |
| **7.4** | Refactorización Dinámica de Formularios | Conexión de los selectores de Terceros, Asientos y CxP hacia las APIs de tablas maestras con modal de creación rápida inline `[+ Nuevo Tipo]`. | 2h | `[ ]` Pendiente | - |
| **7.5** | Pruebas, Certificación & Release | Tests unitarios, pruebas E2E en PostgreSQL, build sin errores de backend/frontend y release tag `v0.7.0-sprint7`. | 2h | `[ ]` Pendiente | - |

---

## 🔮 Backlog Estratégico de Sprints Futuros (Arquitectura ERP PACYOLO)

### 📌 SPRINT 8: Facturación Comercial Propia, Mostrador / POS & Cartera (CxC)
- **Facturación POS / Mostrador:** Tiras de caja rápidas para mostrador, restaurante, peluquería, carnicería o ferretería con propinas voluntarias e impuesto al consumo (INC 8%).
- **Facturación de Venta Estándar:** Emisión de facturas a crédito o al contado con IVA (0%, 5%, 19%) y retenciones practicadas por clientes.
- **Recaudos (`ING`):** Recibos de caja manuales para abonos y cancelaciones de cartera de clientes.
- **Reporte de Cartera CxC:** Antigüedad de saldos (corriente, 30, 60, 90+ días).

### 📌 SPRINT 9: Catálogo de Ítems, Inventarios & Kardex Paramétrico (NIC 2)
- **Catálogo Universal:** Soporte de `SERVICIO` (peluquería, consultoría), `PRODUCTO_SIMPLE` (papelería), `PRODUCTO_FRACCIONABLE` (carnicería/ferretería), `MATERIA_PRIMA` y `PRODUCTO_TERMINADO` (panaderías) y `SERIALIZADOS` (maquinaria/motos).
- **Unidades de Medida & Conversión:** Bultos a kilos, rollos a metros, cajas a unidades.
- **Kardex Valorado:** Entradas, salidas, mermas, traslados entre bodegas y valuación Promedio Ponderado.
- **Costeo Automático de Ventas:** Generación automática del asiento `Débito 61 (Costo) <-> Crédito 14 (Inventario)`.

### 📌 SPRINT 10: Tesorería, Cajas Menores & Conciliación Bancaria
- **Cajas Menores:** Fondo fijo, legalización de gastos menores con comprobantes y arqueos de caja periódicos.
- **Cuentas Bancarias:** Control de saldos en cuentas corrientes y de ahorros.
- **Motor de Conciliación Bancaria:** Importación de extractos bancarios oficiales (Excel/CSV de Bancolombia, Davivienda, etc.), cruce automático contra el libro auxiliar y causación automática de notas débito (4x1000 GMF, cuotas y comisiones).
- **Informe de Conciliación:** Resumen formal para revisoría fiscal y auditoría.

### 📌 SPRINT 11: Reportes Financieros Oficiales NIIF & Exportaciones
- **Balance de Comprobación:** Sumas y saldos a nivel de Clase, Grupo, Cuenta, Subcuenta y Auxiliar.
- **Estado de Situación Financiera (Balance General NIIF):** Activo = Pasivo + Patrimonio (Corriente / No Corriente).
- **Estado de Resultados Integral (P&G):** Ingresos, Costos, Utilidad Bruta, Gastos Operacionales, EBITDA y Utilidad Neta.
- **Certificados Tributarios:** Generación en PDF oficial de Certificados de Retención en la Fuente con firma digital.
- **Exportación a Excel:** Reportes tabulados con fórmulas y estructura para Medios Magnéticos DIAN.

### 📌 SPRINT 12: Activos Fijos & Propiedad, Planta y Equipo (NIC 16)
- **Ficha Técnica de Activos:** Códigos de placa, ubicación física, centro de costos y vida útil NIIF.
- **Motor de Depreciación Mensual Automática:** Asiento de fin de mes `Débito 5160 / 5260 <-> Crédito 1592`.
- **Deterioro y Bajas:** Retiro por obsolescencia y cálculo de utilidad/pérdida en venta de activos fijos.

### 📌 SPRINT 13: Nómina Electrónica & Seguridad Social (UGPP / DIAN)
- **Contratos Laborales & Devengos:** Sueldo básico, auxilio de transporte, horas extras diurnas/nocturnas/festivas y recargos.
- **Deducciones de Ley:** Salud (4%), Pensión (4%), Fondo de Solidaridad Pensional, retención en la fuente laboral.
- **Aportes Patronales & Provisiones:** EPS patronal, Pensión (12%), ARL, Parafiscales (SENA, ICBF, Caja) y provisión de Cesantías, Intereses, Prima y Vacaciones.
- **Contabilización Automática & Transmisión DIAN:** Asiento contable de nómina y generación del XML / CUNE para la DIAN.

---

## 📜 Historial de Sprints Cerrados

### ✅ SPRINT 6: Operación Contable Manual & Auditoría Inmutable (COMPLETADO 100%)
- **Versión de Cierre:** `v0.6.0-sprint6` (17/10/2026).
- **Logros:**
  - **Auditoría Inmutable Transversal:** Módulo `core_audit_logs` con `AuditInterceptor` global para registrar automáticamente operaciones, mutaciones HTTP, IPs, emails y snapshots JSON ofuscados (sin claves ni tokens). Visor en Angular en `/dashboard/auditoria`.
  - **Creación de Comprobantes Contables:** Modal interactivo de Partida Doble con rejilla dinámica de apuntes (cuentas auxiliares del PUC y terceros), balanceo de sumas iguales en tiempo real con indicador verde/rojo y bloqueo de guardado en descuadre.
  - **Libro Diario Potenciado:** Inspección de líneas contables por comprobante y anulación formal con reversión NIIF obligatoria.
  - **Directorio de Terceros:** Módulo web para crear y clasificar Clientes, Proveedores y Empleados con cálculo y validación de Dígito de Verificación (DV) DIAN Módulo 11 en tiempo real.
  - **Cuentas por Pagar (CxP):** Causación de compras a proveedores con liquidación de retenciones en la fuente e IVA, panel ejecutivo de cartera (vencida vs por vencer) y emisión de pagos con comprobantes oficiales de egreso `EGR`.
  - **Suite de Pruebas:** 53 pruebas unitarias y 33 pruebas E2E pasando al 100%, con builds limpios en frontend y backend.

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
| **6** | 17/10/2026 | 2h+ | **Sprint 6 Completo (6.0 a 6.5)** | Rama `sprint/06-operacion-contable-web`. Módulo Transversal de Auditoría Inmutable (`core_audit_logs`) con `AuditInterceptor` global para captura de mutaciones/IP/usuario y visor web en `/dashboard/auditoria`. Formulario interactivo de partida doble (`+ Nuevo Asiento Contable`) con balanceador de sumas iguales en tiempo real e inspección de líneas contables. Anulación formal de comprobantes con asiento de reversión NIIF. Directorio web de Terceros con cálculo oficial de Dígito de Verificación (DV) DIAN Módulo 11 en vivo. Módulo web de Compras & CxP: causación con liquidación tributaria, panel de cartera y comprobantes de egreso `EGR`. 53 pruebas unitarias y 33 pruebas E2E pasando al 100%. Builds limpios de front y back. | **HITO ALCANZADO: SPRINT 6 COMPLETADO EXITOSAMENTE.** Fusionado a `develop` y `main`, tag `v0.6.0-sprint6`. |

