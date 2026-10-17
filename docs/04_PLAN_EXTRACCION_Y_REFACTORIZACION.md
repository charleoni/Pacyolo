# 🚚 PACYOLO — Plan de Extracción y Refactorización desde Conjuntos
## Documento de Análisis: Inventario de Reutilización, Limpieza y Adaptación

*Versión:* 1.0.0 (Fase de Análisis)  
*Fecha:* Octubre 2026  
*Estado:* Arquitectura Aprobada en Análisis  

---

## 1. Objetivo del Plan

Aprovechar las miles de horas de ingeniería ya invertidas en el proyecto `Conjuntos` para transferir su núcleo contable hacia `PACYOLO`, eliminando de raíz todo acoplamiento a propiedad horizontal (unidades, torres, coeficientes, zonas comunes) para obtener un sistema contable 100% puro y multi-empresa.

---

## 2. Matriz de Reutilización de Componentes

### 2.1. Backend (NestJS + TypeORM + PostgreSQL)

| Componente Origen en Conjuntos | Destino en PACYOLO | Nivel de Reutilización | Tarea de Limpieza / Adaptación Requerida |
| :--- | :--- | :---: | :--- |
| `src/contabilidad/asientos.service.ts` | `src/core-ledger/services/journal.service.ts` | **90%** | Reemplazar `conjunto_id` por `empresa_id`. Eliminar cualquier inyección de `unidadesService`. Mantener la validación estricta de partida doble y generación de consecutivos (`ING`, `EGR`, `DIA`). |
| `src/contabilidad/entities/asiento.entity.ts` | `src/core-ledger/entities/asiento.entity.ts` | **85%** | Incorporar campos de integración (`origen_sistema`, `origen_documento_id`, `origen_documento_tipo`). El campo `estado` ahora incluye `REVISION_INTEGRACION`. |
| `src/contabilidad/entities/puc.entity.ts` & `puc.service.ts` | `src/puc/entities/puc.entity.ts` & `puc.service.ts` | **95%** | La estructura jerárquica de 5 niveles ya es universal. Reemplazar `conjunto_id` por `empresa_id`. |
| `src/contabilidad/seeds/puc-default.seed.ts` | `src/puc/seeds/puc-colombia-niif.seed.ts` | **80%** | Generalizar los nombres de cuentas específicas de PH (ej: cambiar `4175 Cuotas de Administración` por `4135 Comercio / 4175 Servicios Generales`, y `1120 Fondo de Imprevistos` por `1120 Fondos con Destinación Específica / Inversiones`). |
| `src/contabilidad/entities/tercero.entity.ts` & `terceros.service.ts` | `src/terceros/entities/tercero.entity.ts` & `terceros.service.ts` | **95%** | Mantener RUT, tipo de documento, régimen y validación de dígito de verificación. Desvincular de la tabla `usuarios` residenciales para que sean entidades financieras puras. |
| `src/contabilidad/services/impuestos.service.ts` & `impuesto.entity.ts` | `src/impuestos/services/impuestos.service.ts` | **90%** | Conservar la lógica de bases mínimas y porcentajes dinámicos de Retefuente, ReteICA e IVA. |
| `src/contabilidad/services/contabilidad-reports.service.ts` | `src/reportes/services/reports.service.ts` | **90%** | Lógica de agregación para Balance de Comprobación, Balance General NIIF y Estado de Resultados (PyG). Solo cambia el tenant filter. |
| `src/contabilidad/generators/comprobante-pdf.generator.ts` | `src/reportes/generators/voucher-pdf.generator.ts` | **85%** | Parametrizar el encabezado del PDF con el logo, NIT y razón social de la `Empresa` seleccionada. |
| `src/financiero/dian-invoicing.service.ts` | `src/dian/services/dian-electronic-invoice.service.ts` | **80%** | Desacoplar del generador de cuotas y conectarlo al módulo de facturas de venta universal. |

---

### 2.2. Frontend Web (Angular)

| Pantalla / Componente en Conjuntos | Destino en PACYOLO | Tarea de Adaptación en UI |
| :--- | :--- | :--- |
| `pages/explorador-puc/` | `src/app/puc/pages/explorador-puc/` | El árbol interactivo se mantiene idéntico. Se añade selector para crear cuentas auxiliares y configurar banderas (`exige_tercero`, `exige_centro_costo`). |
| `pages/comprobantes/` (Libro Diario) | `src/app/asientos/pages/libro-diario/` | Mantener la tabla con filtros por fecha, tipo y número. Añadir pestaña/filtro: **"Borradores de Integración por Revisar"**. |
| `components/comprobante-detail-modal/` | `src/app/asientos/components/comprobante-modal/` | Visor de partida doble. Agregar botón **"Aprobar y Contabilizar"** cuando el asiento está en revisión. |
| `pages/directorio-terceros/` | `src/app/terceros/pages/directorio-terceros/` | Directorio con búsqueda por NIT/Nombre y filtros por rol (Cliente, Proveedor, Empleado). |
| `pages/impuestos-config/` | `src/app/impuestos/pages/impuestos-config/` | Panel de parametrización de tarifas y bases mínimas de retención. |
| `pages/reporte-balance/` & `reporte-pyg/` | `src/app/reportes/pages/` | Generadores de estados financieros con selector de fechas, comparativos y exportación a PDF/Excel. |
| **Nuevo:** Selector de Tenant / Empresa | `src/app/layout/components/tenant-selector/` | Dropdown superior donde el contador cambia de empresa con un clic, recargando instantáneamente el contexto. |

---

## 3. Plan de Limpieza Arquitectónica (De-coupling Checklist)

Antes de mover código a PACYOLO, se aplicarán estas 4 reglas de purificación:

1. ❌ **Cero referencias a inmuebles:**  
   Buscar y erradicar cualquier ocurrencia de `unidad_id`, `bloque_id`, `coeficiente` o `copropietario`. Todo movimiento contable apunta a `tercero_id`.
2. ❌ **Cero tablas ajenas a la contabilidad:**  
   No migrar nada relativo a portería, asambleas, mascotas, vehículos, tickets PQR, reservas ni visitantes.
3. 🔄 **Reemplazo del contexto de Tenant:**  
   Sustituir `conjunto_id` por `empresa_id` transversalmente en todas las tablas y servicios.
4. 🔌 **Creación del Gateway de Integración:**  
   Crear el nuevo controlador `src/integracion/controllers/integracion.controller.ts` para recibir los payloads JSON documentados en el documento `03_INTERFACE_INTEGRACION_API.md`.

---

## 4. Hoja de Ruta Ejecutiva (Fase de Análisis a Construcción)

Con una dedicación estimada de **2 horas diarias**, la ejecución se divide en 4 sprints claros:

```
Sprint 1 (Semanas 1-2):
- Inicializar repositorio limpio en C:\proyectos\PACYOLO (NestJS Backend + Angular Web).
- Migración y depuración de entidades base: Empresa (Tenant), Tercero, PUC, Asientos.
- Script Seed del PUC NIIF Colombia estándar.

Sprint 2 (Semanas 3-4):
- Implementación del Motor de Partida Doble (Journal Service) con consecutivos.
- Implementación del Motor de Impuestos y Retenciones automáticas.
- API REST interna para creación manual de comprobantes.

Sprint 3 (Semanas 5-6):
- Implementación de la Interfaz de Integración Externa (Endpoints de Facturas, Pagos y Gastos).
- Lógica del parámetro: INMEDIATA vs REVISION_PREVIA.
- Mecanismo de Idempotencia y Notificaciones Webhook.

Sprint 4 (Semanas 7-8):
- Migración y ensamble del Frontend Angular (Explorador PUC, Libro Diario, Terceros, Reportes).
- Integración del Selector Multi-Empresa para el Contador.
- Pruebas E2E conectando el proyecto Conjuntos como el "Primer Cliente Externo" de PACYOLO.
```
