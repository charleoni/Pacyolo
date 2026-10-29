import { Component, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TerceroItem {
  id: string;
  numero_identificacion: string;
  digito_verificacion?: string;
  razon_social?: string;
  nombre_completo?: string;
  primer_nombre?: string;
  primer_apellido?: string;
  tipo_tercero?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  regimen_fiscal?: string;
  activo?: boolean;
}

@Component({
  selector: 'app-tercero-lookup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
        (keydown.escape)="cerrar()"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <!-- Cabecera del Modal -->
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                🏢
              </span>
              <div>
                <h3 class="text-base font-bold text-white">{{ titulo() }}</h3>
                <p class="text-xs text-slate-400">
                  Total en base de datos: {{ terceros().length }} terceros
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="cerrar()"
              class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              title="Cerrar (Esc)"
            >
              ✕
            </button>
          </div>

          <!-- Barra de Búsqueda y Filtros Rápidos -->
          <div class="p-4 bg-slate-950/50 border-b border-slate-800/80 space-y-3">
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                [(ngModel)]="busqueda"
                placeholder="Buscar por NIT, Cédula, Razón Social, Nombre Comercial, Ciudad o Teléfono..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                autofocus
              />
              @if (busqueda()) {
                <button
                  type="button"
                  (click)="busqueda.set('')"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer text-xs"
                >
                  ✕ Limpiar
                </button>
              }
            </div>

            <!-- Filtros por tipo -->
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="filtroTipo.set('TODOS')"
                  [class]="filtroTipo() === 'TODOS' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Todos
                </button>
                <button
                  type="button"
                  (click)="filtroTipo.set('PROVEEDOR')"
                  [class]="filtroTipo() === 'PROVEEDOR' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  🏢 Proveedores
                </button>
                <button
                  type="button"
                  (click)="filtroTipo.set('CLIENTE')"
                  [class]="filtroTipo() === 'CLIENTE' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  👤 Clientes
                </button>
              </div>

              <div class="text-slate-400 font-mono text-[11px]">
                Mostrando <span class="text-indigo-400 font-semibold">{{ tercerosFiltrados().length }}</span> coincidencias (máx. 50 en pantalla)
              </div>
            </div>
          </div>

          <!-- Tabla de Resultados -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 bg-slate-900/95 backdrop-blur z-10 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3">Identificación / NIT</th>
                  <th class="p-3">Razón Social / Nombre</th>
                  <th class="p-3">Tipo</th>
                  <th class="p-3">Ubicación / Contacto</th>
                  <th class="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                @for (t of tercerosFiltrados(); track t.id) {
                  <tr
                    (dblclick)="seleccionar(t)"
                    class="hover:bg-indigo-950/20 transition cursor-pointer group"
                  >
                    <td class="p-3 font-mono font-bold text-indigo-400">
                      {{ t.numero_identificacion }}{{ t.digito_verificacion ? '-' + t.digito_verificacion : '' }}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-slate-200 group-hover:text-white">
                        {{ t.razon_social || t.nombre_completo || ((t.primer_nombre || '') + ' ' + (t.primer_apellido || '')) }}
                      </div>
                      @if (t.regimen_fiscal) {
                        <div class="text-[10px] text-slate-500 font-mono">{{ t.regimen_fiscal }}</div>
                      }
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/50">
                        {{ t.tipo_tercero || 'TERCERO' }}
                      </span>
                    </td>
                    <td class="p-3 text-slate-400 text-[11px]">
                      <div>{{ t.ciudad || 'No especificada' }}</div>
                      <div class="text-[10px] text-slate-500 font-mono">{{ t.telefono || t.email || '' }}</div>
                    </td>
                    <td class="p-3 text-right">
                      <button
                        type="button"
                        (click)="seleccionar(t)"
                        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow transition cursor-pointer"
                      >
                        Seleccionar ✓
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-12 text-center text-slate-500 space-y-2">
                      <div class="text-3xl">🔍</div>
                      <div class="font-medium text-slate-400">No se encontraron terceros con ese criterio.</div>
                      <div class="text-xs text-slate-600">Intente buscar con otro NIT, Razón Social o limpie el filtro.</div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pie del Modal -->
          <div class="px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/90">
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Tip:</span>
              <span>Doble clic en una fila para seleccionar instantáneamente</span>
            </div>
            <button
              type="button"
              (click)="cerrar()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TerceroLookupModalComponent {
  readonly visible = model<boolean>(false);
  readonly titulo = input<string>('Seleccionar Proveedor / Tercero');
  readonly terceros = input<TerceroItem[]>([]);

  readonly seleccionado = output<TerceroItem>();

  readonly busqueda = signal('');
  readonly filtroTipo = signal<'TODOS' | 'PROVEEDOR' | 'CLIENTE'>('TODOS');

  readonly tercerosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const tipo = this.filtroTipo();
    const lista = this.terceros() || [];

    return lista
      .filter((t) => {
        const matchTipo =
          tipo === 'TODOS' ||
          (t.tipo_tercero && t.tipo_tercero.toUpperCase().includes(tipo));

        if (!matchTipo) return false;
        if (!q) return true;

        const nombre = (t.razon_social || t.nombre_completo || `${t.primer_nombre || ''} ${t.primer_apellido || ''}`).toLowerCase();
        const nit = (t.numero_identificacion || '').toLowerCase();
        const ciudad = (t.ciudad || '').toLowerCase();
        const email = (t.email || '').toLowerCase();
        const tel = (t.telefono || '').toLowerCase();

        return (
          nit.includes(q) ||
          nombre.includes(q) ||
          ciudad.includes(q) ||
          email.includes(q) ||
          tel.includes(q)
        );
      })
      .slice(0, 50); // Limita a 50 resultados para máximo rendimiento 60fps
  });

  seleccionar(tercero: TerceroItem): void {
    this.seleccionado.emit(tercero);
    this.visible.set(false);
  }

  cerrar(): void {
    this.visible.set(false);
  }
}
