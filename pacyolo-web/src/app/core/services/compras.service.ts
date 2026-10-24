import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrdenCompraItem {
  id: string;
  numero_orden: string;
  proveedor?: {
    id: string;
    numero_identificacion: string;
    nombre_completo: string;
    razon_social?: string;
    ciudad?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  bodega_destino?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  fecha_emision: string;
  fecha_entrega_esperada?: string;
  condicion_pago?: 'CONTADO' | 'CREDITO';
  dias_credito?: number;
  fecha_vencimiento?: string;
  metodo_pago?: string;
  numero_factura_proveedor?: string;
  asiento_id?: string;
  cxp_id?: string;
  estado: 'BORRADOR' | 'APROBADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA_TOTAL' | 'CANCELADA';
  subtotal: number;
  total_impuestos: number;
  total: number;
  observaciones?: string;
  lineas: {
    id: string;
    articulo?: {
      id: string;
      codigo: string;
      nombre: string;
    };
    cantidad_solicitada: number;
    cantidad_recibida: number;
    costo_unitario: number;
    porcentaje_iva: number;
    subtotal: number;
    total: number;
  }[];
  entradas?: any[];
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ComprasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/compras';

  listarOrdenes(estado?: string): Observable<OrdenCompraItem[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<OrdenCompraItem[]>(`${this.apiUrl}/ordenes`, { params });
  }

  obtenerOrden(id: string): Observable<OrdenCompraItem> {
    return this.http.get<OrdenCompraItem>(`${this.apiUrl}/ordenes/${id}`);
  }

  crearOrden(orden: any): Observable<OrdenCompraItem> {
    return this.http.post<OrdenCompraItem>(`${this.apiUrl}/ordenes`, orden);
  }

  cambiarEstado(id: string, estado: string): Observable<OrdenCompraItem> {
    return this.http.patch<OrdenCompraItem>(`${this.apiUrl}/ordenes/${id}/estado`, { estado });
  }

  causarOrden(id: string, datos?: { numero_factura_proveedor?: string; fecha_factura?: string; codigo_concepto?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ordenes/${id}/causar`, datos || {});
  }
}
