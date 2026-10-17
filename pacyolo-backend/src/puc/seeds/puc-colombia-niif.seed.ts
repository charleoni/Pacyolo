import {
  NaturalezaCuenta,
  ClaseCuenta,
} from '../entities/puc.entity.js';

export interface PucSeedItem {
  codigo: string;
  nombre: string;
  nivel: number;
  clase: ClaseCuenta;
  naturaleza: NaturalezaCuenta;
  permite_movimiento: boolean;
  exige_tercero: boolean;
  es_cuenta_banco?: boolean;
  parent_codigo: string | null;
}

export const PUC_COLOMBIA_NIIF_SEED: PucSeedItem[] = [
  // ==========================================
  // CLASE 1: ACTIVO
  // ==========================================
  { codigo: '1', nombre: 'ACTIVO', nivel: 1, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: null },
  { codigo: '11', nombre: 'Efectivo y Equivalentes de Efectivo', nivel: 2, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1' },
  { codigo: '1105', nombre: 'Caja', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '11' },
  { codigo: '110505', nombre: 'Caja General', nivel: 6, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1105' },
  { codigo: '11050501', nombre: 'Caja General Principal', nivel: 8, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, es_cuenta_banco: true, parent_codigo: '110505' },
  { codigo: '110510', nombre: 'Cajas Menores', nivel: 6, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1105' },
  { codigo: '11051001', nombre: 'Fondo Fijo Caja Menor', nivel: 8, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, es_cuenta_banco: true, parent_codigo: '110510' },
  { codigo: '1110', nombre: 'Bancos', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '11' },
  { codigo: '111005', nombre: 'Moneda Nacional', nivel: 6, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1110' },
  { codigo: '11100501', nombre: 'Cuenta Corriente Bancaria', nivel: 8, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, es_cuenta_banco: true, parent_codigo: '111005' },
  { codigo: '11100502', nombre: 'Cuenta de Ahorros Bancaria', nivel: 8, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, es_cuenta_banco: true, parent_codigo: '111005' },

  { codigo: '13', nombre: 'Cuentas Comerciales por Cobrar y Otras', nivel: 2, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1' },
  { codigo: '1305', nombre: 'Clientes', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '13' },
  { codigo: '130505', nombre: 'Clientes Nacionales', nivel: 6, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1305' },
  { codigo: '13050501', nombre: 'Clientes Nacionales Operacionales', nivel: 8, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '130505' },
  { codigo: '1355', nombre: 'Anticipo de Impuestos y Contribuciones', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '13' },
  { codigo: '135515', nombre: 'Retención en la Fuente a Favor', nivel: 6, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '1355' },
  { codigo: '135518', nombre: 'Impuesto de Industria y Comercio Retenido (ReteICA)', nivel: 6, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '1355' },

  { codigo: '14', nombre: 'Inventarios', nivel: 2, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1' },
  { codigo: '1435', nombre: 'Mercancías no Fabricadas por la Empresa', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '14' },

  { codigo: '15', nombre: 'Propiedades, Planta y Equipo', nivel: 2, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '1' },
  { codigo: '1524', nombre: 'Equipo de Oficina', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '15' },
  { codigo: '1528', nombre: 'Equipo de Computación y Comunicación', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '15' },
  { codigo: '1592', nombre: 'Depreciación Acumulada', nivel: 4, clase: ClaseCuenta.ACTIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '15' },

  // ==========================================
  // CLASE 2: PASIVO
  // ==========================================
  { codigo: '2', nombre: 'PASIVO', nivel: 1, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: null },
  { codigo: '22', nombre: 'Proveedores', nivel: 2, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '2' },
  { codigo: '2205', nombre: 'Proveedores Nacionales', nivel: 4, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '22' },
  { codigo: '220505', nombre: 'Proveedores Nacionales Corrientes', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2205' },

  { codigo: '23', nombre: 'Cuentas Comerciales por Pagar y Otras', nivel: 2, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '2' },
  { codigo: '2335', nombre: 'Costos y Gastos por Pagar', nivel: 4, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '23' },
  { codigo: '233505', nombre: 'Honorarios por Pagar', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2335' },
  { codigo: '233510', nombre: 'Servicios de Vigilancia y Aseo por Pagar', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2335' },
  { codigo: '233525', nombre: 'Servicios Públicos por Pagar', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2335' },
  { codigo: '2365', nombre: 'Retención en la Fuente', nivel: 4, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '23' },
  { codigo: '236515', nombre: 'Retención por Honorarios', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2365' },
  { codigo: '236525', nombre: 'Retención por Servicios', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2365' },
  { codigo: '236540', nombre: 'Retención por Compras', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2365' },
  { codigo: '2368', nombre: 'Impuesto de Industria y Comercio Retenido (ReteICA)', nivel: 4, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '23' },

  { codigo: '24', nombre: 'Impuestos, Gravámenes y Tasas', nivel: 2, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '2' },
  { codigo: '2408', nombre: 'Impuesto sobre las Ventas por Pagar (IVA)', nivel: 4, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '24' },
  { codigo: '240801', nombre: 'IVA Generado en Ventas', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2408' },
  { codigo: '240802', nombre: 'IVA Descontable en Compras y Servicios', nivel: 6, clase: ClaseCuenta.PASIVO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '2408' },

  // ==========================================
  // CLASE 3: PATRIMONIO
  // ==========================================
  { codigo: '3', nombre: 'PATRIMONIO', nivel: 1, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: null },
  { codigo: '31', nombre: 'Capital Social', nivel: 2, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '3' },
  { codigo: '3105', nombre: 'Capital Suscrito y Pagado', nivel: 4, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '31' },
  { codigo: '33', nombre: 'Reservas', nivel: 2, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '3' },
  { codigo: '3305', nombre: 'Reservas Obligatorias / Fondos Legales', nivel: 4, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '33' },
  { codigo: '36', nombre: 'Resultados del Ejercicio', nivel: 2, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '3' },
  { codigo: '3605', nombre: 'Utilidad o Excedente del Ejercicio', nivel: 4, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '36' },
  { codigo: '3610', nombre: 'Pérdida o Déficit del Ejercicio', nivel: 4, clase: ClaseCuenta.PATRIMONIO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '36' },

  // ==========================================
  // CLASE 4: INGRESOS
  // ==========================================
  { codigo: '4', nombre: 'INGRESOS', nivel: 1, clase: ClaseCuenta.INGRESO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: null },
  { codigo: '41', nombre: 'Operacionales', nivel: 2, clase: ClaseCuenta.INGRESO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '4' },
  { codigo: '4135', nombre: 'Comercio al por Mayor y al por Menor', nivel: 4, clase: ClaseCuenta.INGRESO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '41' },
  { codigo: '4175', nombre: 'Prestación de Servicios y Actividades Conexas', nivel: 4, clase: ClaseCuenta.INGRESO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '41' },
  { codigo: '42', nombre: 'No Operacionales', nivel: 2, clase: ClaseCuenta.INGRESO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '4' },
  { codigo: '4210', nombre: 'Financieros (Intereses y Rendimientos)', nivel: 4, clase: ClaseCuenta.INGRESO, naturaleza: NaturalezaCuenta.CREDITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '42' },

  // ==========================================
  // CLASE 5: GASTOS
  // ==========================================
  { codigo: '5', nombre: 'GASTOS', nivel: 1, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: null },
  { codigo: '51', nombre: 'Operacionales de Administración', nivel: 2, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '5' },
  { codigo: '5105', nombre: 'Gastos de Personal', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '51' },
  { codigo: '510506', nombre: 'Sueldos', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5105' },
  { codigo: '5110', nombre: 'Honorarios', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '51' },
  { codigo: '511010', nombre: 'Revisoría Fiscal y Auditoría', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5110' },
  { codigo: '511030', nombre: 'Asesoría Jurídica', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5110' },
  { codigo: '511095', nombre: 'Otros Honorarios Profesionales', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5110' },
  { codigo: '5120', nombre: 'Arrendamientos', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5120' },
  { codigo: '5135', nombre: 'Servicios Generales', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '51' },
  { codigo: '513505', nombre: 'Servicios de Aseo y Vigilancia', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5135' },
  { codigo: '513530', nombre: 'Energía Eléctrica', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5135' },
  { codigo: '513535', nombre: 'Teléfono, Internet y Comunicaciones', nivel: 6, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '5135' },
  { codigo: '5145', nombre: 'Mantenimiento y Reparaciones', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '51' },
  { codigo: '5160', nombre: 'Depreciaciones', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '51' },
  { codigo: '5195', nombre: 'Diversos', nivel: 4, clase: ClaseCuenta.GASTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: true, parent_codigo: '51' },

  // ==========================================
  // CLASE 6: COSTO DE VENTAS
  // ==========================================
  { codigo: '6', nombre: 'COSTO DE VENTAS', nivel: 1, clase: ClaseCuenta.COSTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: null },
  { codigo: '61', nombre: 'Costo de Ventas y de Prestación de Servicios', nivel: 2, clase: ClaseCuenta.COSTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: false, exige_tercero: false, parent_codigo: '6' },
  { codigo: '6135', nombre: 'Comercio al por Mayor y al por Menor', nivel: 4, clase: ClaseCuenta.COSTO, naturaleza: NaturalezaCuenta.DEBITO, permite_movimiento: true, exige_tercero: false, parent_codigo: '61' },
];
