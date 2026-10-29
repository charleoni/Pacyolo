import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CuentaPorCobrarItem {
  id: string;
  numero_factura: string;
  tercero?: {
    id: string;
    numero_identificacion: string;
    razon_social: string;
    nombre_completo?: string;
    telefono?: string;
    email?: string;
    ciudad?: string;
  };
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  total_impuestos: number;
  total_retenciones: number;
  total_factura: number;
  saldo_pendiente: number;
  estado: 'PENDIENTE' | 'COBRADA_PARCIAL' | 'COBRADA_TOTAL' | 'ANULADA';
  observaciones?: string;
  asiento_id?: string;
  asiento?: any;
  created_at: string;
}

export interface RecaudoCxcItem {
  id: string;
  cuenta_por_cobrar_id: string;
  cuenta_banco?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  asiento_id?: string;
  asiento?: any;
  monto_recaudo: number;
  fecha_recaudo: string;
  metodo_recaudo: string;
  referencia_transaccion?: string;
  glosa?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class CxcService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/cxc';

  listarCartera(search?: string, estado?: string): Observable<{
    items: CuentaPorCobrarItem[];
    resumen: {
      totalCartera: number;
      totalCorriente: number;
      totalVencido: number;
    };
  }> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (estado && estado !== 'TODOS') {
      params = params.set('estado', estado);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  registrarRecaudo(payload: any): Observable<RecaudoCxcItem> {
    return this.http.post<RecaudoCxcItem>(`${this.apiUrl}/recaudos`, payload);
  }

  listarRecaudosPorFactura(cxcId: string): Observable<RecaudoCxcItem[]> {
    return this.http.get<RecaudoCxcItem[]>(`${this.apiUrl}/recaudos/${cxcId}`);
  }

  anularRecaudo(id: string, motivo: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/recaudos/${id}`, { body: { motivo } });
  }

  obtenerEstadoCuenta(clienteId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/estado-cuenta/${clienteId}`);
  }

  obtenerExtracto(clienteId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/extracto/${clienteId}`);
  }

  obtenerMatrizEdades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/matriz-edades`);
  }
}
