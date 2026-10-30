import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CajaMenorItem {
  id: string;
  codigo: string;
  nombre: string;
  responsable?: {
    id: string;
    nombre_completo: string;
    numero_identificacion: string;
  };
  cuenta_puc?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  monto_fondo_fijo: number;
  saldo_actual_efectivo: number;
  saldo_en_vales: number;
  estado: 'ABIERTA' | 'EN_REPOSICION' | 'CERRADA';
  asiento_apertura_id?: string;
  observaciones?: string;
  created_at: string;
}

export interface GastoCajaMenorItem {
  id: string;
  consecutivo: string;
  fecha_gasto: string;
  tercero?: {
    id: string;
    nombre_completo: string;
    razon_social: string;
    numero_identificacion: string;
  };
  concepto: string;
  cuenta_gasto?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  subtotal: number;
  iva: number;
  retefuente: number;
  total: number;
  soporte_factura_ref?: string;
  estado: 'LEGALIZADO' | 'REEMBOLSADO' | 'ANULADO';
  created_at: string;
}

export interface ArqueoCajaMenorItem {
  id: string;
  consecutivo: string;
  fecha_arqueo: string;
  custodio?: {
    id: string;
    nombre_completo: string;
  };
  desglose_efectivo?: Record<string, number>;
  total_efectivo_fisico: number;
  total_vales_comprobantes: number;
  total_fondo_contado: number;
  monto_fondo_fijo: number;
  diferencia: number;
  resultado: 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';
  observaciones?: string;
  created_at: string;
}

export interface CuentaBancariaItem {
  id: string;
  banco_nombre: string;
  tipo_cuenta: 'CORRIENTE' | 'AHORROS';
  numero_cuenta: string;
  cuenta_puc?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  moneda: string;
  saldo_libros_actual: number;
  activa: boolean;
  descripcion?: string;
}

export interface ExtractoBancarioLineaItem {
  id: string;
  fecha: string;
  descripcion: string;
  referencia?: string;
  tipo_movimiento: 'DEBITO' | 'CREDITO';
  valor: number;
  conciliado: boolean;
  asiento_linea_id?: string;
}

export interface ExtractoBancarioItem {
  id: string;
  cuenta_bancaria?: CuentaBancariaItem;
  periodo_anio: number;
  periodo_mes: number;
  fecha_corte: string;
  saldo_inicial: number;
  total_creditos_depositos: number;
  total_debitos_retiros: number;
  saldo_final: number;
  estado: 'BORRADOR' | 'CONCILIADO_PARCIAL' | 'CONCILIADO_TOTAL';
  lineas?: ExtractoBancarioLineaItem[];
  created_at: string;
}

export interface ConciliacionPartidaItem {
  id: string;
  tipo_partida: 'MATCH_EXACTO' | 'CHEQUE_EN_TRANSITO' | 'CONSIGNACION_EN_TRANSITO' | 'NOTA_DEBITO_PENDIENTE' | 'NOTA_CREDITO_PENDIENTE';
  extracto_linea_id?: string;
  asiento_linea_id?: string;
  fecha: string;
  concepto: string;
  referencia?: string;
  valor: number;
}

export interface ConciliacionBancariaItem {
  id: string;
  consecutivo: string;
  periodo_anio: number;
  periodo_mes: number;
  fecha_conciliacion: string;
  cuenta_bancaria?: CuentaBancariaItem;
  extracto?: ExtractoBancarioItem;
  saldo_extracto_bancario: number;
  saldo_libros_contables: number;
  total_cheques_en_transito: number;
  total_consignaciones_en_transito: number;
  total_notas_debito_pendientes: number;
  total_notas_credito_pendientes: number;
  saldo_conciliado_extracto: number;
  saldo_conciliado_libros: number;
  diferencia_descuadre: number;
  estado: 'EN_PROCESO' | 'APROBADA' | 'ANULADA';
  elaborado_por: string;
  revisado_por?: string;
  aprobado_por?: string;
  observaciones?: string;
  partidas?: ConciliacionPartidaItem[];
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class TesoreriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/tesoreria';

  // ==========================================
  // CAJAS MENORES
  // ==========================================

  listarCajasMenores(): Observable<CajaMenorItem[]> {
    return this.http.get<CajaMenorItem[]>(`${this.apiUrl}/cajas-menores`);
  }

  crearCajaMenor(payload: any): Observable<CajaMenorItem> {
    return this.http.post<CajaMenorItem>(`${this.apiUrl}/cajas-menores`, payload);
  }

  obtenerCajaMenor(id: string): Observable<CajaMenorItem> {
    return this.http.get<CajaMenorItem>(`${this.apiUrl}/cajas-menores/${id}`);
  }

  registrarGastoCaja(payload: any): Observable<GastoCajaMenorItem> {
    return this.http.post<GastoCajaMenorItem>(`${this.apiUrl}/cajas-menores/gastos`, payload);
  }

  listarGastosCaja(cajaId: string, estado?: string): Observable<GastoCajaMenorItem[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<GastoCajaMenorItem[]>(`${this.apiUrl}/cajas-menores/${cajaId}/gastos`, { params });
  }

  reembolsarCaja(payload: any): Observable<{ asiento: any; totalReembolsado: number }> {
    return this.http.post<{ asiento: any; totalReembolsado: number }>(`${this.apiUrl}/cajas-menores/reembolsos`, payload);
  }

  registrarArqueo(payload: any): Observable<ArqueoCajaMenorItem> {
    return this.http.post<ArqueoCajaMenorItem>(`${this.apiUrl}/cajas-menores/arqueos`, payload);
  }

  listarArqueos(cajaId: string): Observable<ArqueoCajaMenorItem[]> {
    return this.http.get<ArqueoCajaMenorItem[]>(`${this.apiUrl}/cajas-menores/${cajaId}/arqueos`);
  }

  // ==========================================
  // CUENTAS BANCARIAS & LIBRO AUXILIAR
  // ==========================================

  listarCuentasBancarias(): Observable<CuentaBancariaItem[]> {
    return this.http.get<CuentaBancariaItem[]>(`${this.apiUrl}/cuentas-bancarias`);
  }

  crearCuentaBancaria(payload: any): Observable<CuentaBancariaItem> {
    return this.http.post<CuentaBancariaItem>(`${this.apiUrl}/cuentas-bancarias`, payload);
  }

  obtenerLibroAuxiliar(cuentaId: string, fechaInicio?: string, fechaFin?: string): Observable<any> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<any>(`${this.apiUrl}/cuentas-bancarias/${cuentaId}/libro-auxiliar`, { params });
  }

  // ==========================================
  // EXTRACTOS & CONCILIACIÓN BANCARIA
  // ==========================================

  importarExtracto(payload: any): Observable<ExtractoBancarioItem> {
    return this.http.post<ExtractoBancarioItem>(`${this.apiUrl}/extractos/importar`, payload);
  }

  listarExtractos(cuentaBancariaId?: string): Observable<ExtractoBancarioItem[]> {
    let params = new HttpParams();
    if (cuentaBancariaId) params = params.set('cuentaBancariaId', cuentaBancariaId);
    return this.http.get<ExtractoBancarioItem[]>(`${this.apiUrl}/extractos`, { params });
  }

  obtenerExtracto(id: string): Observable<ExtractoBancarioItem> {
    return this.http.get<ExtractoBancarioItem>(`${this.apiUrl}/extractos/${id}`);
  }

  ejecutarConciliacion(payload: any): Observable<ConciliacionBancariaItem> {
    return this.http.post<ConciliacionBancariaItem>(`${this.apiUrl}/conciliaciones/ejecutar`, payload);
  }

  obtenerConciliacion(id: string): Observable<ConciliacionBancariaItem> {
    return this.http.get<ConciliacionBancariaItem>(`${this.apiUrl}/conciliaciones/${id}`);
  }

  aprobarConciliacion(id: string): Observable<ConciliacionBancariaItem> {
    return this.http.post<ConciliacionBancariaItem>(`${this.apiUrl}/conciliaciones/${id}/aprobar`, {});
  }

  causarNotaBancaria(payload: any): Observable<{ asiento: any; lineaConciliada: any }> {
    return this.http.post<{ asiento: any; lineaConciliada: any }>(`${this.apiUrl}/conciliaciones/causar-nota`, payload);
  }
}
