import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditoriaLogItem {
  id: string;
  empresa_id: string | null;
  usuario_id: string | null;
  usuario_email: string;
  ip_address: string;
  user_agent: string | null;
  metodo_http: string;
  ruta: string;
  accion: string;
  modulo: string;
  entidad_id: string | null;
  datos_anteriores: any | null;
  datos_nuevos: any | null;
  status_code: number | null;
  duracion_ms: number | null;
  created_at: string;
}

export interface ConsultaAuditoriaResponse {
  data: AuditoriaLogItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ResumenAuditoriaResponse {
  total24h: number;
  porModulo: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/v1/auditoria';

  consultarLogs(filtros?: {
    modulo?: string;
    accion?: string;
    usuario_email?: string;
    limit?: number;
    offset?: number;
  }): Observable<ConsultaAuditoriaResponse> {
    let params = new HttpParams();
    if (filtros?.modulo) params = params.set('modulo', filtros.modulo);
    if (filtros?.accion) params = params.set('accion', filtros.accion);
    if (filtros?.usuario_email) params = params.set('usuario_email', filtros.usuario_email);
    if (filtros?.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros?.offset) params = params.set('offset', filtros.offset.toString());

    return this.http.get<ConsultaAuditoriaResponse>(this.apiUrl, { params });
  }

  obtenerResumen(): Observable<ResumenAuditoriaResponse> {
    return this.http.get<ResumenAuditoriaResponse>(`${this.apiUrl}/resumen`);
  }

  obtenerDetalle(id: string): Observable<AuditoriaLogItem> {
    return this.http.get<AuditoriaLogItem>(`${this.apiUrl}/${id}`);
  }
}
