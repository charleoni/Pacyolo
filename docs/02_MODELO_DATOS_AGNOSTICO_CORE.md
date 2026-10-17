# 🗄️ PACYOLO — Modelo de Datos Agnóstico Core
## Documento de Análisis: Entidades, Relaciones y Partida Doble

*Versión:* 1.0.0 (Fase de Análisis)  
*Fecha:* Octubre 2026  
*Estado:* Arquitectura Aprobada en Análisis  

---

## 1. Principio Rector del Modelo

El modelo de datos de **PACYOLO** está concebido bajo el principio de **desacoplamiento total de la industria**. Toda la estructura gira alrededor de la contabilidad NIIF universal: **Terceros, Cuentas, Comprobantes e Impuestos**.

Cualquier dato específico del negocio externo (ej: una mesa de restaurante, una habitación de hotel, o una casa/apartamento de un conjunto residencial) se desacopla a nivel del Core y se preserva únicamente como metadato de trazabilidad: `origen_sistema`, `origen_entidad` y `origen_id`.

---

## 2. Diagrama de Relaciones Core (ERD Conceptual)

```
┌────────────────────┐
│      EMPRESA       │ (Tenant / NIT)
│ (Configuraciones)  │
└─────────┬──────────┘
          │ 1:N
          ├───────────────────────────────┬───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
┌────────────────────┐          ┌────────────────────┐          ┌────────────────────┐
│     PUC_CUENTA     │          │      TERCERO       │          │    CENTRO_COSTO    │
│  (Árbol NIIF)      │          │ (Clientes/Prov/Emp)│          │   (Sedes/Proyectos)│
└─────────┬──────────┘          └─────────┬──────────┘          └─────────┬──────────┘
          │                               │                               │
          │ 1:N                           │ 1:N                           │ 1:N
          └─────────────────────┐         │         ┌─────────────────────┘
                                │         │         │
                                ▼         ▼         ▼
┌────────────────────┐       ┌────────────────────────┐
│      ASIENTO       │ 1:N   │     ASIENTO_LINEA      │
│ (Cabecera Comprob) ├───────►  (Partida Doble NIIF)  │
│  Consecutivo, Tipo │       │  Débito / Crédito /    │
│  Estado, Auditoría │       │  Base Impuesto / Glosa │
└────────────────────┘       └────────────────────────┘
```

---

## 3. Especificación Detallada de Tablas y Entidades

### 3.1. `core_empresas` (Tenants / Entorno de la Organización)
Representa a cada una de las personas jurídicas o naturales que llevan su contabilidad en el sistema.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único del tenant. |
| `nit` | VARCHAR(20) | Número de Identificación Tributaria (con dígito de verificación). |
| `razon_social` | VARCHAR(255) | Nombre oficial o comercial de la empresa. |
| `regimen_tributario` | ENUM | `SIMPLIFICADO`, `COMUN`, `GRAN_CONTRIBUYENTE`, `AUTORRETENEDOR`. |
| `codigo_actividad_ciiu` | VARCHAR(10) | Código CIIU principal para cálculo de tarifas de ReteICA. |
| `moneda` | VARCHAR(3) | Código ISO (Default: `COP`). |
| `modo_contabilizacion_integracion` | ENUM | `INMEDIATA` o `REVISION_PREVIA`. Determina si eventos externos se asientan al instante o van a bandeja de revisión. |
| `api_key_integracion` | VARCHAR(128) | Token seguro para que los sistemas externos autentiquen su envío de transacciones. |
| `webhook_notificaciones_url`| VARCHAR(255) | Endpoint externo al que PACYOLO notifica cuando un comprobante es aprobado o rechazado. |
| `activo` | BOOLEAN | Estado de la suscripción del tenant. |

---

### 3.2. `core_terceros` (Directorio Unificado)
Cualquier persona natural o jurídica con la que la empresa interactúa financieramente (cliente, proveedor, contratista, empleado, socio, residente, copropietario).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `empresa_id` | UUID (FK) | Tenant al que pertenece. |
| `tipo_documento` | ENUM | `CC`, `NIT`, `CE`, `PASAPORTE`, `TI`. |
| `numero_documento` | VARCHAR(30) | Número de documento sin puntos ni guiones. |
| `digito_verificacion` | VARCHAR(1) | Para personas jurídicas con NIT. |
| `nombre_completo` | VARCHAR(255) | Razón social o nombres y apellidos. |
| `email` | VARCHAR(150) | Correo electrónico para envío de certificados de retención y facturación. |
| `telefono` | VARCHAR(50) | Teléfono de contacto. |
| `direccion` | VARCHAR(255) | Dirección fiscal. |
| `municipio_codigo` | VARCHAR(10) | Código DANE para cruces de ICA municipal. |
| `responsabilidades_rut` | JSONB | Códigos de responsabilidades fiscales (ej. R-48, R-49, etc.). |
| `es_cliente` | BOOLEAN | Flag auxiliar para filtros en UI. |
| `es_proveedor` | BOOLEAN | Flag auxiliar para filtros en UI. |
| `es_empleado` | BOOLEAN | Flag auxiliar para filtros en UI. |

---

### 3.3. `cont_puc_cuentas` (Plan Único de Cuentas NIIF Dinámico)
Estructura en árbol jerárquico que modela el catálogo de cuentas de cada empresa.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `empresa_id` | UUID (FK) | Tenant al que pertenece. |
| `codigo` | VARCHAR(20) | Código de la cuenta (ej. `11050501`). Único por empresa. |
| `nombre` | VARCHAR(200) | Nombre oficial de la cuenta (ej. "Caja General Sucursal Norte"). |
| `nivel` | INTEGER | Nivel en la jerarquía: 1 (Clase), 2 (Grupo), 4 (Cuenta), 6 (Subcuenta), 8 (Auxiliar). |
| `clase` | ENUM | `ACTIVO`, `PASIVO`, `PATRIMONIO`, `INGRESO`, `GASTO`, `COSTO`. |
| `naturaleza` | ENUM | `DEBITO` o `CREDITO`. |
| `padre_id` | UUID (FK, Null) | Referencia a la cuenta de nivel superior inmediato. |
| `permite_movimiento` | BOOLEAN | `true` solo para cuentas auxiliares (último nivel). Las cuentas de niveles superiores solo acumulan. |
| `exige_tercero` | BOOLEAN | Si es `true`, no se permite asentar una línea en esta cuenta sin un `tercero_id`. |
| `exige_centro_costo` | BOOLEAN | Si es `true`, obliga a especificar un `centro_costo_id`. |
| `es_cuenta_banco` | BOOLEAN | Marca si la cuenta corresponde a una entidad financiera o caja menor sujeta a conciliación. |

---

### 3.4. `cont_asientos` (Cabecera de Comprobante Contable)
Representa el comprobante de contabilidad oficial (Ingreso, Egreso, Facturación, Nota Contable, Cierre).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `empresa_id` | UUID (FK) | Tenant al que pertenece. |
| `tipo_comprobante` | ENUM | `INGRESO`, `EGRESO`, `FACTURACION_VENTA`, `FACTURACION_COMPRA`, `NOTA_CONTABLE`, `CIERRE`. |
| `consecutivo` | INTEGER | Número secuencial ininterrumpido por tipo de comprobante dentro del tenant. |
| `numero_comprobante` | VARCHAR(50) | Formato visible formateado (ej. `ING-000421`, `EGR-000105`, `DIA-000088`). |
| `fecha` | DATE | Fecha contable del hecho económico. |
| `glosa_general` | TEXT | Descripción o concepto general de la transacción. |
| `estado` | ENUM | `BORRADOR`, `REVISION_INTEGRACION`, `CONTABILIZADO`, `ANULADO`. |
| **Metadatos de Integración** | | |
| `origen_sistema` | VARCHAR(50) | Nombre del sistema emisor (ej. `'CONJUNTOS_PH'`, `'POS_REST'`, `'MANUAL'`). |
| `origen_documento_tipo` | VARCHAR(50) | Tipo de documento en el sistema de origen (ej. `'CUOTA'`, `'TICKET_VENTA'`, `'PAGO'`). |
| `origen_documento_id` | VARCHAR(100)| ID del registro en el software externo (permite idempotencia y evitar duplicados). |
| `reversado_por_asiento_id`| UUID (FK, Null)| Si este comprobante fue anulado, apunta al asiento de reversión. |
| `usuario_id` | UUID (FK, Null) | Usuario humano que creó o aprobó el comprobante (null si fue API automática). |
| `created_at` | TIMESTAMPTZ | Fecha y hora exacta de registro. |

---

### 3.5. `cont_asiento_lineas` (Detalle de Movimientos / Partida Doble)
Cada línea de débito o crédito que compone el comprobante contable.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único de la línea. |
| `asiento_id` | UUID (FK) | Referencia a la cabecera del asiento. |
| `cuenta_id` | UUID (FK) | Cuenta auxiliar del PUC afectada. |
| `tercero_id` | UUID (FK, Null) | Tercero asociado al movimiento. |
| `centro_costo_id` | UUID (FK, Null) | Centro de costo o proyecto imputado. |
| `debito` | DECIMAL(16,2) | Valor al Debe (0 si es crédito). |
| `credito` | DECIMAL(16,2) | Valor al Haber (0 si es débito). |
| `base_impuesto` | DECIMAL(16,2) | Base monetaria sobre la cual se calculó la retención o el IVA (si aplica). |
| `glosa_detalle` | VARCHAR(255) | Nota explicativa específica de este renglón. |
| `referencia_externa` | VARCHAR(100) | Metadato adicional (ej. número de factura del proveedor, número de cheque). |

> 🔒 **Restricción de Integridad Inviolable (Check Constraint a nivel de BD / Servicio):**  
> `debito >= 0 AND credito >= 0 AND (debito > 0 OR credito > 0)`  
> Un comprobante solo puede pasar a estado `CONTABILIZADO` si `SUM(debito) == SUM(credito)`.

---

### 3.6. `cont_plantillas_mapeo` (El Motor de Traducción de Interfaces)
Permite a cada empresa configurar cómo se deben traducir los eventos del mundo operativo exterior en cuentas del PUC.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `empresa_id` | UUID (FK) | Tenant al que pertenece. |
| `codigo_evento` | VARCHAR(50) | Nombre del evento operativo (ej. `VENTA_SERVICIOS`, `RECAUDO_BANCO`, `COMPRA_INVENTARIO`). |
| `descripcion` | VARCHAR(255) | Explicación para el contador en la UI. |
| `cuenta_debito_id` | UUID (FK) | Cuenta auxiliar por defecto al Debe. |
| `cuenta_credito_id` | UUID (FK) | Cuenta auxiliar por defecto al Haber. |
| `aplica_retencion` | BOOLEAN | Indica si este evento detona análisis de retenciones. |

---

### 3.7. `cont_impuestos_reglas` (Configurador Dinámico de Retenciones e Impuestos)
Reglas tributarias colombianas (Retefuente, ReteICA, ReteIVA, IVA generado y descontable).

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `empresa_id` | UUID (FK) | Tenant al que pertenece. |
| `tipo_impuesto` | ENUM | `RETEFUENTE`, `RETEICA`, `RETEIVA`, `IVA`. |
| `nombre` | VARCHAR(100) | Nombre visible (ej. "Retefuente Servicios Generales 4%"). |
| `porcentaje` | DECIMAL(5,4) | Tarifa porcentual (ej. `0.0400` para 4%). |
| `base_minima` | DECIMAL(14,2) | Valor en pesos a partir del cual se aplica (ej. $188.000 COP). Si el subtotal es menor, no retiene. |
| `cuenta_puc_pasivo_id` | UUID (FK) | Cuenta del pasivo donde se acredita el valor retenido (ej. `236525`). |
| `cuenta_puc_activo_id` | UUID (FK, Null) | Para anticipos o autorretenciones si aplica (ej. `135515`). |

---

### 3.8. `cont_periodos` (Cierres y Bloqueo de Períodos)
Garantiza el cumplimiento legal del Código de Comercio y NIIF sobre inalterabilidad de los libros.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único. |
| `empresa_id` | UUID (FK) | Tenant al que pertenece. |
| `anio` | INTEGER | Año fiscal (ej. `2026`). |
| `mes` | INTEGER | Mes del año (1 a 12). |
| `estado` | ENUM | `ABIERTO`, `CERRADO`. |
| `fecha_cierre` | TIMESTAMPTZ | Momento en que el contador efectuó el cierre. |
| `cerrado_por_usuario_id`| UUID (FK) | Usuario responsable del cierre. |

> 🚫 Si un período está en estado `CERRADO`, el sistema rechaza cualquier inserción, modificación o anulación de comprobantes con fecha dentro de ese mes.
