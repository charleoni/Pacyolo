import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FacturaVentaItem {
  id: string;
  consecutivo: string;
  tipo_documento: 'FACTURA_VENTA' | 'TIQUETE_POS';
  cliente?: {
    id: string;
    numero_identificacion: string;
    razon_social: string;
    nombre_completo?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    ciudad?: string;
  };
  fecha_emision: string;
  fecha_vencimiento: string;
  condicion_pago: 'CONTADO' | 'CREDITO';
  medio_pago: string;
  subtotal: number;
  total_descuentos: number;
  total_iva: number;
  total_inc: number;
  propina: number;
  retefuente: number;
  reteica: number;
  reteiva: number;
  total_factura: number;
  costo_total_ventas: number;
  estado: 'EMITIDA' | 'REVERSADA_PARCIAL' | 'REVERSADA_TOTAL' | 'ANULADA';
  observaciones?: string;
  asiento_id?: string;
  asiento?: any;
  asiento_costo_id?: string;
  asiento_costo?: any;
  lineas: {
    id: string;
    articulo_id: string;
    articulo?: {
      id: string;
      codigo: string;
      nombre: string;
      tarifa_iva?: number;
      tarifa_inc?: number;
      costo_promedio?: number;
    };
    bodega_id?: string;
    bodega?: {
      id: string;
      codigo: string;
      nombre: string;
    };
    cantidad: number;
    precio_unitario: number;
    porcentaje_descuento: number;
    monto_descuento: number;
    tarifa_iva: number;
    monto_iva: number;
    tarifa_inc: number;
    monto_inc: number;
    subtotal: number;
    total: number;
    costo_unitario: number;
    costo_total: number;
  }[];
  creado_por?: string;
  created_at: string;
}

export interface NotaCreditoVentaItem {
  id: string;
  consecutivo: string;
  factura_id: string;
  factura?: FacturaVentaItem;
  cliente_id: string;
  cliente?: {
    id: string;
    numero_identificacion: string;
    razon_social: string;
    nombre_completo?: string;
    direccion?: string;
    telefono?: string;
    ciudad?: string;
  };
  fecha_emision: string;
  motivo_dian: 'DEVOLUCION_TOTAL' | 'DEVOLUCION_PARCIAL' | 'AJUSTE_PRECIO_DESCUENTO';
  tipo_reembolso: 'CARTERA' | 'DEVOLUCION_DINERO' | 'ANTICIPO_SALDO_FAVOR';
  cuenta_reembolso_id?: string;
  subtotal: number;
  total_iva: number;
  total_inc: number;
  total_nota: number;
  costo_total_revertido: number;
  observaciones?: string;
  asiento_id?: string;
  asiento?: any;
  asiento_costo_id?: string;
  asiento_costo?: any;
  lineas: {
    id: string;
    articulo_id: string;
    articulo?: {
      id: string;
      codigo: string;
      nombre: string;
    };
    bodega_id?: string;
    bodega?: {
      id: string;
      codigo: string;
      nombre: string;
    };
    cantidad: number;
    precio_unitario: number;
    tarifa_iva: number;
    monto_iva: number;
    tarifa_inc: number;
    monto_inc: number;
    subtotal: number;
    total: number;
    costo_unitario: number;
    costo_total: number;
  }[];
  creado_por?: string;
  created_at: string;
}

export interface CreateNotaCreditoDto {
  factura_id: string;
  fecha_emision: string;
  motivo_dian: 'DEVOLUCION_TOTAL' | 'DEVOLUCION_PARCIAL' | 'AJUSTE_PRECIO_DESCUENTO';
  tipo_reembolso: 'CARTERA' | 'DEVOLUCION_DINERO' | 'ANTICIPO_SALDO_FAVOR';
  cuenta_reembolso_id?: string;
  observaciones?: string;
  lineas: {
    articulo_id: string;
    bodega_id?: string;
    cantidad: number;
    precio_unitario: number;
    tarifa_iva?: number;
    tarifa_inc?: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/ventas';

  listarFacturas(search?: string): Observable<FacturaVentaItem[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<FacturaVentaItem[]>(this.apiUrl, { params });
  }

  obtenerFactura(id: string): Observable<FacturaVentaItem> {
    return this.http.get<FacturaVentaItem>(`${this.apiUrl}/${id}`);
  }

  emitirFactura(payload: any): Observable<FacturaVentaItem> {
    return this.http.post<FacturaVentaItem>(this.apiUrl, payload);
  }

  anularFactura(id: string, motivo: string): Observable<FacturaVentaItem> {
    return this.http.post<FacturaVentaItem>(`${this.apiUrl}/${id}/anular`, { motivo });
  }

  listarNotasCredito(search?: string): Observable<NotaCreditoVentaItem[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<NotaCreditoVentaItem[]>(`${this.apiUrl}/notas-credito`, { params });
  }

  obtenerNotaCredito(id: string): Observable<NotaCreditoVentaItem> {
    return this.http.get<NotaCreditoVentaItem>(`${this.apiUrl}/notas-credito/${id}`);
  }

  emitirNotaCredito(dto: CreateNotaCreditoDto): Observable<NotaCreditoVentaItem> {
    return this.http.post<NotaCreditoVentaItem>(`${this.apiUrl}/notas-credito`, dto);
  }
}
