import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

interface PucCuenta {
  id: string;
  codigo: string;
  nombre: string;
  nivel: number;
  naturaleza: string;
  es_auxiliar: boolean;
  activo: boolean;
}

@Component({
  selector: 'app-puc-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Plan Único de Cuentas (PUC NIIF)</h2>
          <p class="text-xs text-slate-400 mt-0.5">Catálogo contable estándar para Colombia bajo DUR 2420</p>
        </div>
        <div class="flex items-center gap-3">
          <input
            type="text"
            [(ngModel)]="busqueda"
            placeholder="Buscar por código o nombre..."
            class="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Código</th>
                <th class="py-3 px-4">Nombre de la Cuenta</th>
                <th class="py-3 px-4">Nivel</th>
                <th class="py-3 px-4">Naturaleza</th>
                <th class="py-3 px-4 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (cuenta of cuentasFiltradas(); track cuenta.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-2.5 px-4 font-mono font-medium text-emerald-400">{{ cuenta.codigo }}</td>
                  <td class="py-2.5 px-4 font-medium text-white">{{ cuenta.nombre }}</td>
                  <td class="py-2.5 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      Nivel {{ cuenta.nivel }}
                    </span>
                  </td>
                  <td class="py-2.5 px-4">
                    <span [class]="cuenta.naturaleza === 'DEBITO' ? 'text-indigo-400' : 'text-emerald-400'">
                      {{ cuenta.naturaleza }}
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-center">
                    @if (cuenta.es_auxiliar) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Auxiliar (Imputable)
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                        Mayor
                      </span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-8 text-center text-slate-500 text-xs">
                    Cargando cuentas o no se encontraron resultados...
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
export class PucExplorerComponent implements OnInit {
  cuentas = signal<PucCuenta[]>([]);
  busqueda = '';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<PucCuenta[]>(`http://localhost:3000/api/v1/puc?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.cuentas.set(data),
        error: (err) => console.error('Error cargando PUC:', err),
      });
  }

  cuentasFiltradas(): PucCuenta[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.cuentas();
    return this.cuentas().filter(
      (c) => c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q),
    );
  }
}
