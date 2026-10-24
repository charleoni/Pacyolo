import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ArticuloItem {
  id: string;
  empresa_id?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_articulo: 'INVENTARIABLE' | 'SERVICIO' | 'CONSUMIBLE';
  categoria_id?: string;
  categoria?: {
    id: string;
    codigo: string;
    nombre: string;
    cuenta_inventario?: string;
    cuenta_costo_venta?: string;
    cuenta_gasto?: string;
  };
  unidad_medida_id?: string;
  unidad_medida?: {
    id: string;
    codigo: string;
    nombre: string;
    codigo_dian?: string;
  };
  codigo_barras?: string;
  precio_venta_sugerido: number;
  costo_promedio: number;
  ultimo_costo_compra: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  tarifa_iva: number;
  tarifa_inc: number;
  cuenta_inventario?: string;
  cuenta_costo_venta?: string;
  cuenta_gasto?: string;
  activo: boolean;
  created_at: string;
}

export interface EntradaAlmacenItem {
  id: string;
  numero_entrada: string;
  orden_compra_id?: string;
  orden_compra?: {
    id: string;
    numero_orden: string;
    estado?: string;
    total?: number;
  };
  proveedor?: {
    id: string;
    numero_identificacion: string;
    nombre_completo: string;
  };
  bodega?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  tipo_movimiento?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  numero_remision_proveedor?: string;
  numero_factura_proveedor?: string;
  cxp_id?: string;
  fecha_entrada: string;
  estado: 'CONFIRMADA' | 'ANULADA';
  subtotal?: number;
  total_iva?: number;
  total_con_iva?: number;
  total_valorado: number;
  numero_entrega?: number;
  es_entrega_final?: boolean;
  observaciones?: string;
  lineas: {
    id: string;
    articulo?: {
      id: string;
      codigo: string;
      nombre: string;
    };
    cantidad: number;
    costo_unitario: number;
    costo_total: number;
    porcentaje_iva?: number;
    valor_iva?: number;
    total_con_iva?: number;
  }[];
  created_at: string;
}

export interface KardexMovimientoItem {
  id: string;
  articulo?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  bodega?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  naturaleza: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO';
  fecha_movimiento: string;
  documento_referencia: string;
  cantidad_entrada: number;
  costo_unitario_entrada: number;
  costo_total_entrada: number;
  cantidad_salida: number;
  costo_unitario_salida: number;
  costo_total_salida: number;
  saldo_cantidad_resultante: number;
  costo_unitario_promedio_resultante: number;
  saldo_costo_total_resultante: number;
  observaciones?: string;
  created_at: string;
}

export interface NotaAjusteItem {
  id: string;
  numero_nota: string;
  bodega?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  tipo_ajuste: 'SOBRANTE' | 'FALTANTE_MERMA' | 'CIERRE_INVENTARIO_FISICO';
  estado?: 'APLICADA' | 'ANULADA';
  fecha_ajuste: string;
  justificacion: string;
  total_ajuste: number;
  asiento_id?: string | null;
  asiento?: {
    id: string;
    numero_comprobante: string;
    tipo_comprobante: string;
    fecha_contable: string;
    glosa_general: string;
    estado: string;
    lineas?: {
      id: string;
      cuenta?: {
        codigo: string;
        nombre: string;
      };
      debito: number;
      credito: number;
      glosa_detalle: string;
    }[];
  } | null;
  lineas: {
    id: string;
    articulo?: {
      id: string;
      codigo: string;
      nombre: string;
    };
    tipo_movimiento: 'ENTRADA' | 'SALIDA';
    cantidad: number;
    costo_unitario: number;
    costo_total: number;
  }[];
  created_at: string;
}

export interface SaldoBodegaItem {
  id: string;
  articulo?: {
    id: string;
    codigo: string;
    nombre: string;
    tipo_articulo: string;
  };
  bodega?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  stock_actual: number;
  costo_promedio: number;
}

@Injectable({
  providedIn: 'root',
})
export class InventariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/inventarios';

  // Artículos
  listarArticulos(filtro?: { tipo?: string; busqueda?: string }): Observable<ArticuloItem[]> {
    let params = new HttpParams();
    if (filtro?.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro?.busqueda) params = params.set('busqueda', filtro.busqueda);
    return this.http.get<ArticuloItem[]>(`${this.apiUrl}/articulos`, { params });
  }

  obtenerArticulo(id: string): Observable<ArticuloItem> {
    return this.http.get<ArticuloItem>(`${this.apiUrl}/articulos/${id}`);
  }

  crearArticulo(articulo: Partial<ArticuloItem>): Observable<ArticuloItem> {
    return this.http.post<ArticuloItem>(`${this.apiUrl}/articulos`, articulo);
  }

  actualizarArticulo(id: string, articulo: Partial<ArticuloItem>): Observable<ArticuloItem> {
    return this.http.patch<ArticuloItem>(`${this.apiUrl}/articulos/${id}`, articulo);
  }

  cambiarEstadoArticulo(id: string, activo: boolean): Observable<ArticuloItem> {
    return this.http.patch<ArticuloItem>(`${this.apiUrl}/articulos/${id}/estado`, { activo });
  }

  // Entradas de Almacén
  listarEntradas(): Observable<EntradaAlmacenItem[]> {
    return this.http.get<EntradaAlmacenItem[]>(`${this.apiUrl}/entradas`);
  }

  registrarEntrada(entrada: any): Observable<EntradaAlmacenItem> {
    return this.http.post<EntradaAlmacenItem>(`${this.apiUrl}/entradas`, entrada);
  }

  // Notas de Ajuste
  listarAjustes(): Observable<NotaAjusteItem[]> {
    return this.http.get<NotaAjusteItem[]>(`${this.apiUrl}/ajustes`);
  }

  registrarAjuste(ajuste: any): Observable<NotaAjusteItem> {
    return this.http.post<NotaAjusteItem>(`${this.apiUrl}/ajustes`, ajuste);
  }

  anularAjuste(id: string, motivo: string): Observable<NotaAjusteItem> {
    return this.http.post<NotaAjusteItem>(`${this.apiUrl}/ajustes/${id}/anular`, { motivo });
  }

  // Kardex y Existencias
  consultarKardex(filtro?: { articulo_id?: string; bodega_id?: string; desde?: string; hasta?: string }): Observable<KardexMovimientoItem[]> {
    let params = new HttpParams();
    if (filtro?.articulo_id) params = params.set('articulo_id', filtro.articulo_id);
    if (filtro?.bodega_id) params = params.set('bodega_id', filtro.bodega_id);
    if (filtro?.desde) params = params.set('desde', filtro.desde);
    if (filtro?.hasta) params = params.set('hasta', filtro.hasta);
    return this.http.get<KardexMovimientoItem[]>(`${this.apiUrl}/kardex`, { params });
  }

  consultarExistencias(bodega_id?: string): Observable<SaldoBodegaItem[]> {
    let params = new HttpParams();
    if (bodega_id) params = params.set('bodega_id', bodega_id);
    return this.http.get<SaldoBodegaItem[]>(`${this.apiUrl}/existencias`, { params });
  }

  // Traslados entre Bodegas
  listarTraslados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/traslados`);
  }

  registrarTraslado(traslado: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/traslados`, traslado);
  }
}
