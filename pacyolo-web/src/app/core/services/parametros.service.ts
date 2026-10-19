import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DepartamentoItem {
  id: string;
  codigo: string;
  nombre: string;
  pais_codigo: string;
  activo: boolean;
}

export interface MunicipioItem {
  id: string;
  codigo: string;
  nombre: string;
  departamento_codigo: string;
  departamento_nombre: string;
  activo: boolean;
}

export interface ParametroItem {
  id: string;
  empresa_id: string | null;
  codigo: string;
  nombre: string;
  codigo_dian?: string | null;
  aplica_digito_verificacion?: boolean;
  exige_razon_social?: boolean;
  codigo_responsabilidad_dian?: string | null;
  aplica_iva?: boolean;
  color_badge?: string;
  prefijo?: string;
  consecutivo_actual?: number;
  exige_referencia?: boolean;
  activo: boolean;
  es_sistema: boolean;
  en_uso?: boolean;
  conteo_usos?: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParametrosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/v1/parametros';

  sembrarCatalogos(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/sembrar`, {});
  }

  // 1. Tipos de Identificación
  obtenerTiposIdentificacion(): Observable<ParametroItem[]> {
    return this.http.get<ParametroItem[]>(`${this.apiUrl}/tipos-identificacion`);
  }

  crearTipoIdentificacion(data: Partial<ParametroItem>): Observable<ParametroItem> {
    return this.http.post<ParametroItem>(`${this.apiUrl}/tipos-identificacion`, data);
  }

  // 2. Tipos de Persona
  obtenerTiposPersona(): Observable<ParametroItem[]> {
    return this.http.get<ParametroItem[]>(`${this.apiUrl}/tipos-persona`);
  }

  crearTipoPersona(data: Partial<ParametroItem>): Observable<ParametroItem> {
    return this.http.post<ParametroItem>(`${this.apiUrl}/tipos-persona`, data);
  }

  // 3. Regímenes Fiscales
  obtenerRegimenesFiscales(): Observable<ParametroItem[]> {
    return this.http.get<ParametroItem[]>(`${this.apiUrl}/regimenes-fiscales`);
  }

  crearRegimenFiscal(data: Partial<ParametroItem>): Observable<ParametroItem> {
    return this.http.post<ParametroItem>(`${this.apiUrl}/regimenes-fiscales`, data);
  }

  // 4. Clasificaciones de Terceros
  obtenerClasificacionesTercero(): Observable<ParametroItem[]> {
    return this.http.get<ParametroItem[]>(`${this.apiUrl}/clasificaciones-tercero`);
  }

  crearClasificacionTercero(data: Partial<ParametroItem>): Observable<ParametroItem> {
    return this.http.post<ParametroItem>(`${this.apiUrl}/clasificaciones-tercero`, data);
  }

  // 5. Tipos de Comprobantes Contables
  obtenerTiposComprobante(): Observable<ParametroItem[]> {
    return this.http.get<ParametroItem[]>(`${this.apiUrl}/tipos-comprobante`);
  }

  crearTipoComprobante(data: Partial<ParametroItem>): Observable<ParametroItem> {
    return this.http.post<ParametroItem>(`${this.apiUrl}/tipos-comprobante`, data);
  }

  // 6. Métodos de Pago
  obtenerMetodosPago(): Observable<ParametroItem[]> {
    return this.http.get<ParametroItem[]>(`${this.apiUrl}/metodos-pago`);
  }

  crearMetodoPago(data: Partial<ParametroItem>): Observable<ParametroItem> {
    return this.http.post<ParametroItem>(`${this.apiUrl}/metodos-pago`, data);
  }

  // 7. Departamentos DANE
  obtenerDepartamentos(): Observable<DepartamentoItem[]> {
    return this.http.get<DepartamentoItem[]>(`${this.apiUrl}/departamentos`);
  }

  // 8. Municipios DANE
  buscarMunicipios(termino?: string, departamentoCodigo?: string): Observable<MunicipioItem[]> {
    let params: any = {};
    if (termino) params.q = termino;
    if (departamentoCodigo) params.departamento_codigo = departamentoCodigo;
    return this.http.get<MunicipioItem[]>(`${this.apiUrl}/municipios`, { params });
  }

  // Activar / Inactivar
  cambiarEstado(catalogo: string, id: string, activo: boolean): Observable<ParametroItem> {
    return this.http.patch<ParametroItem>(`${this.apiUrl}/${catalogo}/${id}/estado`, { activo });
  }
}
