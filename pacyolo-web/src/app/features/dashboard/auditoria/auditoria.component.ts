import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditoriaService,
  AuditoriaLogItem,
  ResumenAuditoriaResponse,
} from '../../../core/services/auditoria.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Pistas de Auditoría Inmutables
          </h1>
          <p class="text-sm text-slate-400">
            Registro cronológico estricto de todas las operaciones, modificaciones y accesos en el ERP.
          </p>
        </div>

        <button
          (click)="cargarDatos()"
          [disabled]="cargando()"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
        >
          <svg [class.animate-spin]="cargando()" class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar Bitácora
        </button>
      </div>

      <!-- Tarjetas de métricas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Operaciones (Últimas 24h)</span>
          <p class="text-2xl font-bold text-emerald-400 mt-1">{{ resumen()?.total24h || 0 }}</p>
          <span class="text-[11px] text-slate-500">Trazabilidad en tiempo real</span>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Asientos Contables</span>
          <p class="text-2xl font-bold text-cyan-400 mt-1">{{ resumen()?.porModulo?.['ASIENTOS'] || 0 }}</p>
          <span class="text-[11px] text-slate-500">Comprobantes y reversiones</span>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Cuentas por Pagar (CxP)</span>
          <p class="text-2xl font-bold text-amber-400 mt-1">{{ resumen()?.porModulo?.['CXP'] || 0 }}</p>
          <span class="text-[11px] text-slate-500">Causaciones y egresos</span>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Seguridad & Autenticación</span>
          <p class="text-2xl font-bold text-purple-400 mt-1">{{ resumen()?.porModulo?.['AUTH'] || 0 }}</p>
          <span class="text-[11px] text-slate-500">Accesos y permisos</span>
        </div>
      </div>

      <!-- Filtros de búsqueda -->
      <div class="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-[200px]">
          <input
            type="text"
            [(ngModel)]="filtroEmail"
            (keyup.enter)="cargarDatos()"
            placeholder="Filtrar por email de usuario..."
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="w-40">
          <select
            [(ngModel)]="filtroModulo"
            (change)="cargarDatos()"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todos los módulos</option>
            <option value="ASIENTOS">Asientos Contables</option>
            <option value="CXP">Cuentas por Pagar</option>
            <option value="TERCEROS">Directorio Terceros</option>
            <option value="PUC">Catálogo PUC</option>
            <option value="USUARIOS">Usuarios & Roles</option>
            <option value="AUTH">Autenticación</option>
            <option value="INTEGRACION">Integración POS/API</option>
          </select>
        </div>

        <div class="w-36">
          <select
            [(ngModel)]="filtroAccion"
            (change)="cargarDatos()"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ANULAR">ANULAR</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>

        <button
          (click)="limpiarFiltros()"
          class="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition"
        >
          Limpiar
        </button>
      </div>

      <!-- Tabla de auditoría -->
      <div class="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th class="px-4 py-3">Fecha / Hora</th>
                <th class="px-4 py-3">Usuario</th>
                <th class="px-4 py-3">Módulo</th>
                <th class="px-4 py-3">Acción</th>
                <th class="px-4 py-3">Método / Ruta</th>
                <th class="px-4 py-3">IP / Origen</th>
                <th class="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/60">
              <tr *ngFor="let item of logs()" class="hover:bg-slate-800/40 transition">
                <td class="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                  {{ item.created_at | date:'yyyy-MM-dd HH:mm:ss' }}
                </td>
                <td class="px-4 py-3 font-medium text-slate-200">
                  <div class="text-xs text-slate-300">{{ item.usuario_email }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-slate-700 text-slate-300">
                    {{ item.modulo }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    [ngClass]="{
                      'bg-emerald-900/60 text-emerald-300 border-emerald-700/50': item.accion === 'CREATE',
                      'bg-blue-900/60 text-blue-300 border-blue-700/50': item.accion === 'UPDATE',
                      'bg-red-900/60 text-red-300 border-red-700/50': item.accion.includes('DELETE') || item.accion.includes('FALLIDO'),
                      'bg-amber-900/60 text-amber-300 border-amber-700/50': item.accion === 'ANULAR',
                      'bg-purple-900/60 text-purple-300 border-purple-700/50': item.accion === 'LOGIN'
                    }"
                    class="inline-flex px-2 py-0.5 text-xs font-bold rounded border"
                  >
                    {{ item.accion }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs font-mono text-slate-400 max-w-[200px] truncate" [title]="item.ruta">
                  <span class="font-bold text-slate-300">{{ item.metodo_http }}</span> {{ item.ruta }}
                </td>
                <td class="px-4 py-3 text-xs font-mono text-slate-400">
                  {{ item.ip_address }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    (click)="abrirDetalle(item)"
                    class="px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40 rounded transition"
                  >
                    Ver Snapshot
                  </button>
                </td>
              </tr>

              <tr *ngIf="logs().length === 0 && !cargando()">
                <td colspan="7" class="px-4 py-8 text-center text-slate-400 text-sm">
                  No hay pistas de auditoría registradas con los filtros actuales.
                </td>
              </tr>

              <tr *ngIf="cargando()">
                <td colspan="7" class="px-4 py-8 text-center text-slate-400 text-sm">
                  Cargando pistas de auditoría inmutables...
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span>Mostrando {{ logs().length }} de {{ total() }} registros de auditoría</span>
        </div>
      </div>

      <!-- Modal de Detalle / Snapshot JSON -->
      <div
        *ngIf="logSeleccionado()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <div class="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-semibold text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Detalle de Pista de Auditoría #{{ logSeleccionado()?.id?.slice(0, 8) }}
            </h3>
            <button
              (click)="logSeleccionado.set(null)"
              class="text-slate-400 hover:text-slate-200 text-xl font-bold"
            >
              &times;
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-slate-400 block">Usuario:</span>
              <span class="text-slate-200 font-medium">{{ logSeleccionado()?.usuario_email }}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Fecha y Hora:</span>
              <span class="text-slate-200 font-medium">{{ logSeleccionado()?.created_at | date:'yyyy-MM-dd HH:mm:ss' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Acción / Módulo:</span>
              <span class="text-slate-200 font-medium">{{ logSeleccionado()?.accion }} en {{ logSeleccionado()?.modulo }}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Dirección IP / Navegador:</span>
              <span class="text-slate-200 font-medium font-mono">{{ logSeleccionado()?.ip_address }}</span>
            </div>
          </div>

          <div>
            <span class="text-xs font-semibold text-slate-400 block mb-1">Cuerpo de la Petición / Snapshot (JSON):</span>
            <pre class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-64 overflow-y-auto">{{ jsonSnapshot() }}</pre>
          </div>

          <div class="flex justify-end pt-2">
            <button
              (click)="logSeleccionado.set(null)"
              class="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);

  logs = signal<AuditoriaLogItem[]>([]);
  total = signal<number>(0);
  resumen = signal<ResumenAuditoriaResponse | null>(null);
  cargando = signal<boolean>(false);
  logSeleccionado = signal<AuditoriaLogItem | null>(null);

  filtroModulo: string = '';
  filtroAccion: string = '';
  filtroEmail: string = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);

    this.auditoriaService
      .consultarLogs({
        modulo: this.filtroModulo || undefined,
        accion: this.filtroAccion || undefined,
        usuario_email: this.filtroEmail || undefined,
        limit: 50,
      })
      .subscribe({
        next: (resp) => {
          this.logs.set(resp.data);
          this.total.set(resp.total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });

    this.auditoriaService.obtenerResumen().subscribe({
      next: (data) => this.resumen.set(data),
      error: () => {},
    });
  }

  limpiarFiltros(): void {
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.filtroEmail = '';
    this.cargarDatos();
  }

  abrirDetalle(item: AuditoriaLogItem): void {
    this.logSeleccionado.set(item);
  }

  jsonSnapshot(): string {
    const item = this.logSeleccionado();
    if (!item) return '';
    return JSON.stringify(item.datos_nuevos || item.datos_anteriores || {}, null, 2);
  }
}
