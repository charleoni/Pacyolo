import { Component, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArticuloItem } from '../../core/services/inventarios.service';

export type ArticuloLookupItem = ArticuloItem;

@Component({
  selector: 'app-articulo-lookup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
        (keydown.escape)="cerrar()"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <!-- Cabecera del Modal -->
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                📦
              </span>
              <div>
                <h3 class="text-base font-bold text-white">{{ titulo() }}</h3>
                <p class="text-xs text-slate-400">
                  Total en catálogo: {{ articulos().length }} artículos
                  @if (modoSeleccion() === 'MULTIPLE') {
                    <span class="text-emerald-400 font-semibold ml-2">• Modo Selección Múltiple Activo</span>
                  }
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
                placeholder="Buscar por Código SKU, Nombre de producto, Código de barras o Categoría..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner font-sans"
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

            <!-- Resumen de estado -->
            <div class="flex items-center justify-between text-xs text-slate-400">
              <div class="flex items-center gap-2">
                <span>Mostrando <span class="text-emerald-400 font-semibold">{{ articulosFiltrados().length }}</span> artículos</span>
                <span class="text-slate-600">|</span>
                <span class="text-slate-500 text-[11px]">Renderizado optimizado (máx. 50 resultados)</span>
              </div>

              @if (modoSeleccion() === 'MULTIPLE' && idsSeleccionados().size > 0) {
                <div class="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                  {{ idsSeleccionados().size }} artículo(s) marcado(s)
                </div>
              }
            </div>
          </div>

          <!-- Tabla de Artículos -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 bg-slate-900/95 backdrop-blur z-10 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  @if (modoSeleccion() === 'MULTIPLE') {
                    <th class="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        [checked]="todosFiltradosSeleccionados()"
                        (change)="alternarTodosFiltrados()"
                        class="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                        title="Seleccionar todos los visibles"
                      />
                    </th>
                  }
                  <th class="p-3">Código / SKU</th>
                  <th class="p-3">Descripción / Artículo</th>
                  <th class="p-3">Categoría</th>
                  <th class="p-3 text-right">Stock</th>
                  <th class="p-3 text-right">Costo Ref.</th>
                  <th class="p-3 text-center">IVA</th>
                  <th class="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/40">
                @for (a of articulosFiltrados(); track a.id) {
                  <tr
                    (dblclick)="alDobleClic(a)"
                    [class.bg-emerald-950/20]="idsSeleccionados().has(a.id)"
                    class="hover:bg-slate-800/50 transition cursor-pointer group"
                  >
                    @if (modoSeleccion() === 'MULTIPLE') {
                      <td class="p-3 text-center" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [checked]="idsSeleccionados().has(a.id)"
                          (change)="alternarSeleccion(a)"
                          class="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    }
                    <td class="p-3 font-mono font-bold text-emerald-400">
                      {{ a.codigo }}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-slate-200 group-hover:text-white">
                        {{ a.nombre }}
                      </div>
                      @if (a.codigo_barras) {
                        <div class="text-[10px] text-slate-500 font-mono">Barras: {{ a.codigo_barras }}</div>
                      }
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50">
                        {{ a.categoria?.nombre || 'General' }}
                      </span>
                    </td>
                    <td class="p-3 text-right font-mono font-semibold">
                      <span
                        [class]="Number(a.stock_actual || 0) <= 0
                          ? 'text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded'
                          : Number(a.stock_actual || 0) <= Number(a.stock_minimo || 0)
                          ? 'text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded'
                          : 'text-slate-300'"
                      >
                        {{ Number(a.stock_actual || 0).toLocaleString('es-CO') }}
                      </span>
                    </td>
                    <td class="p-3 text-right font-mono text-slate-200">
                      \${{ Number(a.costo_promedio || 0).toLocaleString('es-CO') }}
                    </td>
                    <td class="p-3 text-center font-mono text-indigo-400 text-xs font-semibold">
                      {{ Number(a.tarifa_iva ?? 19) }}%
                    </td>
                    <td class="p-3 text-right">
                      @if (modoSeleccion() === 'INDIVIDUAL') {
                        <button
                          type="button"
                          (click)="seleccionarIndividual(a)"
                          class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition cursor-pointer"
                        >
                          Seleccionar ✓
                        </button>
                      } @else {
                        <button
                          type="button"
                          (click)="alternarSeleccion(a)"
                          [class]="idsSeleccionados().has(a.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'"
                          class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          {{ idsSeleccionados().has(a.id) ? '✓ Marcado' : '+ Marcar' }}
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="modoSeleccion() === 'MULTIPLE' ? 8 : 7" class="p-12 text-center text-slate-500 space-y-2">
                      <div class="text-3xl">📦</div>
                      <div class="font-medium text-slate-400">No se encontraron artículos con ese término.</div>
                      <div class="text-xs text-slate-600">Verifique el SKU, nombre o limpie el término de búsqueda.</div>
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
              <span>Doble clic en un artículo para seleccionarlo rápidamente</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="cerrar()"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
              >
                Cerrar
              </button>

              @if (modoSeleccion() === 'MULTIPLE') {
                <button
                  type="button"
                  (click)="confirmarSeleccionMultiple()"
                  [disabled]="idsSeleccionados().size === 0"
                  class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-40"
                >
                  Agregar {{ idsSeleccionados().size }} artículo(s) seleccionados ✓
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ArticuloLookupModalComponent {
  readonly visible = model<boolean>(false);
  readonly titulo = input<string>('Catálogo y Búsqueda de Artículos');
  readonly articulos = input<ArticuloLookupItem[]>([]);
  readonly modoSeleccion = input<'INDIVIDUAL' | 'MULTIPLE'>('INDIVIDUAL');

  readonly articuloSeleccionado = output<ArticuloLookupItem>();
  readonly articulosSeleccionados = output<ArticuloLookupItem[]>();

  readonly Number = Number;
  readonly busqueda = signal('');
  readonly idsSeleccionados = signal<Set<string>>(new Set());

  readonly articulosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const lista = this.articulos() || [];

    return lista
      .filter((a) => {
        if (!q) return true;
        const cod = (a.codigo || '').toLowerCase();
        const nom = (a.nombre || '').toLowerCase();
        const bar = (a.codigo_barras || '').toLowerCase();
        const cat = (a.categoria?.nombre || '').toLowerCase();

        return cod.includes(q) || nom.includes(q) || bar.includes(q) || cat.includes(q);
      })
      .slice(0, 50); // Mantiene 60 FPS fluidos ante miles de registros
  });

  readonly todosFiltradosSeleccionados = computed(() => {
    const filtrados = this.articulosFiltrados();
    if (filtrados.length === 0) return false;
    const marcados = this.idsSeleccionados();
    return filtrados.every((a) => marcados.has(a.id));
  });

  alternarSeleccion(articulo: ArticuloLookupItem): void {
    const nuevos = new Set(this.idsSeleccionados());
    if (nuevos.has(articulo.id)) {
      nuevos.delete(articulo.id);
    } else {
      nuevos.add(articulo.id);
    }
    this.idsSeleccionados.set(nuevos);
  }

  alternarTodosFiltrados(): void {
    const filtrados = this.articulosFiltrados();
    const nuevos = new Set(this.idsSeleccionados());
    const todosMarcados = filtrados.every((a) => nuevos.has(a.id));

    if (todosMarcados) {
      filtrados.forEach((a) => nuevos.delete(a.id));
    } else {
      filtrados.forEach((a) => nuevos.add(a.id));
    }
    this.idsSeleccionados.set(nuevos);
  }

  seleccionarIndividual(articulo: ArticuloLookupItem): void {
    this.articuloSeleccionado.emit(articulo);
    this.visible.set(false);
  }

  alDobleClic(articulo: ArticuloLookupItem): void {
    if (this.modoSeleccion() === 'INDIVIDUAL') {
      this.seleccionarIndividual(articulo);
    } else {
      this.alternarSeleccion(articulo);
    }
  }

  confirmarSeleccionMultiple(): void {
    const seleccionados = this.articulos().filter((a) => this.idsSeleccionados().has(a.id));
    this.articulosSeleccionados.emit(seleccionados);
    this.idsSeleccionados.set(new Set());
    this.visible.set(false);
  }

  cerrar(): void {
    this.idsSeleccionados.set(new Set());
    this.visible.set(false);
  }
}
