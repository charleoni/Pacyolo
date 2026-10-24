import { Component, computed, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdenCompraItem } from '../../core/services/compras.service';

@Component({
  selector: 'app-orden-compra-lookup-modal',
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
                📑
              </span>
              <div>
                <h3 class="text-base font-bold text-white">{{ titulo() }}</h3>
                <p class="text-xs text-slate-400">
                  Órdenes pendientes de recepción en almacén (APROBADA / RECIBIDA PARCIAL)
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

          <!-- Barra de Búsqueda -->
          <div class="p-4 bg-slate-950/50 border-b border-slate-800/80 space-y-3">
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                [(ngModel)]="busqueda"
                placeholder="Buscar por N° OC (OC-0001), NIT, Proveedor, Factura o Bodega..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner font-sans"
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

            <!-- Chips de Filtro Rápido -->
            <div class="flex items-center justify-between text-xs text-slate-400">
              <div class="flex items-center gap-2">
                <span>Estado:</span>
                <button
                  type="button"
                  (click)="filtroEstado.set('')"
                  [class]="filtroEstado() === '' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  Todas ({{ ordenesElegibles().length }})
                </button>
                <button
                  type="button"
                  (click)="filtroEstado.set('APROBADA')"
                  [class]="filtroEstado() === 'APROBADA' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  Aprobadas
                </button>
                <button
                  type="button"
                  (click)="filtroEstado.set('RECIBIDA_PARCIAL')"
                  [class]="filtroEstado() === 'RECIBIDA_PARCIAL' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  Parciales
                </button>
              </div>

              <div class="font-mono text-[11px]">
                Coincidencias: <b class="text-indigo-400">{{ ordenesFiltradas().length }}</b>
              </div>
            </div>
          </div>

          <!-- Listado de Órdenes Coincidentes -->
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            @for (oc of ordenesFiltradas(); track oc.id) {
              <div
                (click)="seleccionar(oc)"
                class="group p-3.5 bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <!-- Datos Principales -->
                <div class="space-y-1 flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono font-bold text-white text-sm group-hover:text-indigo-400 transition">
                      {{ oc.numero_orden }}
                    </span>
                    <span
                      [class]="
                        oc.estado === 'APROBADA'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      "
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ oc.estado }}
                    </span>
                    @if (oc.numero_factura_proveedor) {
                      <span class="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Fac: {{ oc.numero_factura_proveedor }}
                      </span>
                    }
                  </div>

                  <div class="text-xs text-slate-300 font-medium truncate">
                    <span>🏢 {{ oc.proveedor?.nombre_completo || 'Proveedor Varios' }}</span>
                    @if (oc.proveedor?.numero_identificacion) {
                      <span class="text-slate-500 font-mono ml-1.5">[NIT: {{ oc.proveedor?.numero_identificacion }}]</span>
                    }
                  </div>

                  <div class="flex items-center gap-4 text-[11px] text-slate-400 font-mono flex-wrap">
                    <span>📅 Emisión: {{ oc.fecha_emision }}</span>
                    <span>📍 Bodega: {{ oc.bodega_destino?.nombre || 'Bodega Principal' }}</span>
                    <span class="text-indigo-300">📦 {{ totalItemsPendientes(oc) }} ítems pendientes</span>
                  </div>
                </div>

                <!-- Monto y Botón de Selección -->
                <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div class="text-left sm:text-right font-mono">
                    <div class="text-sm font-bold text-emerald-400">
                      \${{ Number(oc.total).toLocaleString('es-CO') }}
                    </div>
                    <div class="text-[10px] text-slate-500">
                      {{ oc.condicion_pago || 'CONTADO' }}
                    </div>
                  </div>

                  <button
                    type="button"
                    class="px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1"
                  >
                    <span>Vincular</span>
                    <span>➜</span>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center text-slate-500 space-y-2">
                <span class="text-3xl block">📭</span>
                <p class="text-sm font-medium text-slate-400">
                  No se encontraron órdenes de compra pendientes que coincidan con la búsqueda.
                </p>
                <p class="text-xs text-slate-600">
                  Solo se listan órdenes aprobadas o con recepciones parciales pendientes.
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
export class OrdenCompraLookupModalComponent {
  readonly Number = Number;

  readonly visible = model<boolean>(false);
  readonly ordenes = input<OrdenCompraItem[]>([]);
  readonly titulo = input<string>('Seleccionar Orden de Compra Pendiente');

  readonly ordenSeleccionada = output<OrdenCompraItem>();
  readonly cancelar = output<void>();

  readonly busqueda = signal('');
  readonly filtroEstado = signal<string>('');

  // Filtra solo las órdenes pendientes (APROBADA o RECIBIDA_PARCIAL)
  readonly ordenesElegibles = computed(() => {
    return this.ordenes().filter((oc) => {
      return oc.estado === 'APROBADA' || oc.estado === 'RECIBIDA_PARCIAL';
    });
  });

  readonly ordenesFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const st = this.filtroEstado();
    const base = this.ordenesElegibles();

    return base.filter((oc) => {
      const matchEstado = !st || oc.estado === st;
      if (!matchEstado) return false;
      if (!q) return true;

      return (
        (oc.numero_orden && oc.numero_orden.toLowerCase().includes(q)) ||
        (oc.numero_factura_proveedor && oc.numero_factura_proveedor.toLowerCase().includes(q)) ||
        (oc.proveedor?.nombre_completo && oc.proveedor.nombre_completo.toLowerCase().includes(q)) ||
        (oc.proveedor?.numero_identificacion && oc.proveedor.numero_identificacion.toLowerCase().includes(q)) ||
        (oc.bodega_destino?.nombre && oc.bodega_destino.nombre.toLowerCase().includes(q)) ||
        (oc.fecha_emision && oc.fecha_emision.includes(q))
      );
    });
  });

  totalItemsPendientes(oc: OrdenCompraItem): number {
    if (!oc.lineas) return 0;
    return oc.lineas.reduce((acc, l) => {
      const pend = Math.max(0, Number(l.cantidad_solicitada) - Number(l.cantidad_recibida || 0));
      return acc + (pend > 0 ? 1 : 0);
    }, 0);
  }

  seleccionar(oc: OrdenCompraItem): void {
    this.ordenSeleccionada.emit(oc);
    this.visible.set(false);
  }

  cerrar(): void {
    this.visible.set(false);
    this.cancelar.emit();
  }
}
