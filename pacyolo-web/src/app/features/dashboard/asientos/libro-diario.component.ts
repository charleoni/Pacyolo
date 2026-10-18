import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

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
  lineas: any[];
}

@Component({
  selector: 'app-libro-diario',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Libro Diario de Comprobantes</h2>
          <p class="text-xs text-slate-400 mt-0.5">Asientos oficiales generados por el Core Ledger con partida doble</p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Comprobante</th>
                <th class="py-3 px-4">Tipo</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Glosa General</th>
                <th class="py-3 px-4 text-right">Débitos</th>
                <th class="py-3 px-4 text-right">Créditos</th>
                <th class="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (asiento of asientos(); track asiento.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-mono font-bold text-white">{{ asiento.numero_comprobante }}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {{ asiento.tipo_comprobante }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-400">{{ asiento.fecha_contable }}</td>
                  <td class="py-3 px-4 font-medium text-slate-200">{{ asiento.glosa_general }}</td>
                  <td class="py-3 px-4 text-right font-mono text-emerald-400">
                    {{ asiento.total_debito | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono text-emerald-400">
                    {{ asiento.total_credito | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [class]="asiento.estado === 'REGISTRADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ asiento.estado }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-8 text-center text-slate-500 text-xs">
                    No hay comprobantes contables registrados para esta empresa todavía.
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
export class LibroDiarioComponent implements OnInit {
  asientos = signal<Asiento[]>([]);

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

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
}
