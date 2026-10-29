# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: Bloques de ~2 Horas)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Arquitectura Maestra:* `C:\proyectos\PACYOLO\docs\ARQUITECTURA_ERP_PACYOLO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/09-ventas-pos-costeo-cxc`  
*Última Versión Publicada:* `v0.8.0-sprint8` (Cerrada y Fusionada en `main` y `develop`)

---

## 🎯 SPRINT 9: Facturación Comercial Propia, Mostrador / POS, Costeo Automático de Ventas & Cartera (CxC)
- **Objetivo del Sprint:** Implementar el circuito de ingresos, ventas y cuentas por cobrar bajo rigor NIIF (NIIF 15, NIC 2 y NIIF 9):
  1. **Facturación Comercial Estándar & Punto de Venta (POS / Mostrador):**
     - Emisión de facturas de venta oficiales (`FAC-XXXX`) y tiras de caja rápida para mostrador / POS (`POS-XXXX`).
     - Liquidación tributaria completa: IVA generado (0%, 5%, 19%), Impuesto Nacional al Consumo (INC 8%) y retenciones practicadas por clientes (Anticipo Retefuente 135515, ReteICA 135518, ReteIVA 135517).
     - Manejo de condiciones de pago: Contado vs Crédito (con fecha de vencimiento y cupo).
     - Manejo de propinas voluntarias (pasivo de distribución a terceros).
  2. **Costeo Automático de Ventas en Tiempo Real (NIC 2):**
     - Salida atómica de inventario valorada al costo promedio ponderado vigente en Kardex y afectación de existencias por bodega.
     - Generación automática del asiento contable de costo:
       $$\text{Débito 61 (Costo de Ventas)} \quad \longleftrightarrow \quad \text{Crédito 14 (Inventario en Bodega)}$$
     - Discriminación para ítems de tipo `SERVICIO` (sin afectación a inventario físico).
  3. **Módulo de Cartera de Clientes & Recaudos (CxC - NIIF 9):**
     - Control del derecho de cobro en clientes (`1305`) con desglose de saldo corriente vs vencido.
     - Registro de recibos de caja / Comprobantes de Ingreso (`ING`) para abonos parciales o cancelación total, afectando Caja (`1105`) o Bancos (`1110`).
     - Control de no-destructividad: anulación auditada de recibos con reversión contable y reactivación del saldo de cartera.
  4. **Reportes Operativos y Analíticos de Cartera:**
     - Estado de cuenta por cliente (saldo consolidado y facturas abiertas).
     - Extracto cronológico interactivo de cargos vs abonos.
     - Matriz de análisis de vencimiento por edades de cartera (Corriente, 1-30, 31-60, 61-90, +90 días).
  5. **Gobernanza de los 4 Pilares Documentales & Frontend Reactivo (Angular Signals):**
     - Contabilización obligatoria en Libro Diario con estricta partida doble.
     - Vistas previas e impresión formal membretada (factura carta y tiquete POS de 80mm).
     - Pistas de auditoría inmutables (`aud_pistas`).
     - Enterprise Lookup Modals para selección de clientes, artículos y cuentas sin selects nativos.

---

### 📋 Desglose de Micro-Tareas Sprint 9 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **9.1** | Modelo de Datos: Ventas & CxC | Entidades relacionales en PostgreSQL (`ventas_facturas`, `ventas_facturas_lineas`, `cxc_cuentas_por_cobrar`, `cxc_recaudos`, `cxc_recaudos_lineas`) con constraints multi-tenant y migraciones TypeORM. | 2h | `[ ]` Pendiente | - |
| **9.2** | Motor Tributario & Asiento de Venta | Servicio backend para liquidación de IVA (240805), INC (2495), anticipos de retenciones (1355) y generación del Comprobante Diario oficial (`FAC`). | 2h | `[ ]` Pendiente | - |
| **9.3** | Costeo Automático de Ventas en Kardex | Conexión atómica de ventas con inventarios: salida de bodega, verificación de existencias suficientes, recálculo de stock y asiento automático `Débito 61 <-> Crédito 14`. | 2h | `[ ]` Pendiente | - |
| **9.4** | Módulo de Cartera CxC & Recaudos (`ING`) | Endpoints y lógica de recaudo de cartera, comprobantes de ingreso oficiales, abonos parciales, liquidación de saldos y control de anulación auditada. | 2h | `[ ]` Pendiente | - |
| **9.5** | Reportes Analíticos de CxC | Endpoints para Estado de Cuenta por Cliente, Extracto Cronológico de Cartera y Matriz de Antigüedad de Saldos por Edades (0-30, 31-60, 61-90, +90 días). | 2h | `[ ]` Pendiente | - |
| **9.6** | Frontend Web: Facturación Estándar & POS | Formulario reactivo en Angular 22 con Enterprise Lookup Modal para clientes/artículos, cálculo dinámico de impuestos, modo POS rápido de mostrador y visor de impresión (Factura Carta + Tirilla 80mm). | 2h | `[ ]` Pendiente | - |
| **9.7** | Frontend Web: Cartera CxC & Recaudos | Panel de administración de cartera de clientes, formulario de Recibo de Caja (`ING`), visor de Estado de Cuenta, Extracto y Matriz por Edades. | 2h | `[ ]` Pendiente | - |
| **9.8** | Certificación, Pruebas Unitarias & Cierre | Suite de pruebas unitarias Vitest en backend (cobertura 100% en nuevos servicios), validación integral del flujo y cierre formal del Sprint 9. | 2h | `[ ]` Pendiente | - |

---

## 🔮 Backlog Estratégico de Sprints Futuros (Arquitectura ERP PACYOLO)

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

### ✅ SPRINT 8: Artículos, Compras, Entradas de Almacén, Kardex NIIF & CxP Analítico (COMPLETADO 100%)
- **Versión de Cierre:** `v0.8.0-sprint8` (28/10/2026).
- **Rama:** `sprint/08-articulos-inventarios-cxp` (Fusionada en `develop` y `main`).
- **Logros:**
  - **Catálogo Maestro de Artículos (NIC 2):** Soporte de inventariables, servicios y consumibles, impuestos (IVA/INC), cuentas contables y SKU.
  - **Tablas Paramétricas Dinámicas:** Unidades de medida (DIAN/ISO), categorías, bodegas y tipos de movimiento relacionales.
  - **Circuito de Abastecimiento & Compras:** Órdenes de Compra (`OC`), Entradas de Almacén (`EA`) con entregas parciales y cruce de factura de proveedor.
  - **Kardex Multibodega & Promedio Ponderado Móvil:** Valuación en tiempo real bajo NIC 2, control de existencias y notas de ajuste justificadas.
  - **Devoluciones a Proveedor y Cliente:** Vínculo con nota de entrada base, reversión a orden de compra, rechazo por factura pagada o stock cero y contabilización contraria con IVA.
  - **Causación de CxP & Reportes Analíticos:** Estado de Cuenta por Proveedor, Extracto Cronológico y Matriz de Cartera por Edades (0-30, 31-60, 61-90, +90 días).
  - **Gobernanza Contable:** Erradicación de selects tradicionales con Enterprise Lookup Pattern (`PucLookupModal`, `TerceroLookupModal`, `OrdenCompraLookupModal`), 4 Pilares Documentales y 85 pruebas unitarias aprobadas al 100%.

### ✅ SPRINT 7: Tablas Maestras Dinámicas, Integridad Referencial & Reestructuración de Navegación (COMPLETADO 100%)
- **Versión de Cierre:** `v0.7.0-sprint7` (18/10/2026).
- **Rama:** `sprint/07-tablas-maestras-dinamicas`.
