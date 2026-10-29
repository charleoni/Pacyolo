import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CrearAsientoModalComponent } from './crear-asiento-modal.component';
import { TablePaginationComponent } from '../../../shared/components/table-pagination.component';

interface AsientoLinea {
  id: string;
  cuenta?: {
    codigo: string;
    nombre: string;
  };
  tercero?: {
    numero_documento: string;
    razon_social: string;
  };
  glosa_detalle: string;
  documento_referencia?: string;
  debito: number;
  credito: number;
}

interface Asiento {
  id: string;
  tipo_comprobante: string;
  consecutivo: number;
  numero_comprobante: string;
  fecha_contable: string;
  glosa_general: string;
  total_debito: number;
  total_credito: number;
  estado: string;
  motivo_anulacion?: string;
  lineas?: AsientoLinea[];
}

@Component({
  selector: 'app-libro-diario',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearAsientoModalComponent, TablePaginationComponent],
  template: `
    <div class="space-y-6">
      <!-- Encabezado con Botón de Creación -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📖</span>
            Libro Diario de Comprobantes
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Registro oficial cronológico de hechos económicos con partida doble inmutable
          </p>
        </div>

        <button
          type="button"
          (click)="mostrarModalCrear.set(true)"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          + Nuevo Comprobante Manual
        </button>
      </div>

      <!-- Tabla de Comprobantes -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="sticky top-0 z-10 bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Comprobante</th>
                <th class="py-3 px-4">Tipo</th>
                <th class="py-3 px-4">Fecha Contable</th>
                <th class="py-3 px-4">Concepto / Glosa</th>
                <th class="py-3 px-4 text-right">Débitos</th>
                <th class="py-3 px-4 text-right">Créditos</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (asiento of asientosPaginados(); track asiento.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-mono font-bold text-white">{{ asiento.numero_comprobante }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                      {{ asiento.tipo_comprobante }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-400 font-mono">{{ asiento.fecha_contable }}</td>
                  <td class="py-3 px-4 font-medium text-slate-200">{{ asiento.glosa_general }}</td>
                  <td class="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                    {{ asiento.total_debito | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                    {{ asiento.total_credito | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [class]="asiento.estado === 'CONTABILIZADO' || asiento.estado === 'REGISTRADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ asiento.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      (click)="verDetalle(asiento)"
                      class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                      title="Ver líneas del asiento"
                    >
                      Líneas
                    </button>

                    <button
                      *ngIf="asiento.estado !== 'ANULADO'"
                      (click)="abrirModalAnular(asiento)"
                      class="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg border border-rose-800/40 transition"
                      title="Anular con reversión NIIF"
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="py-12 text-center text-slate-400 text-xs">
                    No hay comprobantes contables registrados para esta empresa todavía.
                    <div class="mt-2">
                      <button
                        (click)="mostrarModalCrear.set(true)"
                        class="text-indigo-400 hover:underline"
                      >
                        Haz clic aquí para registrar el primer comprobante contable.
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-table-pagination
          [totalItems]="asientos().length"
          [currentPage]="paginaAsientos()"
          [pageSize]="tamanoAsientos()"
          (pageChange)="paginaAsientos.set($event)"
          (pageSizeChange)="tamanoAsientos.set($event); paginaAsientos.set(1)"
        />
      </div>

      <!-- Modal de Creación de Asiento -->
      <app-crear-asiento-modal
        *ngIf="mostrarModalCrear()"
        (cerrar)="mostrarModalCrear.set(false)"
        (guardadoExitoso)="onAsientoGuardado()"
      />

      <!-- Modal de Detalle de Líneas de Asiento -->
      <div *ngIf="asientoDetalle()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>Comprobante {{ asientoDetalle()?.numero_comprobante }}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                  {{ asientoDetalle()?.tipo_comprobante }}
                </span>
              </h3>
              <p class="text-xs text-slate-400">{{ asientoDetalle()?.glosa_general }} — {{ asientoDetalle()?.fecha_contable }}</p>
            </div>
            <button (click)="asientoDetalle.set(null)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold">&times;</button>
          </div>

          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">Cuenta PUC</th>
                  <th class="py-2.5 px-3">Tercero</th>
                  <th class="py-2.5 px-3">Concepto</th>
                  <th class="py-2.5 px-3 text-right">Débito</th>
                  <th class="py-2.5 px-3 text-right">Crédito</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr *ngFor="let l of asientoDetalle()?.lineas" class="hover:bg-slate-800/30">
                  <td class="py-2.5 px-3 font-mono font-medium text-emerald-400">
                    {{ l.cuenta?.codigo }} - {{ l.cuenta?.nombre }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-300">
                    {{ l.tercero?.numero_documento }} {{ l.tercero?.razon_social ? ('- ' + l.tercero?.razon_social) : '' }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-400">{{ l.glosa_detalle }}</td>
                  <td class="py-2.5 px-3 text-right font-mono text-white">
                    {{ l.debito | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono text-white">
                    {{ l.credito | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-mono">
            <span class="text-slate-400 font-sans">Sumas Iguales:</span>
            <div class="flex gap-6">
              <span class="text-emerald-400 font-bold">Débito: {{ asientoDetalle()?.total_debito | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
              <span class="text-emerald-400 font-bold">Crédito: {{ asientoDetalle()?.total_credito | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              (click)="asientoDetalle.set(null)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Anulación con Motivo -->
      <div *ngIf="asientoAAnular()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center gap-3 text-rose-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-base font-bold text-white">Anular Comprobante {{ asientoAAnular()?.numero_comprobante }}</h3>
          </div>

          <p class="text-xs text-slate-300">
            Esta acción generará automáticamente un comprobante oficial de reversión invirtiendo débitos y créditos para conservar la inmutabilidad contable NIIF.
          </p>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Motivo formal de la anulación *</label>
            <textarea
              [(ngModel)]="motivoAnulacion"
              rows="3"
              placeholder="Explique detalladamente la causa de la anulación para la pista de auditoría..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              (click)="asientoAAnular.set(null)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              (click)="confirmarAnulacion()"
              [disabled]="!motivoAnulacion.trim() || anulando()"
              class="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl shadow transition"
            >
              {{ anulando() ? 'Reversando...' : 'Confirmar Anulación NIIF' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LibroDiarioComponent implements OnInit {
  asientos = signal<Asiento[]>([]);

  // Paginación Reactiva
  readonly paginaAsientos = signal(1);
  readonly tamanoAsientos = signal(25);
  asientosPaginados(): Asiento[] {
    const p = this.paginaAsientos();
    const s = this.tamanoAsientos();
    return this.asientos().slice((p - 1) * s, p * s);
  }
  mostrarModalCrear = signal<boolean>(false);
  asientoDetalle = signal<Asiento | null>(null);
  asientoAAnular = signal<Asiento | null>(null);
  motivoAnulacion = '';
  anulando = signal<boolean>(false);

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.cargarAsientos();
  }

  cargarAsientos(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<Asiento[]>(`http://localhost:3000/api/v1/asientos?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.asientos.set(data),
        error: (err) => console.error('Error cargando libro diario:', err),
      });
  }

  onAsientoGuardado(): void {
    this.mostrarModalCrear.set(false);
    this.cargarAsientos();
  }

  verDetalle(asiento: Asiento): void {
    this.http.get<Asiento>(`http://localhost:3000/api/v1/asientos/${asiento.id}`).subscribe({
      next: (full) => this.asientoDetalle.set(full),
      error: (err) => console.error('Error cargando detalle de asiento:', err),
    });
  }

  abrirModalAnular(asiento: Asiento): void {
    this.asientoAAnular.set(asiento);
    this.motivoAnulacion = '';
  }

  confirmarAnulacion(): void {
    const asiento = this.asientoAAnular();
    if (!asiento || !this.motivoAnulacion.trim()) return;

    this.anulando.set(true);
    const usuarioId = this.authService.usuario()?.id;

    this.http
      .post(`http://localhost:3000/api/v1/asientos/${asiento.id}/anular`, {
        motivo: this.motivoAnulacion.trim(),
        usuario_id: usuarioId,
      })
      .subscribe({
        next: () => {
          this.anulando.set(false);
          this.asientoAAnular.set(null);
          this.notificationService.success('Comprobante contable anulado y generado el asiento de reversión NIIF.');
          this.cargarAsientos();
        },
        error: (err) => {
          this.anulando.set(false);
          this.notificationService.error(err.error?.message || 'Error al anular comprobante.');
        },
      });
  }
}
