# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: Bloques de ~2 Horas)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Arquitectura Maestra:* `C:\proyectos\PACYOLO\docs\ARQUITECTURA_ERP_PACYOLO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/09-ventas-pos-costeo-cxc` (Cierre Formal -> `v0.9.0-sprint9`)  
*Última Versión Publicada:* `v0.9.0-sprint9` (Cerrada y Certificada)

---

## 🎯 SPRINT 9: Facturación Comercial Propia, Mostrador / POS, Costeo Automático de Ventas, Notas Crédito & Cartera (CxC)
- **Objetivo del Sprint:** Implementar el circuito completo de ingresos, ventas, devoluciones comerciales y cuentas por cobrar bajo estricto rigor NIIF (NIIF 15, NIC 2 y NIIF 9) y los **4 Pilares de Gobernanza Contable Total de PACYOLO**:
  1. **Facturación Comercial Estándar & Punto de Venta (POS / Mostrador):**
     - Emisión de facturas de venta oficiales (`FAC-XXXX`) y tiras de caja rápida para mostrador / POS (`POS-XXXX`).
     - Soporte para medios de pago mixtos (Efectivo + Transferencia/Tarjeta + Saldo a Crédito).
     - Liquidación tributaria completa: IVA generado (0%, 5%, 19%), Impuesto Nacional al Consumo (INC 8%) y retenciones practicadas por clientes (Anticipo Retefuente 135515, ReteICA 135518, ReteIVA 135517).
     - Manejo de condiciones de pago: Contado vs Crédito (con fecha de vencimiento y cupo).
     - Manejo de propinas voluntarias (pasivo de distribución a terceros).
  2. **Costeo Automático de Ventas en Tiempo Real (NIC 2):**
     - Salida atómica de inventario valorada al costo promedio ponderado vigente en Kardex y afectación de existencias por bodega.
     - Generación automática del asiento contable de costo:
       $$\text{Débito 61 (Costo de Ventas)} \quad \longleftrightarrow \quad \text{Crédito 14 (Inventario en Bodega)}$$
     - Discriminación para ítems de tipo `SERVICIO` (sin afectación a inventario físico).
  3. **Notas Crédito en Ventas (`NC-XXXX` - Reversión NIIF 15 & NIC 2):**
     - Prohibición de anulación destructiva: toda reversión se realiza mediante Nota Crédito oficial DIAN/NIIF vinculada a la factura original.
     - Tipos de Nota Crédito: Devolución física total, devolución física parcial o ajuste/rebaja de precio sin movimiento físico.
     - Destino del saldo financiero: Aplicar a Cartera (`Crédito 1305`), Reembolso de dinero (`Crédito 1105/1110`) o Saldo a Favor / Anticipo de Cliente (`Crédito 2805`).
     - Reingreso físico simétrico a Kardex como `ENTRADA_DEVOLUCION_VENTA` a la bodega de origen de cada ítem, con asiento de reversión de costo:
       $$\text{Débito 14 (Inventario en Bodega)} \quad \longleftrightarrow \quad \text{Crédito 61 (Costo de Ventas)}$$
  4. **Módulo de Cartera de Clientes & Recaudos (CxC - NIIF 9) con Pronto Pago:**
     - Control del derecho de cobro en clientes (`1305`) con desglose de saldo corriente vs vencido.
     - Registro de recibos de caja / Comprobantes de Ingreso (`ING`) para abonos parciales o cancelación total, afectando Caja (`1105`) o Bancos (`1110`).
     - Descuento por pronto pago / financiero condicionado (NIIF 15 / NIIF 9): reconocimiento en resultados como Gasto Financiero (`Débito 530535`) extinguiendo la cartera (`Crédito 1305`) sin alterar la base de IVA facturada a la DIAN.
     - Control de no-destructividad: anulación auditada de recibos con reversión contable y reactivación del saldo de cartera.
  5. **Reportes Operativos y Analíticos de Cartera:**
     - Estado de cuenta por cliente (saldo consolidado y facturas abiertas).
     - Extracto cronológico interactivo de cargos vs abonos.
     - Matriz de análisis de vencimiento por edades de cartera (Corriente, 1-30, 31-60, 61-90, +90 días).
  6. **Gobernanza de los 4 Pilares Documentales & Frontend Reactivo (Angular Signals):**
     - Contabilización obligatoria en Libro Diario con estricta partida doble.
     - Vistas previas e impresión formal membretada (factura carta, tiquete POS de 80mm y Nota Crédito).
     - Pistas de auditoría inmutables (`aud_pistas`).
     - Enterprise Lookup Modals para selección de clientes, artículos y cuentas sin selects nativos.

---

### 📋 Desglose de Micro-Tareas Sprint 9 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **9.1** | Modelo de Datos: Ventas, NC & CxC | Entidades relacionales en PostgreSQL (`ventas_facturas`, `ventas_facturas_lineas`, `ventas_notas_credito`, `ventas_notas_credito_lineas`, `cxc_cuentas_por_cobrar`, `cxc_recaudos`) con constraints multi-tenant y soporte de reversión NIIF. | 2h | `[X]` Completado | 29/10/2026 |
| **9.2** | Motor Tributario & Asiento de Venta | Servicio backend para liquidación de IVA (240805), INC (2495), anticipos de retenciones (1355) y generación del Comprobante Diario oficial (`FAC` / `POS`). | 2h | `[X]` Completado | 29/10/2026 |
| **9.3** | Costeo Automático de Ventas en Kardex | Conexión atómica de ventas con inventarios: salida de bodega, verificación de existencias suficientes, recálculo de stock y asiento automático `Débito 61 <-> Crédito 14`. | 2h | `[X]` Completado | 29/10/2026 |
| **9.4** | Notas Crédito NIIF (`NC-XXXX`) | Motor de reversión NIIF 15 / NIC 2: devolución total, parcial o ajuste de precio, reingreso a bodega en Kardex (`Débito 14 <-> Crédito 61`) y asiento comercial (`Débito 4175` + `Débito 2408` vs cartera/caja/anticipo). | 2h | `[X]` Completado | 29/10/2026 |
| **9.5** | Módulo de Cartera CxC & Recaudos (`ING`) | Endpoints y lógica de recaudo de cartera, comprobantes de ingreso oficiales, abonos parciales, descuento condicionado por pronto pago NIIF 15 (`530535`) y anulación auditada. | 2h | `[X]` Completado | 29/10/2026 |
| **9.6** | Reportes Analíticos de CxC | Endpoints para Estado de Cuenta por Cliente, Extracto Cronológico de Cartera y Matriz de Antigüedad de Saldos por Edades (0-30, 31-60, 61-90, +90 días). | 2h | `[X]` Completado | 29/10/2026 |
| **9.7** | Frontend Web: Facturación, POS & Notas Crédito | Módulo Angular reactivo con Enterprise Lookup Modal para clientes/artículos, pestaña de Notas Crédito, modal interactivo de reversión e impresión formal membretada. | 2h | `[X]` Completado | 29/10/2026 |
| **9.8** | Certificación, Pruebas Unitarias & Cierre | Suite de pruebas unitarias Vitest en backend (88/88 tests pasando, 19 suites), build de producción Angular exitoso y certificación funcional con el usuario. | 2h | `[X]` Completado | 29/10/2026 |

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

### ✅ SPRINT 9: Facturación Comercial, POS Mostrador, Costeo NIC 2, Notas Crédito NIIF 15 & Cartera CxC (COMPLETADO 100%)
- **Versión de Cierre:** `v0.9.0-sprint9` (29/10/2026).
- **Rama:** `sprint/09-ventas-pos-costeo-cxc` (Fusionada en `develop` y `main`).
- **Logros:**
  - **Facturación Comercial Estándar (`FAC`) & Tiquete POS:** Emisión oficial, liquidación tributaria (IVA 0%, 5%, 19%, INC 8%, retenciones 1355) y medios de pago mixtos (Efectivo + Bancos + Saldo a Crédito).
  - **Costeo Automático de Ventas en Kardex (NIC 2):** Salida a costo promedio ponderado móvil, afectación de existencias por bodega y comprobante automático `Débito 61 <-> Crédito 14`.
  - **Notas Crédito NIIF (`NC-XXXX`):** Motor de reversión no destructiva (devolución física total, parcial y ajustes de precio) con doble asiento contable (comercial en `4175` y costeo en `1435 vs 6135`), reingreso a bodega original y destino financiero (cartera `1305`, dinero `1105/1110` o saldo a favor `2805`).
  - **Módulo de Cartera CxC (NIIF 9) & Pronto Pago:** Control de exigibilidad corriente vs vencida, Recibos de Caja (`ING`) con descuento financiero condicionado (`530535`) sin alterar la base de IVA facturada a la DIAN.
  - **Reportes Analíticos de Cartera:** Estado de Cuenta por Cliente, Extracto Cronológico de Cargos vs Abonos y Matriz de Antigüedad por Edades (Corriente, 1-30, 31-60, 61-90, +90 días).
  - **Gobernanza de los 4 Pilares Documentales & Calidad:** Contabilización obligatoria con estricta partida doble, pistas de auditoría inmutables, impresión membretada formal, 88 pruebas unitarias aprobadas al 100% y build Angular sin errores.

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
