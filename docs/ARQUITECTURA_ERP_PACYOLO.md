# 🧭 PACYOLO: Arquitectura Maestra del Core ERP Contable Universal
## Sistema Contable, Tributario y Operativo Multi-Industria (Colombia NIIF / DUR 2420)

---

### 1. 🎯 Visión y Premisa Fundamental

**PACYOLO** no es un software contable genérico ni un simple visor de transacciones. Es un **Universal Accounting Core & ERP** diseñado para operar con la misma solidez técnica y normativa en:
- 🍞 **Una Panadería o Restaurante:** Materia prima (harina, carnes), recetas/transformación (inventario en proceso), producto terminado (pan, platos) y punto de venta ágil con propinas e impuesto al consumo (INC 8%).
- 🏍️ **Un Almacén y Taller de Motos/Comercio:** Compra y venta de mercancía no fabricada por la empresa (Grupo 14), control unitario y serializado de chasis/motor (VIN), SKU de repuestos, valuación Promedio Ponderado y costeo de ventas automático en cada salida.
- 🏢 **Una Empresa de Servicios / Propiedad Horizontal / Consultoría:** Honorarios, causaciones directas al gasto, manejo de presupuestos y gestión de cartera.
- 🏭 **Pequeña y Mediana Industria:** Costos directos de mano de obra, CIF (costos indirectos) y costeo de producción.

---

### 2. ⚡ El Principio de Operación Dual: "Propio + Integración Externa"

El sistema debe operar siempre bajo una arquitectura de **Doble Canal de Entrada**:

```mermaid
flowchart TD
    subgraph CanalesEntrada["Canales de Captura"]
        A1["Canal 1: Operación Manual Web\n(Digitadores, Contadores, Auxiliares)"]
        A2["Canal 2: Sistemas Externos\n(POS Restaurante, Shopify, Nómina Externa, ERP PH)"]
    end

    subgraph CapaSeguridadYValidacion["Capa de Gobernanza & Validación"]
        B1["RBAC & Tenant Context\n(Token JWT + x-empresa-id)"]
        B2["Idempotencia & Firma HMAC\n(X-Pacyolo-Signature)"]
        B3["Motor de Reglas Tributarias & NIIF\n(Bases mínimas, Cuentas Auxiliares)"]
    end

    subgraph NucleoLedger["Core Ledger Contable Inmutable"]
        C1["Borradores con Aprobación Dual"]
        C2["Motor de Partida Doble en Tiempo Real\nSUM(Débitos) == SUM(Créditos)"]
        C3["Libro Diario Oficial & Consecutivos Bloqueados"]
    end

    subgraph ModulosEspecializados["Subsistemas Operativos"]
        D1["Inventarios & Kardex Permanente"]
        D2["Compras & Cuentas por Pagar (CxP)"]
        D3["Ventas & Cuentas por Cobrar (CxC)"]
        D4["Activos Fijos NIIF"]
        D5["Nómina Electrónica & Seguridad Social"]
        D6["Tesorería & Bancos"]
    end

    A1 --> B1
    A2 --> B2
    B1 --> B3
    B2 --> B3
    B3 --> C1
    B3 --> C2
    C1 --> C2
    C2 --> C3
    C3 --> ModulosEspecializados
```

1. **Canal Manual (Frontend Web Autónomo):**  
   El contador o auxiliar se sienta en la aplicación web, abre un formulario y digita asientos, causa facturas de compras con retenciones automáticas, registra pagos o emite comprobantes.
2. **Canal Integrado (API-First / Webhooks):**  
   Un software de facturación POS (ej: el POS del restaurante), una tienda virtual (Shopify/WooCommerce) o una pasarela de pagos (Wompi/Stripe) envía transacciones en JSON. PACYOLO las recibe con idempotencia criptográfica y las contabiliza de inmediato o las deposita en bandeja de borradores para revisión.

---

### 3. 🧩 Desglose Exhaustivo de los Módulos del Sistema

---

#### MÓDULO 1: Core Ledger & Catálogo Contable (Ya Construido 100%)
- **PUC NIIF Colombia (5 niveles):** Clase, Grupo, Cuenta, Subcuenta y Auxiliar. Validación estricta que impide imputar a cuentas no auxiliares.
- **Motor de Partida Doble:** Validación matemática en memoria y base de datos antes de persistir (`SUM(D) == SUM(C)`).
- **Tipología de Comprobantes Oficiales:** `DIA` (Diario), `ING` (Ingreso/Recaudo), `EGR` (Egreso/Pago), `CAU` (Causación de Compras), `APE` (Apertura), `CIE` (Cierre).
- **Inmutabilidad y Consecutivos:** Control pesimista por tenant para evitar huecos en la numeración legal. Anulaciones exclusivamente mediante **reversión NIIF / contra-asiento**.

---

#### MÓDULO 2: Terceros, Tributario & Cuentas por Pagar (CxP) (Ya Construido 100%)
- **Directorio de Terceros:** Cédulas y NITs con validación matemática de Dígito de Verificación (Dian Módulo 11).
- **Motor Tributario Nacional y Territorial:**
  - Retefuente por compras (2.5%), servicios (4%), honorarios (10%/11%).
  - ReteICA territorial parametrizable por municipio.
  - ReteIVA (15%) e IVA descontable (Cuenta 240802).
  - Impuesto Nacional al Consumo (INC 8% para restaurantes y bares).
- **Causación de Compras:** Registro de pasivos (Cuentas del Grupo 22 y 23) y comprobante `CAU`.
- **Comprobantes de Egreso (`EGR`):** Cancelación de deudas con afectación a bancos/caja y comprobante oficial.

---

#### MÓDULO 3: Facturación Comercial, Electrónica & Cuentas por Cobrar (CxC)
> *Generación propia de facturas y recepción desde sistemas externos, control de cartera y recaudos.*

- **Facturación Propia (Emisión Directa desde PACYOLO):**
  - **Factura Electrónica de Venta (DIAN Anexo 1.9):**
    - Prefijos y rangos de numeración autorizados por la DIAN (ej: `SETP-1000` a `5000`).
    - Generación de CUFE (Código Único de Factura Electrónica) y Código QR.
    - Representación gráfica en PDF oficial con desglose de impuestos y discriminación de ítems.
  - **Facturación POS / Tiras de Caja (Para Restaurantes, Panaderías y Mostrador):**
    - Venta rápida al contado o a crédito.
    - Manejo de propinas voluntarias (pasivo de distribución).
    - Descuentos comerciales condicionados y a pie de factura.
  - **Recepción / Ingesta de Facturas Externas (Doble Canal):**
    - Ingesta desde e-commerce (Shopify, WooCommerce) o POS externos vía API con idempotencia estricta.
- **Impuestos en Venta:**
  - IVA Generado (Tarifas 0%, 5%, 19% - Cuenta 240805).
  - Impuesto Nacional al Consumo (INC 8% para restaurantes y bares - Cuenta 2495).
  - Retenciones que le practican al negocio (Anticipo de Retefuente 135515, Anticipo de ReteICA 135518, Anticipo de ReteIVA 135517).
- **Gestión de Cartera & Recaudos (`ING`):**
  - Cuentas por Cobrar Clientes (Cuenta 1305).
  - Recibos de caja / Comprobantes de ingreso cruzando saldos totales o abonos parciales.
  - Estado de cuenta de clientes y reporte de antigüedad de cartera (corriente, 30, 60, 90, 180+ días).

---

#### MÓDULO 4: Tesorería, Flujo de Caja & Conciliación Bancaria
> *El control milimétrico del dinero real: efectivo en caja y cuentas bancarias.*

- **Catálogo de Cajas y Cuentas Bancarias:**
  - Cajas Principales y Cajas Menores con fondo fijo y arqueos de caja periódicos.
  - Cuentas Bancarias (Corrientes y de Ahorros) vinculadas a sus respectivas cuentas auxiliares NIIF (111005, 111010).
- **Operaciones de Tesorería:**
  - **Traslados de Fondos:** Movimientos entre caja y bancos o entre cuentas bancarias (sin afectar pérdidas y ganancias).
  - **Reembolso y Legalización de Caja Menor:** Comprobante de gastos menores con soporte de terceros y retenciones aplicadas.
  - **Control de Cheques y Transferencias:** Cheques girados y no cobrados, transferencias electrónicas pendientes.
- **Conciliación Bancaria Automática y Asistida:**
  - Importación de extractos bancarios oficiales (formatos Excel, CSV o texto plano bancario estándar: Bancolombia, Davivienda, BBVA, etc.).
  - Motor de cruce automático: Coincidencia por fecha, valor y número de referencia/comprobante.
  - Partidas conciliatorias: Identificación de notas débito (comisiones bancarias, 4x1000 GMF - Cuenta 5115), notas crédito (intereses ganados) y cheques en tránsito.
- **Proyección de Flujo de Caja:** Flujo de caja real vs presupuestado a 30, 60 y 90 días basado en los vencimientos de CxP y CxC.

---

#### MÓDULO 5: Autenticación, Tenancy & Control de Acceso RBAC (Ya Construido 100%)
- Entidades `core_usuarios` y `core_usuarios_empresas` (Relación $N:M$ con rol por tenant).
- Hashing criptográfico con `bcrypt` (salt 10+). Tokens JWT firmados con contexto multi-tenant.
- Roles nativos: `SUPER_ADMIN`, `ADMIN_EMPRESA`, `CONTADOR_LIDER`, `AUXILIAR_CONTABLE`, `AUDITOR_CONSULTA`.
- Protección contextual con `@Roles()` y `RolesGuard` evaluando `x-empresa-id`.

---

#### MÓDULO 6: Catálogo de Ítems, Inventarios & Kardex Paramétrico Universal (NIC 2 / DUR 2420)
> *Modelo agnóstico y flexible que se adapta a cualquier actividad económica (comercio, servicios, manufactura, retail).*

- **Tipología Universal de Ítems / Catálogo:**
  - `SERVICIO` (Sin inventario físico: corte de cabello, asesoría contable, mano de obra mecánica, transporte). Imputación directa: Venta `4155/4170` vs Costo directo `6155` o gasto.
  - `PRODUCTO_SIMPLE` (Venta unitaria por código o código de barras: cuadernos, bolígrafos, herramientas, lubricantes). Cuenta `1435`.
  - `PRODUCTO_FRACCIONABLE_GRANEL` (Venta por peso, longitud o volumen: carnicería por kilos/libras, ferretería por metros de cable, tornillos por libra, telas).
  - `MATERIA_PRIMA_TRANSFORMACION` (Ingredientes o insumos que se consumen para producir: harina, azúcar, carne cruda, pintura). Cuenta `1405`.
  - `PRODUCTO_TERMINADO` (El resultado de la transformación: tortas, platos preparados, muebles armados). Cuenta `1430`.
  - `PRODUCTO_SERIALIZADO` (Trazabilidad única por unidad: electrodomésticos, maquinaria, motos, celulares con IMEI/Serial).
  - `PRODUCTO_PERECEDERO_LOTE` (Control de fechas de caducidad y lotes: carnes, lácteos, medicamentos, alimentos).
- **Atributos Parametrizables por Tenant / Industria:**
  - **Unidades de Medida:** Unidad (`UND`), Kilogramo (`KG`), Gramo (`GR`), Metro (`MTR`), Litro (`LTR`), Galón (`GL`), Caja (`CJ`), Hora de Servicio (`HRS`).
  - **Conversión de Unidades:** Comprar en bulto de 50 kg y vender por libras/kilos; comprar rollo de 100 m y vender por metros.
  - **Reglas Tributarias por Ítem:**
    - Tarifa de IVA asociada: Excluido, Exento (0%), 5%, 19%.
    - Impuesto Nacional al Consumo (INC 8% para restaurantes y cafeterías).
- **Kardex Permanente Valorado:**
  - Valuación automática bajo norma legal: **Promedio Ponderado** o **PEPS (FIFO)**.
  - Entradas por compras a proveedores, salidas automáticas por facturación de venta, mermas/desperdicios justificados y traslados entre bodegas/sucursales.
  - **Asiento Automático de Costo:**
    $$\text{Débito 61 (Costo de Ventas)} \quad \longleftrightarrow \quad \text{Crédito 14 (Salida de Inventarios)}$$
    *(Si el ítem es de tipo `SERVICIO`, no afecta inventario físico y no mueve la cuenta 14).*

---

#### MÓDULO 7: Nómina Electrónica & Seguridad Social (DIAN / UGPP)
> *Con todos los fierros para la legislación laboral colombiana.*

- **Contratos Laborales:** Término fijo, indefinido, obra o labor, aprendizaje Sena.
- **Estructura Salarial:** Salario básico, Auxilio de transporte legal, horas extras (diurnas, nocturnas, festivas), recargos, comisiones y bonificaciones salariales/no salariales.
- **Deducciones de Ley:** Salud (4%), Pensión (4%), Fondo de Solidaridad Pensional (1%-2%), Retención en la fuente por salarios (Procedimiento 1 / 2), préstamos y embargos.
- **Aportes Patronales (Seguridad Social & Parafiscales):** Salud patronal (exoneración Art. 114-1 E.T.), Pensión patronal (12%), ARL (Riesgos I a V), SENA, ICBF, Caja de Compensación (4%).
- **Provisiones Prestacionales NIIF:** Cesantías (8.33%), Intereses sobre cesantías (1%), Prima de servicios (8.33%), Vacaciones (4.17%).
- **Contabilización Automática del Devengo y Pago:**
  - Débito a Gastos de Personal (5105 / 5205 / 7205 Mano de obra directa en panadería).
  - Crédito a Salarios por pagar (2505), Seguridad Social por pagar (2370) y Retenciones de nómina (236505).
- **Emisión de XML Nómina Electrónica:** Generación del CUNE y transmisión a la DIAN.

---

#### MÓDULO 8: Activos Fijos & Propiedad, Planta y Equipo (NIC 16 / NIIF)
> *Control patrimonial con depreciación, deterioro y mantenimiento.*

- **Ficha Técnica del Activo:**
  - Código de placa / código de barras.
  - Fecha de adquisición, proveedor y factura de compra.
  - Centro de costos, ubicación física y responsable asignado.
  - Valor de adquisición, Valor residual / de salvamento y Vida útil estimada (en meses o unidades de producción).
- **Categorías NIIF:**
  - Terrenos (no depreciables).
  - Edificaciones y locales.
  - Maquinaria y equipo (hornos de panadería, rampas de taller de motos).
  - Equipo de computación y comunicación.
  - Flota y equipo de transporte.
- **Motor de Depreciación Automática Mensual:**
  - Métodos: Línea recta, suma de dígitos o unidades producidas.
  - Proceso de cierre mensual automático:
    $$\text{Débito 5160 / 5260 (Gasto Depreciación)} \quad \longleftrightarrow \quad \text{Crédito 1592 (Depreciación Acumulada)}$$
- **Baja y Venta de Activos Fijos:**
  - Cálculo de la utilidad o pérdida en venta de activo fijo (comparando valor en libros vs precio de venta).
  - Retiro por obsolescencia o daño irreparable.

---

#### MÓDULO 9: Reportes Financieros NIIF & Exportaciones Oficiales
- **Balance de Comprobación:** Sumas y saldos a cualquier nivel del PUC (Clase, Grupo, Cuenta, Subcuenta, Auxiliar).
- **Estado de Situación Financiera (Balance General):** Activo = Pasivo + Patrimonio clasificado en Corriente y No Corriente.
- **Estado de Resultados Integral (P&G):** Ingresos operacionales, Costo de ventas, Utilidad bruta, Gastos operacionales, EBITDA y Utilidad neta.
- **Libros Oficiales:** Diario Columnario, Mayor y Balances, Libro de Inventarios y Balances.
- **Certificados Tributarios:** Certificados de Retención en la Fuente en PDF con firma digital del contador.
- **Exportación Estructurada:** Excel con fórmulas y JSON/CSV para medios magnéticos DIAN.

---

### 4. 🗺️ Plan Maestro de Ejecución (Fases Estratégicas)

```mermaid
flowchart TD
    Fase1["Fase 1 (Completada): Cimientos\nCore Ledger NIIF + Motor Tributario + Auth RBAC + Web Base"]
    Fase2["Fase 2: Operación Contable Manual en Web\nFormularios de Asientos de Diario, Causación CxP y Pagos EGR"]
    Fase3["Fase 3: Facturación Comercial & POS\nFacturas de Venta Propias, Impoconsumo 8%, IVA y Tiras POS"]
    Fase4["Fase 4: Inventarios & Kardex Permanente\nArtículos, Bodegas, Chasis/Motor y Costeo Automático 61 vs 14"]
    Fase5["Fase 5: Tesorería & Conciliación Bancaria\nCajas Menores, Arqueos, Cuentas y Cruce de Extractos Bancarios"]
    Fase6["Fase 6: Reportes Financieros NIIF\nBalance de Comprobación, P&G, Certificados PDF y Excel"]
    Fase7["Fase 7: Activos Fijos NIIF\nFichas de Placas, Depreciación Mensual Automática y Bajas"]
    Fase8["Fase 8: Nómina Electrónica & UGPP\nContratos, Devengos, Seguridad Social, Parafiscales y DIAN"]

    Fase1 --> Fase2
    Fase2 --> Fase3
    Fase3 --> Fase4
    Fase4 --> Fase5
    Fase5 --> Fase6
    Fase6 --> Fase7
    Fase7 --> Fase8
```

| Fase | Alcance Central | Beneficio para el Negocio |
| :---: | :--- | :--- |
| **Fase 1 (Hecha)** | Core Ledger NIIF, Motor Tributario, Ingesta API/Webhooks, RBAC Multi-tenant y Web Base. | Cimientos arquitectónicos sólidos y seguros. |
| **Fase 2 (Inmediata)** | **Operación Contable Web Manual:** Formularios interactivos para digitar comprobantes contables con partida doble, causar compras y registrar pagos/egresos directamente desde el navegador. | El contador ya puede operar el 100% de la contabilidad sin depender de APIs. |
| **Fase 3** | **Facturación Comercial & POS:** Generación propia de facturas de venta, facturación rápida de mostrador / tiras POS con propinas e impuesto al consumo (INC 8%), notas crédito y cartera. | La panadería o almacén emite sus ventas directas al cliente. |
| **Fase 4** | **Inventarios & Kardex Permanente:** Catálogo de artículos (materias primas, motos con serial/chasis, repuestos), movimientos de almacén y costeo automático de ventas (61 vs 14). | Maneja la panadería (harina/recetas) y el almacén de motos (chasis/repuestos). |
| **Fase 5** | **Tesorería & Conciliación Bancaria:** Cajas menores, arqueos de efectivo, control de cuentas bancarias y motor de conciliación automática contra extractos oficiales. | Control milimétrico de la plata real en bancos y cajas. |
| **Fase 6** | **Reportes Financieros NIIF:** Balance de Comprobación, Estado de Situación Financiera, Estado de Resultados (P&G), Certificados de Retención PDF y Excel. | Cumplimiento legal, bancos, socios y DIAN. |
| **Fase 7** | **Activos Fijos NIIF:** Ficha de activos, cálculo de depreciación mensual automática (1592 vs 5160), control de vidas útiles y bajas de bienes. | Control patrimonial de hornos, motos de reparto y maquinaria. |
| **Fase 8** | **Nómina Electrónica & Seguridad Social:** Liquidación de salarios, horas extras, prestaciones sociales, aportes a EPS/Pensión/ARL y XML para la DIAN. | Liquidación y deducción legal del personal con causación contable. |

---

### 5. 💡 Conclusión y Alineación

Esta es la visión completa, integral y sin atajos: **un ERP contable universal que no le tiene miedo a ninguna industria** porque tiene su lógica modularizada, su partida doble matemática inquebrantable y su doble canal (humano en web + máquinas vía API).

