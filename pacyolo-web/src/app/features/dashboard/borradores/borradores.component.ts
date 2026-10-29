import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface Borrador {
  id: string;
  tipo_documento: string;
  origen_sistema: string;
  origen_documento_id: string;
  payload: any;
  estado: string;
  motivo_rechazo?: string;
  created_at: string;
}

@Component({
  selector: 'app-borradores',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Bandeja de Borradores de Integración</h2>
          <p class="text-xs text-slate-400 mt-0.5">Facturas y Recaudos externos pendientes de validación y aprobación</p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Documento</th>
                <th class="py-3 px-4">Origen</th>
                <th class="py-3 px-4">ID Origen</th>
                <th class="py-3 px-4">Fecha Ingesta</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (b of borradores(); track b.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-bold text-white">{{ b.tipo_documento }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {{ b.origen_sistema }}
                    </span>
                  </td>
                  <td class="py-3 px-4 font-mono text-slate-400">{{ b.origen_documento_id }}</td>
                  <td class="py-3 px-4 text-slate-400">{{ b.created_at | date:'short' }}</td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [class]="b.estado === 'PENDIENTE_REVISION' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : (b.estado === 'APROBADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ b.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    @if (b.estado === 'PENDIENTE_REVISION') {
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="aprobar(b.id)"
                          class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          Aprobar
                        </button>
                        <button
                          (click)="rechazar(b.id)"
                          class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </div>
                    } @else {
                      <span class="text-slate-500 text-[11px]">Procesado</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-500 text-xs">
                    No hay borradores en bandeja de revisión para esta empresa.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class BorradoresComponent implements OnInit {
  borradores = signal<Borrador[]>([]);

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cargarBorradores();
  }

  cargarBorradores(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<Borrador[]>(`http://localhost:3000/api/v1/integracion/borradores/${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.borradores.set(data),
        error: (err) => console.error('Error cargando borradores:', err),
      });
  }

  aprobar(id: string): void {
    const usr = this.authService.usuario();
    this.http
      .post(`http://localhost:3000/api/v1/integracion/borradores/${id}/aprobar`, {
        revisado_por: usr ? `${usr.nombres} ${usr.apellidos}` : 'Usuario Web',
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Borrador aprobado e integrado formalmente al libro contable.');
          this.cargarBorradores();
        },
        error: (err) => this.notificationService.error('Error al aprobar borrador: ' + (err.error?.message || err.message)),
      });
  }

  async rechazar(id: string): Promise<void> {
    const motivo = await this.notificationService.prompt({
      title: 'Rechazo Contable de Borrador',
      message: 'Indique la justificación formal o inconsistencia detectada:',
      placeholder: 'Ej. Concepto contable incorrecto, tercero no coincide...',
      confirmText: 'Rechazar Borrador',
      intent: 'danger',
    });

    if (!motivo || !motivo.trim()) return;

    const usr = this.authService.usuario();
    this.http
      .post(`http://localhost:3000/api/v1/integracion/borradores/${id}/rechazar`, {
        motivo: motivo.trim(),
        revisado_por: usr ? `${usr.nombres} ${usr.apellidos}` : 'Usuario Web',
      })
      .subscribe({
        next: () => {
          this.notificationService.warning('Borrador rechazado y registrado en la pista de auditoría.');
          this.cargarBorradores();
        },
        error: (err) => this.notificationService.error('Error al rechazar borrador: ' + (err.error?.message || err.message)),
      });
  }
}
