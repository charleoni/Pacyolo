import { Component, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CuentaPucLookupItem {
  id: string;
  codigo: string;
  nombre: string;
  naturaleza?: string;
  es_auxiliar?: boolean;
  nivel?: number;
}

@Component({
  selector: 'app-puc-lookup-modal',
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
              <span class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                📑
              </span>
              <div>
                <h3 class="text-base font-bold text-white">{{ titulo() }}</h3>
                <p class="text-xs text-slate-400">
                  Selección de cuentas contables del PUC NIIF para contabilización
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
                placeholder="Buscar por código (ej. 1105, 1435, 2205) o nombre de cuenta..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner font-mono"
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

            <!-- Filtros de Clase Contable -->
            <div class="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-slate-500">Clase:</span>
                <button
                  type="button"
                  (click)="filtroClase.set('')"
                  [class]="filtroClase() === '' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  Todas ({{ cuentas().length }})
                </button>
                <button
                  type="button"
                  (click)="filtroClase.set('1')"
                  [class]="filtroClase() === '1' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  1 Activo
                </button>
                <button
                  type="button"
                  (click)="filtroClase.set('2')"
                  [class]="filtroClase() === '2' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  2 Pasivo
                </button>
                <button
                  type="button"
                  (click)="filtroClase.set('3')"
                  [class]="filtroClase() === '3' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  3 Patrimonio
                </button>
                <button
                  type="button"
                  (click)="filtroClase.set('4')"
                  [class]="filtroClase() === '4' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  4 Ingresos
                </button>
                <button
                  type="button"
                  (click)="filtroClase.set('5')"
                  [class]="filtroClase() === '5' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  5 Gastos
                </button>
                <button
                  type="button"
                  (click)="filtroClase.set('6')"
                  [class]="filtroClase() === '6' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  6 Costos
                </button>
              </div>

              <div class="font-mono text-[11px]">
                Coincidencias: <b class="text-emerald-400">{{ cuentasFiltradas().length }}</b>
              </div>
            </div>
          </div>

          <!-- Listado de Cuentas PUC -->
          <div class="flex-1 overflow-y-auto p-4 space-y-1.5">
            @for (cuenta of cuentasFiltradas(); track cuenta.id) {
              <div
                (click)="seleccionar(cuenta)"
                class="group p-3 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3"
              >
                <!-- Código y Nombre -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <span class="font-mono font-bold text-emerald-400 text-sm group-hover:text-emerald-300 transition whitespace-nowrap">
                    {{ cuenta.codigo }}
                  </span>
                  <div class="truncate text-xs text-slate-200 group-hover:text-white font-medium">
                    {{ cuenta.nombre }}
                  </div>
                </div>

                <!-- Naturaleza y Selección -->
                <div class="flex items-center gap-3 shrink-0">
                  <span
                    [class]="cuenta.naturaleza === 'DEBITO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                  >
                    {{ cuenta.naturaleza || 'DÉBITO' }}
                  </span>

                  <button
                    type="button"
                    class="px-3 py-1 bg-emerald-600/30 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <span>Seleccionar</span>
                    <span>➜</span>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center text-slate-500 space-y-2">
                <span class="text-3xl block">📑</span>
                <p class="text-sm font-medium text-slate-400">
                  No se encontraron cuentas contables que coincidan con la búsqueda.
                </p>
                <p class="text-xs text-slate-600">
                  Verifique el código o el nombre ingresado.
                </p>
              </div>
            }
          </div>

          <!-- Pie del Modal -->
          <div class="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
            <span>Presione <kbd class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Esc</kbd> para cerrar</span>
            <button
              type="button"
              (click)="cerrar()"
              class="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PucLookupModalComponent {
  readonly visible = model<boolean>(false);
  readonly cuentas = input<CuentaPucLookupItem[]>([]);
  readonly titulo = input<string>('Catálogo PUC - Selección de Cuenta Contable');

  readonly cuentaSeleccionada = output<CuentaPucLookupItem>();
  readonly cancelar = output<void>();

  readonly busqueda = signal('');
  readonly filtroClase = signal<string>('');

  readonly cuentasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const clase = this.filtroClase();
    const all = this.cuentas();

    return all
      .filter((c) => {
        const matchClase = !clase || (c.codigo && c.codigo.startsWith(clase));
        if (!matchClase) return false;
        if (!q) return true;
        return (
          (c.codigo && c.codigo.toLowerCase().includes(q)) ||
          (c.nombre && c.nombre.toLowerCase().includes(q))
        );
      })
      .slice(0, 50); // Capped at 50 for smooth 60 FPS
  });

  seleccionar(cuenta: CuentaPucLookupItem): void {
    this.cuentaSeleccionada.emit(cuenta);
    this.visible.set(false);
  }

  cerrar(): void {
    this.visible.set(false);
    this.cancelar.emit();
  }
}
