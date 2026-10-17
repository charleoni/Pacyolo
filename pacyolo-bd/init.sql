-- =========================================================================
-- PACYOLO CONTABLE - SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Base de Datos: pacyolo_dev
-- =========================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Esquema core
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS contabilidad;

COMMENT ON SCHEMA core IS 'Esquema para entidades organizacionales, empresas (tenants), usuarios y configuración';
COMMENT ON SCHEMA contabilidad IS 'Esquema para el motor contable NIIF: PUC, asientos, líneas, impuestos y cierres';
