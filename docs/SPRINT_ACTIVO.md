# ⏱️ PACYOLO — Tablero de Sprint Activo & Control de Avance
## Documento Operativo de Gestión Ágil (Ritmo: Bloques de ~2 Horas)

*Ubicación:* `C:\proyectos\PACYOLO\docs\SPRINT_ACTIVO.md`  
*Arquitectura Maestra:* `C:\proyectos\PACYOLO\docs\ARQUITECTURA_ERP_PACYOLO.md`  
*Regla de Ritmo:* Base diaria de 2 horas. Si en una jornada se dispone de más tiempo, se adelantan tareas del backlog y se actualiza este registro de inmediato.  
*Rama Activa:* `sprint/11-libros-oficiales-cierres-estados-financieros`  
*Última Versión Publicada:* `v0.10.0-sprint10` (Cerrada y Certificada)

---

## 🎯 SPRINT 10: Tesorería, Cajas Menores & Conciliación Bancaria `[CERRADO & CERTIFICADO]`
- **Objetivo del Sprint:** Desarrollar el módulo integral de tesorería y gestión de liquidez bajo estricto rigor NIIF (NIC 7 - Estado de Flujos de Efectivo y NIIF 9) y los **4 Pilares de Gobernanza Contable Total de PACYOLO**:
  1. **Gestión de Cajas Menores (Fondo Fijo):**
     - Apertura y constitución de fondo fijo de caja menor (`110510`) con asignación de custodio responsable, centro de costos y monto máximo autorizado.
     - Legalización de gastos menores con comprobantes de soporte, retenciones aplicadas, imputación a cuentas de gastos (`51/52`) e IVA descontable (`2408`).
     - Reposición periódica / Reintegro de caja menor mediante Comprobante de Egreso bancario (`EGR`) restaurando el fondo fijo.
     - Arqueos periódicos y sorpresivos de caja menor: acta formal de conteo físico de billetes y monedas, determinación automática de sobrantes (`4295`) o faltantes (cuenta por cobrar al custodio `1365` o gasto no deducible `5395`).
  2. **Cuentas Bancarias & Libro Auxiliar de Bancos:**
     - Catálogo maestro de cuentas bancarias (Corrientes y de Ahorros) vinculadas a sus respectivas cuentas auxiliares PUC (`111005`, `111010`) con control de número de cuenta, entidad financiera y saldo en libros en tiempo real.
     - Registro de traslados de fondos interbancarios o consignaciones de caja a bancos con Comprobante de Diario.
  3. **Motor Inteligente de Conciliación Bancaria:**
     - Importador y parser configurable de extractos bancarios oficiales en Excel (`.xlsx`) y CSV de los principales bancos de Colombia (Bancolombia, Davivienda, Banco de Bogotá, etc.).
     - Algoritmo de cruce y emparejamiento automático (Matching) entre los movimientos del extracto y las partidas registradas en el libro auxiliar de bancos (por fecha, importe y número de referencia).
     - Identificación y clasificación clara de partidas conciliatorias:
       - Partidas en libros no en extracto: Cheques girados y no cobrados, consignaciones en tránsito.
       - Partidas en extracto no en libros: Notas débito (GMF 4x1000, comisiones bancarias, cuotas de manejo, retiros) y Notas crédito (intereses ganados, transferencias recibidas no identificadas).
  4. **Causación Automática de Notas Bancarias en 1 Clic:**
     - Módulo de causación ágil para registrar de inmediato los débitos bancarios del extracto con su respectivo Comprobante de Diario:
       $$\text{Gravamen a los Movimientos Financieros (4x1000)}: \quad \text{Débito 511595} \longleftrightarrow \text{Crédito 1110}$$
       $$\text{Comisiones y Cuotas de Manejo}: \quad \text{Débito 530515} \longleftrightarrow \text{Crédito 1110}$$
  5. **Informe Oficial & Hoja de Conciliación Bancaria:**
     - Reporte a doble columna: **Saldo en Extracto Bancario $\longleftrightarrow$ Saldo en Libros Contables**, con detalle de partidas conciliatorias, conciliación cuadrada al centavo y espacios reglamentarios de firma (Elaboró, Revisó, Revisor Fiscal / Auditor).
     - Formato de vista previa e impresión membretada formal y exportación a Excel/PDF.
  6. **Gobernanza de los 4 Pilares Documentales & Frontend Reactivo (Angular Signals):**
     - Asientos contables automáticos con partida doble equilibrada y no alterabilidad destructiva.
     - Pistas de auditoría (`aud_pistas`) en cada arqueo, reposición y conciliación.
     - Modales de búsqueda rápida tipo Enterprise Lookup Pattern (sin selects nativos para cuentas, terceros o centros de costo).

---

### 📋 Desglose de Micro-Tareas Sprint 10 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :-: | :-: |
| **10.1** | Modelo de Datos: Tesorería & Conciliación | Entidades TypeORM relacionales en PostgreSQL (`teso_cajas_menores`, `teso_cajas_menores_gastos`, `teso_cajas_menores_arqueos`, `teso_cuentas_bancarias`, `teso_extractos_bancarios`, `teso_conciliaciones_bancarias`, `teso_conciliaciones_partidas`) con constraints multi-tenant y auditoría. | 2h | `[X]` Completado | 2026-10-29 |
| **10.2** | Motor de Cajas Menores & Legalización | Servicios backend para constitución de fondo fijo (`110510`), causación de gastos menores con retenciones/IVA y reposición periódica vía Comprobante de Egreso (`EGR`). | 2h | `[X]` Completado | 2026-10-29 |
| **10.3** | Módulo de Arqueos de Caja Menor | Servicio de arqueos físicos: desglose de monedas/billetes, comparación contra saldo contable, acta de arqueo y causación automática de sobrantes (`4295`) o faltantes (`1365`/`5395`). | 2h | `[X]` Completado | 2026-10-29 |
| **10.4** | Cuentas Bancarias & Libro Auxiliar | Gestión de cuentas corrientes/ahorros vinculadas al PUC (`1110`), consulta de saldo en tiempo real y libro auxiliar bancario con filtros por fecha y tercero. | 2h | `[X]` Completado | 2026-10-29 |
| **10.5** | Parser e Importador de Extractos Bancarios | Servicio de importación de extractos (CSV / Excel) para bancos colombianos con validación de estructura, mapeo de columnas y prevención de duplicados. | 2h | `[X]` Completado | 2026-10-29 |
| **10.6** | Algoritmo de Matching & Cruce Conciliatorio | Motor de cruce automático extracto vs auxiliar contable por fecha, valor y referencia, con detección de partidas conciliatorias (cheques en tránsito, consignaciones pendientes). | 2h | `[X]` Completado | 2026-10-29 |
| **10.7** | Causación Rápida de Notas Bancarias | Endpoints para generación en 1 clic de asientos de GMF (4x1000 - `5115`), comisiones (`530515`) e intereses (`4210`), conciliando la partida automáticamente. | 2h | `[X]` Completado | 2026-10-29 |
| **10.8** | Frontend Web: Tesorería, Cajas & Conciliador | Módulo Angular reactivo con Signals: vistas de gestión de cajas menores, formulario de arqueo, visor de extractos, matriz de conciliación a doble columna e impresión formal membretada. | 2h | `[X]` Completado | 2026-10-29 |

---

## 🔮 Backlog Estratégico de Sprints Futuros (Arquitectura ERP PACYOLO)

### 📌 SPRINT 11: Libros Oficiales Registrados, Cierres Contables & Los 5 Estados Financieros NIIF `[ACTIVO]`
- **Objetivo del Sprint:** Implementar el núcleo de gobierno contable periódico, libros oficiales de comercio y generación de los 5 estados financieros bajo estricto rigor NIIF (NIC 1, NIC 7, NIC 8, NIC 21) y los **4 Pilares de Gobernanza Contable Total de PACYOLO**:
  1. **Control de Períodos Contables & Candado de Seguridad:**
     - Entidad `PeriodoContable` con estados: `ABIERTO`, `CERRADO_MENSUAL`, `BLOQUEADO_AUDITORIA`.
     - Validación en guard/service contable para rechazar cualquier inserción, modificación o anulación de comprobantes en períodos con candado activo.
  2. **Motor de Cierre Anual NIIF (Comprobante `CIE` al 31 de Diciembre):**
     - Liquidación automática y cancelación de saldos de cuentas de resultado (Clases 4, 5, 6, 7) contra la cuenta intermedia `590505 Ganancias y Pérdidas`.
     - Traspaso a cuentas patrimoniales definitivas: `360505 Utilidad del Ejercicio` o `361005 Pérdida del Ejercicio`.
     - Reseteo de saldos de resultado para el siguiente ejercicio y continuidad de saldos de balance (1, 2, 3).
  3. **Motor de Reexpresión y Diferencia en Cambio NIIF (NIC 21):**
     - Ajuste mensual de cuentas en moneda extranjera según TRM oficial de cierre contra cuentas `530525` (Gasto DxC) o `421020` (Ingreso DxC).
  4. **Motor de Agregación Jerárquica del PUC (Niveles 1 a 5):**
     - Capacidad de rollup y consolidación dinámica a nivel de:
       - Nivel 1: Clase (1 dígito)
       - Nivel 2: Grupo (2 dígitos)
       - Nivel 3: Cuenta (4 dígitos)
       - Nivel 4: Subcuenta (6 dígitos)
       - Nivel 5: Auxiliar analítico por Tercero (8-10 dígitos).
  5. **Libros Oficiales de Comercio Registrados (Código de Comercio & Revisoría Fiscal):**
     - Libro Mayor y Balances mensual (Saldos iniciales, movimientos débitos/créditos y saldos finales).
     - Libro Diario Columnario mensual clasificado por tipo de comprobante (`ING`, `EGR`, `FAC`, `NC`, `ND`, `CAU`, `CIE`).
     - Libro de Inventarios y Balances anual.
     - Libro Auxiliar Integral con trazabilidad de tercero (NIT), comprobante, fecha, detalle y saldo progresivo.
  6. **Generador Oficial de los 5 Estados Financieros NIIF (NIC 1 / NIC 7):**
     - Estado de Situación Financiera (ESF) clasificado (Corriente / No Corriente).
     - Estado de Resultado Integral (ERI con desglose de utilidad bruta, operacional, antes de impuestos y ORI).
     - Estado de Cambios en el Patrimonio (variaciones de capital, reservas y resultados).
     - Estado de Flujos de Efectivo (NIC 7: Método Directo e Indirecto).
     - Notas y Revelaciones a los Estados Financieros.
  7. **Frontend Reactivo con Angular Signals & Exportación/Impresión Membretada Formal:**
     - Tablero de períodos contables con botón de bloqueo/desbloqueo auditado.
     - Asistente de Cierre Anual con previsualización del asiento `CIE`.
     - Visor interactivo de libros oficiales con selector de nivel (1 al 5) y drill-down.
     - Visor y descargador de Estados Financieros comparativos listos para firmas reglamentarias.

---

### 📋 Desglose de Micro-Tareas Sprint 11 (Estimación: Bloques de ~2 Horas)

| # | Bloque | Tarea / Entregable Técnico | Estimado | Estado | Fecha Realización |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **11.1** | Modelo de Datos: Períodos Contables & Candado | Entidades `PeriodoContable` y `CierreEjercicio` en PostgreSQL (`contabilidad`) con validación de candado en `AsientosService`. | 2h | `[ ]` Pendiente | — |
| **11.2** | Motor de Cierre Anual NIIF (`CIE`) | Servicio de liquidación automática de cuentas nominales contra `590505` y generación atómica del Comprobante `CIE` hacia `360505`/`361005`. | 2h | `[ ]` Pendiente | — |
| **11.3** | Motor de Diferencia en Cambio (NIC 21) | Servicio de reexpresión de saldos en moneda extranjera según TRM de fin de mes con asiento automático en `530525`/`421020`. | 2h | `[ ]` Pendiente | — |
| **11.4** | Motor de Consultas Jerárquicas del PUC (1-5) | Algoritmo optimizado de agregación por Clase, Grupo, Cuenta, Subcuenta y Auxiliar con soporte para drill-down analítico por tercero. | 2h | `[ ]` Pendiente | — |
| **11.5** | Libros Oficiales: Mayor y Balances & Diario Columnario | Endpoints y generadores de Libro Mayor y Balances y Libro Diario Columnario con formato oficial exigido por Revisoría Fiscal. | 2h | `[ ]` Pendiente | — |
| **11.6** | Libros Oficiales: Auxiliar Integral & Inventarios | Servicio de Libro Auxiliar Integral con saldo continuo por tercero/cuenta y Libro de Inventarios y Balances anual. | 2h | `[ ]` Pendiente | — |
| **11.7** | Los 5 Estados Financieros NIIF (NIC 1 / NIC 7) | Endpoints de cálculo de Situación Financiera, Resultado Integral, Cambios en Patrimonio, Flujos de Efectivo y Notas de revelación. | 2h | `[ ]` Pendiente | — |
| **11.8** | Frontend Angular: Cierres, Libros & Estados Financieros | Componentes Angular Signals: Panel de control de períodos, Asistente de Cierre Anual, Visor multinivel de Libros y Visor de Estados Financieros membretados. | 2h | `[ ]` Pendiente | — |
- **Cierre y Bloqueo de Períodos Mensuales (Candado Contable):** Bloqueo formal de fechas auditado para blindar meses presentados o declarados ante modificaciones o inserciones extemporáneas.
- **Motor de Cierre Anual NIIF (Comprobante `CIE` al 31 de Diciembre):**
  - Cancelación automática de todas las cuentas nominales de resultado (Clase 4 Ingresos Débito, Clase 5 Gastos Crédito, Clases 6 y 7 Costos Crédito) contra la cuenta intermedia `590505 Ganancias y Pérdidas`.
  - Traslado automático a Patrimonio: Débito `5905` $\longleftrightarrow$ Crédito `360505 Utilidad del Ejercicio` (o Débito `361005 Pérdida` $\longleftrightarrow$ Crédito `5905`).
  - Saldo en cero para cuentas de resultado el 1 de enero y apertura de saldos iniciales de balance (1, 2, 3).
- **Diferencia en Cambio NIIF (NIC 21):** Reexpresión mensual de activos y pasivos en moneda extranjera según TRM de cierre oficial (`530525` vs `421020`).
- **Árbol Jerárquico Multinivel del PUC:** Selector de profundidad dinámica para reportes:
  - Nivel 1: Clase (1 dígito)
  - Nivel 2: Grupo (2 dígitos)
  - Nivel 3: Cuenta (4 dígitos)
  - Nivel 4: Subcuenta (6 dígitos)
  - Nivel 5: Auxiliar de detalle analítico (8 a 10 dígitos) con drill-down interactivo.
- **Los 5 Estados Financieros Oficiales NIIF (NIC 1 / DUR 2420):**
  1. Estado de Situación Financiera clasificado (Corriente / No Corriente).
  2. Estado de Resultado Integral (ERI con desglose de P&G y ORI).
  3. Estado de Cambios en el Patrimonio (conciliación de variaciones de capital, reservas y utilidades).
  4. Estado de Flujos de Efectivo (NIC 7: Métodos Directo e Indirecto con actividades de operación, inversión y financiación).
  5. Notas y Revelaciones a los Estados Financieros (resumen de políticas y desglose analítico).
- **Libros Oficiales Registrados (Código de Comercio y Revisoría Fiscal):**
  - Libro Mayor y Balances mensual.
  - Libro Diario Columnario mensual por tipo de comprobante.
  - Libro de Inventarios y Balances anual.
  - Libro Auxiliar Integral por Cuenta Contable y Tercero (NIT).

### 📌 SPRINT 12: Activos Fijos & Propiedad, Planta y Equipo (NIC 16)
- **Ficha Técnica de Activos:** Códigos de placa, ubicación física, centro de costos, proveedor, factura base, valor de salvamento y vida útil NIIF.
- **Motor de Depreciación Mensual Automática:** Asiento de fin de mes `Débito 5160 / 5260 <-> Crédito 1592`.
- **Deterioro y Bajas:** Retiro por obsolescencia y cálculo de utilidad/pérdida en enajenación de activos fijos.

### 📌 SPRINT 13: Nómina Electrónica & Seguridad Social (UGPP / DIAN)
- **Contratos Laborales & Devengos:** Sueldo básico, auxilio de transporte, horas extras diurnas/nocturnas/festivas, recargos y bonificaciones.
- **Deducciones de Ley:** Salud (4%), Pensión (4%), Fondo de Solidaridad Pensional, retención en la fuente laboral (Procedimiento 1 / 2).
- **Aportes Patronales & Provisiones:** EPS patronal, Pensión (12%), ARL, Parafiscales (SENA, ICBF, Caja) y provisión de Cesantías, Intereses, Prima y Vacaciones.
- **Contabilización Automática & Transmisión DIAN:** Asiento contable de nómina y generación del XML / CUNE para la DIAN.

### 📌 SPRINT 14: Módulo Tributario, Liquidación de Impuestos & Información Exógena DIAN (Medios Magnéticos)
- **Mapeo de PUC a Conceptos DIAN:** Configuración de cuentas auxiliares hacia los conceptos de información exógena.
- **Borradores de Declaraciones Tributarias Oficiales:**
  - Formulario 300 (IVA bimestral/cuatrimestral): bases gravadas (19%, 5%), exentas, excluidas, IVA generado vs descontable.
  - Formulario 350 (Retención en la Fuente mensual): compras, servicios, honorarios, arrendamientos, salarios y autorretenciones.
  - Declaración de ICA territorial (según municipio DANE y actividades gravadas).
- **Motor de Información Exógena Nacional DIAN (Medios Magnéticos):**
  - Generación y exportación a Excel / XML validable en el prevalidador DIAN:
    - Formato 1001: Pagos o abonos en cuenta y retenciones practicadas.
    - Formato 1003: Retenciones en la fuente que le practicaron a la empresa.
    - Formato 1005 / 1006: IVA descontable e IVA generado e Impoconsumo.
    - Formato 1007: Ingresos propios recibidos en el ejercicio.
    - Formato 1008 / 1009: Saldos de Cuentas por Cobrar (CxC) y Cuentas por Pagar (CxP) a 31 de diciembre.
    - Formato 1011 / 1012: Información de declaraciones y saldos en cuentas bancarias.
    - Formato 2276: Certificado de ingresos y retenciones por rentas de trabajo (nómina).
- **Certificados Tributarios:** Certificados de retención en la fuente e IVA con firma digital para proveedores.

### 📌 SPRINT 15: Auditoría Contable, Exportación XBRL (Supersociedades) & Certificación Enterprise
- **Taxonomía XBRL Oficial:** Exportación para el software STORM / XBRL Express de la Superintendencia de Sociedades.
- **Motor de Pruebas de Consistencia de Partida Doble:** Verificación automatizada de Sumas Iguales en el 100% de los asientos históricos.
- **Certificación de Inmutabilidad:** Validación de pistas de auditoría (`aud_pistas`) e integridad de sellos temporales.

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
