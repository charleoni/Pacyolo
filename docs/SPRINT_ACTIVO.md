# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: Bloques de ~2 Horas)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Arquitectura Maestra:* `C:\proyectos\PACYOLO\docs\ARQUITECTURA_ERP_PACYOLO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/08-articulos-inventarios-cxp`  
*Última Versión Publicada:* `v0.7.0-sprint7` (Cerrada y Fusionada en `main` y `develop`)

---

## 🎯 SPRINT 8: Artículos, Compras, Entradas de Almacén, Kardex NIIF & CxP Analítico
- **Objetivo del Sprint:** Implementar la base de la cadena de suministro previo a las ventas: catálogo maestro de artículos/servicios (NIC 2), nuevas tablas paramétricas en el gestor dinámico (unidades de medida, categorías, bodegas, tipos de movimiento), circuito documental de abastecimiento (Órdenes de Compra y Entradas de Almacén con recepción parcial/total), motor de Kardex físico y valorado en tiempo real con costeo promedio ponderado móvil y notas de ajuste, contabilización automática del ciclo de compra e inventario, y módulo avanzado de Cuentas por Pagar (CxP) con estados de cuenta, extractos y matriz de análisis de vencimiento por edades.
- **Entregables Evaluativos para el Usuario:**
  1. **Tablas Paramétricas Dinámicas:** Unidades de medida (DIAN/ISO), categorías con cuentas contables por defecto, catálogo de bodegas y tipos de movimientos de inventario administrables desde `/dashboard/parametros`.
  2. **Catálogo Maestro de Artículos:** Soporte de inventariables, servicios y consumibles, reglas tributarias (IVA/INC) y código de barras.
  3. **Circuito de Compras & Recepción:** Órdenes de Compra (OC) y Entradas de Almacén (EA) con control de cantidades pendientes y cruce de factura de proveedor.
  4. **Kardex Multibodega & Notas de Ajuste:** Historial inmutable de movimientos, existencias por bodega, costeo promedio ponderado y notas de ajuste justificadas (sobrante, faltante, merma, cierre de periodo).
  5. **CxP Analítico & Reportes Operativos:**
     - Estado de cuenta por proveedor (saldo consolidado y facturas abiertas).
     - Extracto cronológico de cuenta por proveedor.
     - Reporte de análisis de cartera de proveedores por edades (Corriente, 1-30, 31-60, 61-90, 90+ días).
  6. **Frontend Web & Pruebas:** Vistas reactivas en Angular 22 integradas en los menús desplegables y suite de pruebas unitarias al 100%.

---

### 📋 Desglose de Micro-Tareas Sprint 8 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **8.1** | Tablas Paramétricas de Inventario | Nuevas tablas maestras relacionales en PostgreSQL (`core_unidades_medida`, `inv_categorias_articulos`, `inv_bodegas`, `inv_tipos_movimiento`) integradas al módulo universal de parámetros y semillas por defecto. | 2h | `[ ]` Pendiente | - |
| **8.2** | Catálogo Maestro de Artículos (NIC 2) | Entidad `inv_articulos`, DTOs con validación, clasificación (Inventariable / Servicio / Consumible), impuestos (IVA / INC), SKU, código de barras y cuentas contables predeterminadas. | 2h | `[ ]` Pendiente | - |
| **8.3** | Órdenes de Compra (OC) | Modelo `compras_ordenes` y líneas, generación de pedidos a proveedores con estados (`BORRADOR`, `APROBADA`, `RECIBIDA_PARCIAL`, `RECIBIDA_TOTAL`, `CANCELADA`) sin impacto contable directo. | 2h | `[ ]` Pendiente | - |
| **8.4** | Entradas de Almacén (EA) & Recepción | Recepción física de mercancía cruzada contra Orden de Compra, control de saldo pendiente por recibir y registro de remisión del proveedor. | 2h | `[ ]` Pendiente | - |
| **8.5** | Kardex Multibodega & Notas de Ajuste | Motor de movimientos inmutables de inventario, recálculo de costo promedio ponderado en cada entrada, control de existencias por bodega y notas de ajuste por sobrante, merma o cierre de periodo. | 2h | `[ ]` Pendiente | - |
| **8.6** | Cruce de Factura Proveedor & Asiento Contable | Causación formal de la factura de compra afectando Inventario (Activo 14) / Gasto (51/52), IVA descontable, retenciones y Pasivo de Proveedores (2205) con generación del asiento automático de partida doble. | 2h | `[ ]` Pendiente | - |
| **8.7** | Módulo de CxP Analítico & Reportes | Endpoints y lógica de negocio para: Estado de Cuenta por Proveedor, Extracto Cronológico de Facturas vs Pagos, y Matriz de Vencimiento por Edades (0-30, 31-60, 61-90, 90+ días). | 2h | `[ ]` Pendiente | - |
| **8.8** | Frontend Web: Catálogo, Compras & Inventarios | Interfaz de gestión en Angular 22: Ficha de Artículos, flujo de Orden de Compra y Entrada de Almacén, consulta de Kardex por producto/bodega y visor de notas de ajuste. | 2h | `[ ]` Pendiente | - |
| **8.9** | Frontend Web: Reportes de CxP & Proveedores | Vistas analíticas en Angular: visor de Estado de Cuenta, Extracto de Proveedor interactivo y tabla dinámica de cartera por edades de vencimiento con exportación/impresión. | 2h | `[ ]` Pendiente | - |
| **8.10** | Certificación, Pruebas Unitarias & Cierre | Suite de pruebas unitarias en backend Vitest cubriendo todo el circuito, validación en navegador junto con el usuario, commit y cierre del Sprint 8. | 2h | `[ ]` Pendiente | - |

---

## 🔮 Backlog Estratégico de Sprints Futuros (Arquitectura ERP PACYOLO)

### 📌 SPRINT 9: Facturación Comercial Propia, Mostrador / POS, Costeo Automático de Ventas & Cartera (CxC)
- **Facturación POS / Mostrador:** Tiras de caja rápidas para mostrador, restaurante, peluquería, carnicería o ferretería con propinas voluntarias e impuesto al consumo (INC 8%).
- **Facturación de Venta Estándar:** Emisión de facturas a crédito o al contado con IVA (0%, 5%, 19%) y retenciones practicadas por clientes.
- **Costeo Automático de Ventas (Kardex):** Salida automática de inventario valorada al costo promedio ponderado (`Débito 61 <-> Crédito 14`).
- **Recaudos (`ING`):** Recibos de caja manuales para abonos y cancelaciones de cartera de clientes.
- **Reporte de Cartera CxC:** Antigüedad de saldos de clientes (corriente, 30, 60, 90+ días).

### 📌 SPRINT 10: Tesorería, Cajas Menores & Conciliación Bancaria
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

### ✅ SPRINT 7: Tablas Maestras Dinámicas, Integridad Referencial & Reestructuración de Navegación (COMPLETADO 100%)
- **Versión de Cierre:** `v0.7.0-sprint7` (18/10/2026).
- **Rama:** `sprint/07-tablas-maestras-dinamicas`.
- **Logros:**
  - **Erradicación de Hardcoding / Cero Enums:** Reemplazo de todos los enums estáticos en frontend y backend por tablas relacionales con soporte multi-tenant (semillas globales por defecto y personalizables por empresa):
    1. `core_tipos_identificacion`: Códigos oficiales DIAN (13, 31, 22, 11, etc.), nombres oficiales y bandera para obligatoriedad de Dígito de Verificación (DV).
    2. `core_tipos_persona`: Persona Natural vs Jurídica con bandera de exigencia de razón social.
    3. `core_regimenes_fiscales`: Responsabilidades tributarias DIAN (`O-13`, `R-99-PN`, `O-47`, `O-23`, `O-15`) y régimen de IVA.
    4. `core_clasificaciones_tercero`: Clasificaciones comerciales (`CLIENTE`, `PROVEEDOR`, `EMPLEADO`, `CONTRATISTA`, `ACCIONISTA`, `ACREEDOR`).
    5. `cont_tipos_comprobante`: Configuración de comprobantes contables con prefijo oficial y consecutivo dinámico.
    6. `core_metodos_pago`: Medios de pago oficiales DIAN (`10`, `47`, `42`, `20`, `48`, `49`, `1`), exigencia de referencia bancaria y trazabilidad.
  - **Catálogos Geográficos DANE & Ficha de Terceros:** Entidades relacionales `core_departamentos` y `core_municipios` (Divipola DANE), y flujo dual de Terceros (mostrador rápido vs ficha completa con responsabilidades fiscales DIAN y datos bancarios).
  - **Integridad Referencial & Auditoría de Uso:** Conteo dinámico de uso (`conteo_usos`, `en_uso`). Bloqueo de inactivación en Frontend (`🔒 Bloqueado`) y en Backend (`BadRequestException (400)`) si el parámetro está en uso por terceros, comprobantes u otras entidades. Inmutabilidad de `código` cuando está en uso.
  - **Edición Completa de Parámetros:** Modal interactivo para modificar nombre, descripción y metadatos. Sanitización de payloads para cumplimiento estricto con `ValidationPipe (forbidNonWhitelisted: true)`.
  - **Rediseño UX Maestro-Detalle de Parámetros:** Reemplazo de tabs horizontales por un sidebar vertical categorizado con buscador en tiempo real y badges de registros en uso, optimizado para escalar indefinidamente.
  - **Reorganización Modular de la Navegación Global:** Agrupación de la barra superior en menús desplegables verticales con directiva click-outside y detección de ruta activa:
    - `📖 Contabilidad` (Maestro de Terceros, Catálogo PUC NIIF, Libro Diario, Borradores Integración).
    - `🛡️ Seguridad del Sistema` (Equipo & Roles RBAC, Pistas de Auditoría).
    - Accesos directos limpios: `📊 Resumen`, `📦 Compras & CxP`, `⚙️ Parámetros`.
  - **Ficha Única Centralizada de Terceros:** Integración de Terceros como maestro transversal dentro de Contabilidad, estructurado para operar bajo un único NIT con múltiples roles simultáneos (Cliente, Proveedor, Empleado, DIAN) sin duplicar datos ni romper medios magnéticos.
  - **Suite de Pruebas:** 75 pruebas unitarias de backend pasando al 100% (16 suites de prueba de backend Vitest) y build de producción Angular (`ng build`) exitoso.

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
| **7** | 17/10/2026 | 2h+ | **Sprint 7 - Fase A (7.1 a 7.5)** | Rama `sprint/07-tablas-maestras-dinamicas`. Modelo relacional y módulo de Tablas Maestras Paramétricas (6 catálogos: tipos identificación, persona, regímenes, clasificaciones, tipos comprobante, métodos pago). Erradicación de enums quemados y soporte multi-tenant con semillas globales. Panel web `/dashboard/configuracion/maestras` con pestañas, switches, modal de creación rápida e impresión (`window.print()`). Formularios de Terceros, Asientos y CxP desacoplados y dinámicos. 58 pruebas unitarias y 33 pruebas E2E pasando al 100%. Builds limpios. | **Fase A Completada.** |
| **8** | 18/10/2026 | 2h+ | **Sprint 7 - Fase B & Cierre Definitivo (7.6 a 7.14)** | Rama `sprint/07-tablas-maestras-dinamicas`. Geografía DANE (deptos/municipios). Integridad referencial con conteo de usos en vivo, bloqueo de inactivación en frontend y backend (HTTP 400). Edición de parámetros con modal y sanitización para `ValidationPipe (forbidNonWhitelisted)`. Rediseño UX Maestro-Detalle con sidebar vertical y badges de uso. Reestructuración de la navegación global con menús desplegables modulares (`📖 Contabilidad` y `🛡️ Seguridad del Sistema`). Unificación de Terceros en Contabilidad como ficha maestra multi-rol. 75/75 pruebas unitarias de backend pasando (100% en 16 suites) y build de producción exitoso. | **HITO ALCANZADO: SPRINT 7 COMPLETADO AL 100%.** Listo para merge a `develop` y `main`. |


