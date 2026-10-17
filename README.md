# 📘 PACYOLO — Sistema Contable Universal & Motor Integrable

PACYOLO es un sistema contable moderno, multi-empresa y agnóstico a la industria, diseñado bajo la normatividad contable y fiscal colombiana (NIIF para Pymes y Microempresas / DUR 2420).

## 🚀 Enfoque del Proyecto
1. **Software Contable Autónomo (SaaS para Contadores):** Plataforma web para que contadores y empresas lleven su contabilidad oficial (PUC, Libro Diario, Comprobantes, Terceros con NIT/RUT, Impuestos y Retenciones, Balances y Estados Financieros).
2. **Motor Contable Integrable (API-First Headless Engine):** Expone interfaces REST API y Webhooks para que cualquier sistema externo (verticales como *ConjuntOS*, sistemas POS, tiendas e-commerce o facturación) envíe sus transacciones operativas y delegue la causación contable legal en PACYOLO.

## 📂 Documentación del Proyecto
Toda la arquitectura y especificación técnica se encuentra en la carpeta [`docs/`](./docs):
- [01_VISION_Y_ARQUITECTURA_GENERAL.md](./docs/01_VISION_Y_ARQUITECTURA_GENERAL.md): Visión, modelo multi-tenant para contadores y modos de contabilización.
- [02_MODELO_DATOS_AGNOSTICO_CORE.md](./docs/02_MODELO_DATOS_AGNOSTICO_CORE.md): Modelo de datos NIIF (Empresas, Terceros, PUC, Asientos, Partida Doble).
- [03_INTERFACE_INTEGRACION_API.md](./docs/03_INTERFACE_INTEGRACION_API.md): Especificación de contratos JSON de la API de integración externa.
- [04_PLAN_EXTRACCION_Y_REFACTORIZACION.md](./docs/04_PLAN_EXTRACCION_Y_REFACTORIZACION.md): Mapeo de extracción de componentes desde Conjuntos.
- [SPRINT_ACTIVO.md](./docs/SPRINT_ACTIVO.md): Tablero de sprint activo y control diario de tareas.

## 🌿 Estrategia de Ramas en Git
- `main`: Código estable, probado y evaluado.
- `develop`: Rama de integración de módulos.
- `sprint/XX-nombre`: Rama de desarrollo del sprint en curso (commits diarios).
