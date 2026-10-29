# Reglas y Estándares de Desarrollo del Proyecto PACYOLO

## 1. Patrón Obligatorio de Interfaz: Búsquedas y Catálogos de Alto Volumen (Enterprise Lookup Pattern)
- **Prohibición de `<select>` Tradicionales para Entidades Maestras**: NUNCA utilizar `<select>` nativos de HTML o dropdowns simples para entidades maestras con volumen medio o alto (ej. **Artículos/Inventario**, **Terceros/Proveedores/Clientes**, **Cuentas PUC**, **Centros de Costo**). Un select con cientos o miles de opciones degrada el rendimiento del navegador y ofrece pésima experiencia de usuario.
- **Estándar Obligatorio: Modal de Búsqueda Avanzada (Lookup Modal)**:
  - En el formulario principal: Mostrar un contenedor o chip visual con la entidad seleccionada (ej. `[NIT 900.123.456] Ferretería Central S.A.S.`) y un botón claro `🔍 Cambiar` o `🔍 Seleccionar Proveedor/Artículo`.
  - En el modal de búsqueda:
    - Campo de búsqueda instantáneo con autoenfoque (`autofocus`), filtrando en tiempo real por código, identificación/NIT, nombre, código de barras o categoría.
    - Tabla enriquecida con información contextual clave para evitar compras o registros erróneos (Stock disponible, Costo unitario, Tarifa IVA, Ciudad, Teléfono).
    - Selección rápida mediante clic, doble clic o tecla `Enter`.
    - En formularios de líneas o detalles (Órdenes de Compra, Entradas de Almacén, Traslados, Facturas), habilitar la **selección múltiple** para agregar varios artículos a la vez a la tabla.
    - Paginación o renderizado inteligente limitado a los primeros 40-50 resultados coincidentes para mantener 60 FPS fluidos sin importar si la base de datos tiene más de 50.000 registros.

## 2. Experiencia de Usuario, Notificaciones e Impresión Documental
- **Prohibición de Popups Nativos**: Queda estrictamente prohibido el uso de `window.alert()`, `window.confirm()` o `window.prompt()`.
- **Uso Exclusivo del Sistema Propio**: Toda notificación o confirmación debe realizarse a través del servicio centralizado `NotificationService` (`success`, `error`, `warning`, `info`, `confirm`) con modales y banners estilizados en Tailwind CSS acordes a la identidad visual del software.
- **Impresión y Exportación Formal de Documentos**:
  - Todo documento comercial o de control (Órdenes de Compra, Entradas de Almacén, Notas de Ajuste, Traslados, Comprobantes de Diario) debe contar con su función de **Vista Previa e Impresión formal membretada** (`window.print()` con CSS print optimizado o exportación PDF).
  - Debe incluir: Datos fiscales de la empresa emisora (Razón Social, NIT, Dirección, Teléfono), consecutivo oficial del documento, datos del tercero/proveedor, desglose de ítems, impuestos, condiciones de pago, y espacios formales de firma (Elaboró, Aprobó, Recibió).

## 3. Trazabilidad Estricta y Pistas de Auditoría (Audit Trail Obligatorio)
- **Registro Inmutable de Autoría**: Todo documento y transacción registrada en el sistema (Orden de Compra, Entrada de Almacén, Nota de Ajuste, Traslado, Asiento Contable, Causación CxP) DEBE registrar obligatoriamente:
  - `usuario_id` / `creado_por` (identificador y correo del usuario que ejecutó la acción).
  - Fecha y hora exacta (`created_at`).
  - Registro de auditoría en la tabla `aud_pistas` o mediante `AuditoriaService`.
- **No repudio**: Los documentos oficiales aprobados o causados contablemente no deben poder alterarse de forma destructiva; cualquier modificación requiere nota de ajuste, comprobante de anulación o reversión contable auditada.

## 4. Circuito Operativo y Contable de Abastecimiento (NIC 2 / NIIF)
- **Separación entre Compromiso Comercial, Recepción Física y Causación Financiera**:
  1. **Orden de Compra (`OC-XXXX`)**: Es un documento de compromiso comercial. No genera asiento contable ni altera el Kardex de inventario.
  2. **Recepción Física (Entrada de Almacén `EA-XXXX`)**: Se registra cuando la mercancía ingresa a la bodega. Afecta el stock por bodega y el Kardex NIIF bajo costo promedio ponderado móvil.
  3. **Manejo de Entregas Parciales**: Si una orden se entrega en varias partes con remisión, cada entrega actualiza la orden (`RECIBIDA_PARCIAL` o `RECIBIDA_TOTAL`).
  4. **Causación de Facturas y Pasivos (CxP)**:
     - El pasivo financiero **solo nace por lo efectivamente recibido y respaldado con factura**.
     - Si el proveedor factura cada entrega: Se causan facturas parciales por cada entrada de almacén.
     - Si el proveedor emite una factura global al final: Las entradas se reciben con remisión y la factura global se causa en CxP consolidando la orden recibida.

## 5. Modelo de Consultas y Reportes de Inventarios
- El sistema debe soportar en cualquier momento las consultas y reportes estándar de auditoría y revisoría fiscal:
  - **Existencias por Bodega**: Físico y Valorado (Stock actual, costo unitario, valor total del inventario).
  - **Kardex Integral NIIF**: Movimientos cronológicos detallados (Entradas, Salidas, Traslados, Ajustes, Costo promedio móvil resultante).
  - **Consulta Documental**: Búsqueda e inspección de cualquier documento fuente por consecutivo (`OC-XXXX`, `EA-XXXX`, `TR-XXXX`, `AJ-XXXX`, `CAU-XXXX`).

## 6. Principio de Gobernanza Contable Total: Los 4 Pilares de Todo Documento
- Todo documento operativo, comercial o de control que nazca en el sistema (Notas de Ajuste, Entradas de Almacén con causación, Traslados con impacto, Facturas, Recaudos, Pagos) DEBE satisfacer estrictamente los **4 Pilares Documentales**:
  1. **Contabilización Obligatoria**: PACYOLO es ante todo un ERP Contable. Todo hecho económico o variación patrimonial/física valorada DEBE generar automáticamente su Comprobante de Diario (`Asiento` + `AsientoLinea`) con estricta partida doble (Sumas Iguales: Débitos = Créditos) y vinculación bidireccional (`asiento_id`).
  2. **Impresión Formal Membretada**: Todo documento debe contar con vista previa e impresión formal (`window.print()` con CSS print optimizado o PDF) con datos fiscales de la empresa, consecutivo oficial, desglose de cuentas/ítems y firmas reglamentarias (Elaboró, Revisó, Aprobó).
  3. **Edición o Control de Anulación/Ajuste**: Debe poder consultarse y gestionarse; si está en estado borrador o preliminar se permite edición con campos inmutables protegidos; si ya está causado o aprobado, no puede eliminarse destructivamente, requiriendo anulación auditada o nota de ajuste.
  4. **Pistas de Auditoría Inmutables**: Registro estricto del usuario ejecutor (`usuario_id` / `creado_por`), timestamp inmutable y registro en bitácora de auditoría (`aud_pistas`).


## 7. Arquitectura Limpia y Principios de Código (Clean Architecture & SRP)
- **Principio de Responsabilidad Única (SRP)**:
  - Servicios de Dominio especializados: Cada servicio encapsula su lógica de negocio (Inventarios, Compras, CxP, Asientos, Parámetros) sin acoplamientos innecesarios.
  - Componentes Standalone Reactivos: Uso obligatorio de Angular Signals (`signal`, `computed`, `input`, `output`) para un flujo unidireccional de datos limpio, predecible y de alto rendimiento a 60 FPS sin sobrecargar la detección de cambios.
  - Reutilización Componentizada: Los patrones de interfaz recurrentes (Paginación con `TablePaginationComponent`, Búsquedas con `LookupModalComponent`, Visores de Impresión) deben ser componentes puros desacoplados.

## 8. Ciberseguridad, Aislamiento Multi-Tenant y Protección de Datos
- **Aislamiento Multi-Tenant Hermético**:
  - Toda consulta, mutación o filtro en base de datos DEBE estar parametrizada y restringida por el `empresa_id` del tenant activo en sesión. Ningún usuario puede consultar ni alterar datos de otra empresa bajo ninguna circunstancia.
- **Validación Fuerte de Datos (DTOs & Whitelisting)**:
  - Todo endpoint en el backend NestJS cuenta con DTOs fuertemente tipados utilizando decoradores de `class-validator` y `class-transformer` con `whitelist: true` y `forbidNonWhitelisted: true`, previniendo inyección de parámetros no autorizados (Mass Assignment).
- **Protección contra Inyecciones SQL**:
  - Prohibición estricta de concatenar strings en consultas SQL. Uso exclusivo de TypeORM Repositories con QueryBuilder parametrizado y consultas preparadas.
- **Control de Acceso Basado en Roles (RBAC)**:
  - Autenticación robusta con JSON Web Tokens (JWT) firmados, resguardo de contraseñas mediante hashing bcrypt con salt y validación granular mediante Guards (`JwtAuthGuard`, `RolesGuard`).
- **Inmutabilidad y Auditoría de Seguridad**:
  - Cada inserción, anulación o modificación sensible queda sellada con timestamp inmutable y el identificador del usuario que ejecutó la acción en la bitácora de auditoría (`aud_pistas`).
