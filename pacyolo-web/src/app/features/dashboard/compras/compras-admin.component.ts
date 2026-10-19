import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComprasService, OrdenCompraItem } from '../../../core/services/compras.service';
import { InventariosService, ArticuloItem } from '../../../core/services/inventarios.service';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';

@Component({
  selector: 'app-compras-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado Principal -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <span>CIRCUITO DE ABASTECIMIENTO & COMPRAS</span>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📑</span>
            <span>Órdenes de Compra a Proveedores</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Gestión documental de pedidos de mercancía previa a la recepción física y causación de facturas.
          </p>
        </div>

        <button
          (click)="abrirModalNuevaOrden()"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>+ Nueva Orden de Compra</span>
        </button>
      </div>

      <!-- Filtros de Órdenes -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <input
            type="text"
            [(ngModel)]="busquedaOrden"
            placeholder="Buscar por número de orden o proveedor..."
            class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
        </div>

        <select
          [(ngModel)]="filtroEstado"
          class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="BORRADOR">📝 BORRADOR</option>
          <option value="APROBADA">✅ APROBADA</option>
          <option value="RECIBIDA_PARCIAL">📦 RECIBIDA PARCIAL</option>
          <option value="RECIBIDA_TOTAL">🎉 RECIBIDA TOTAL</option>
          <option value="CANCELADA">❌ CANCELADA</option>
        </select>
      </div>

      <!-- Tabla de Órdenes de Compra -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th class="p-3.5">N° Orden</th>
                <th class="p-3.5">Fecha Emisión</th>
                <th class="p-3.5">Proveedor</th>
                <th class="p-3.5">Bodega Destino</th>
                <th class="p-3.5 text-center">Ítems</th>
                <th class="p-3.5 text-right">Subtotal</th>
                <th class="p-3.5 text-right">IVA</th>
                <th class="p-3.5 text-right">Total Pedido</th>
                <th class="p-3.5 text-center">Estado</th>
                <th class="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              @for (orden of ordenesFiltradas(); track orden.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="p-3.5 font-mono font-bold text-white">{{ orden.numero_orden }}</td>
                  <td class="p-3.5 text-slate-400 font-mono">{{ orden.fecha_emision }}</td>
                  <td class="p-3.5 font-medium text-white">{{ orden.proveedor?.nombre_completo || 'Proveedor Varios' }}</td>
                  <td class="p-3.5 text-slate-300">{{ orden.bodega_destino?.nombre || 'Bodega Principal' }}</td>
                  <td class="p-3.5 text-center font-mono">{{ orden.lineas?.length || 0 }}</td>
                  <td class="p-3.5 text-right font-mono text-slate-300">
                    \${{ Number(orden.subtotal).toLocaleString('es-CO') }}
                  </td>
                  <td class="p-3.5 text-right font-mono text-slate-400">
                    \${{ Number(orden.total_impuestos).toLocaleString('es-CO') }}
                  </td>
                  <td class="p-3.5 text-right font-mono font-bold text-indigo-300">
                    \${{ Number(orden.total).toLocaleString('es-CO') }}
                  </td>
                  <td class="p-3.5 text-center">
                    <span
                      [class]="
                        orden.estado === 'APROBADA'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : orden.estado === 'RECIBIDA_TOTAL'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : orden.estado === 'RECIBIDA_PARCIAL'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : orden.estado === 'CANCELADA'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                      "
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ orden.estado }}
                    </span>
                  </td>
                  <td class="p-3.5 text-right space-x-1">
                    @if (orden.estado === 'BORRADOR') {
                      <button
                        (click)="cambiarEstado(orden, 'APROBADA')"
                        class="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Aprobar Orden"
                      >
                        Aprobar
                      </button>
                    }
                    @if (orden.estado === 'BORRADOR' || orden.estado === 'APROBADA') {
                      <button
                        (click)="cambiarEstado(orden, 'CANCELADA')"
                        class="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Cancelar Orden"
                      >
                        Cancelar
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" class="p-8 text-center text-slate-500">
                    No se encontraron órdenes de compra registradas.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: NUEVA ORDEN DE COMPRA                                              -->
      <!-- ========================================================================= -->
      @if (mostrarModal()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📑</span>
                <span>Crear Nueva Orden de Compra a Proveedor</span>
              </h3>
              <button (click)="mostrarModal.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Proveedor *</label>
                <select
                  [(ngModel)]="nuevaOrden.proveedor_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione proveedor...</option>
                  @for (p of proveedores(); track p.id) {
                    <option [value]="p.id">{{ p.nombre_completo }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Bodega de Destino</label>
                <select
                  [(ngModel)]="nuevaOrden.bodega_destino_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione bodega...</option>
                  @for (b of bodegas(); track b.id) {
                    <option [value]="b.id">{{ b.nombre }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Fecha Entrega Esperada</label>
                <input
                  type="date"
                  [(ngModel)]="nuevaOrden.fecha_entrega_esperada"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div class="sm:col-span-3">
                <label class="block font-semibold text-slate-300 mb-1">Observaciones / Condiciones Comerciales</label>
                <input
                  type="text"
                  [(ngModel)]="nuevaOrden.observaciones"
                  placeholder="Ej: Plazo de pago 30 días, flete incluido..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Líneas de Artículos de la Orden -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Líneas de la Orden</span>
                <button
                  type="button"
                  (click)="agregarLinea()"
                  class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  + Agregar Fila
                </button>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
                @for (lin of nuevaOrden.lineas; track $index) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <div class="col-span-5">
                      <select
                        [(ngModel)]="lin.articulo_id"
                        (change)="alSeleccionarArticulo(lin)"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                      >
                        <option value="">Seleccione artículo...</option>
                        @for (a of articulos(); track a.id) {
                          <option [value]="a.id">[{{ a.codigo }}] {{ a.nombre }}</option>
                        }
                      </select>
                    </div>

                    <div class="col-span-2">
                      <input
                        type="number"
                        [(ngModel)]="lin.cantidad_solicitada"
                        placeholder="Cant"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-3">
                      <input
                        type="number"
                        [(ngModel)]="lin.costo_unitario"
                        placeholder="Costo"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-1 text-right font-mono text-slate-400 text-[10px]">
                      {{ lin.porcentaje_iva }}%
                    </div>

                    <div class="col-span-1 text-center">
                      <button (click)="removerLinea($index)" class="text-slate-500 hover:text-rose-400 cursor-pointer">✕</button>
                    </div>
                  </div>
                }
              </div>

              <!-- Resumen de Totales en Tiempo Real -->
              <div class="flex justify-end pt-2 text-xs font-mono">
                <div class="w-64 space-y-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <div class="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>\${{ calcularSubtotal().toLocaleString('es-CO') }}</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>IVA (Estimado):</span>
                    <span>\${{ calcularImpuestos().toLocaleString('es-CO') }}</span>
                  </div>
                  <div class="flex justify-between text-white font-bold border-t border-slate-800 pt-1 text-sm">
                    <span>Total Pedido:</span>
                    <span class="text-indigo-400">\${{ calcularTotal().toLocaleString('es-CO') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
              <button
                (click)="mostrarModal.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="guardarOrden()"
                [disabled]="!nuevaOrden.proveedor_id || nuevaOrden.lineas.length === 0 || guardando()"
                class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                {{ guardando() ? 'Generando...' : 'Generar Orden de Compra' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ComprasAdminComponent implements OnInit {
  private readonly comprasService = inject(ComprasService);
  private readonly inventariosService = inject(InventariosService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly http = inject(HttpClient);

  readonly Number = Number;

  readonly ordenes = signal<OrdenCompraItem[]>([]);
  readonly articulos = signal<ArticuloItem[]>([]);
  readonly bodegas = signal<ParametroItem[]>([]);
  readonly proveedores = signal<any[]>([]);

  busquedaOrden = '';
  filtroEstado = '';

  readonly mostrarModal = signal(false);
  readonly guardando = signal(false);

  nuevaOrden: any = {
    proveedor_id: '',
    bodega_destino_id: '',
    fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_entrega_esperada: '',
    observaciones: '',
    lineas: [{ articulo_id: '', cantidad_solicitada: 10, costo_unitario: 0, porcentaje_iva: 19 }],
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
    this.inventariosService.listarArticulos().subscribe((arts) => this.articulos.set(arts));
    this.parametrosService.obtenerBodegas().subscribe((bods: ParametroItem[]) => this.bodegas.set(bods));
    this.http.get<any[]>('http://localhost:3000/api/v1/terceros').subscribe((ts) => this.proveedores.set(ts));
  }

  ordenesFiltradas(): OrdenCompraItem[] {
    const q = this.busquedaOrden.toLowerCase().trim();
    const est = this.filtroEstado;

    return this.ordenes().filter((o) => {
      const matchQ =
        !q ||
        o.numero_orden.toLowerCase().includes(q) ||
        (o.proveedor?.nombre_completo && o.proveedor.nombre_completo.toLowerCase().includes(q));
      const matchEst = !est || o.estado === est;
      return matchQ && matchEst;
    });
  }

  abrirModalNuevaOrden(): void {
    this.nuevaOrden = {
      proveedor_id: this.proveedores()[0]?.id || '',
      bodega_destino_id: this.bodegas()[0]?.id || '',
      fecha_emision: new Date().toISOString().slice(0, 10),
      fecha_entrega_esperada: '',
      observaciones: '',
      lineas: [
        {
          articulo_id: this.articulos()[0]?.id || '',
          cantidad_solicitada: 10,
          costo_unitario: this.articulos()[0]?.costo_promedio || 0,
          porcentaje_iva: this.articulos()[0]?.tarifa_iva ?? 19,
        },
      ],
    };
    this.mostrarModal.set(true);
  }

  alSeleccionarArticulo(lin: any): void {
    const art = this.articulos().find((a) => a.id === lin.articulo_id);
    if (art) {
      lin.costo_unitario = Number(art.costo_promedio) || 0;
      lin.porcentaje_iva = Number(art.tarifa_iva) ?? 19;
    }
  }

  agregarLinea(): void {
    this.nuevaOrden.lineas.push({
      articulo_id: this.articulos()[0]?.id || '',
      cantidad_solicitada: 1,
      costo_unitario: 0,
      porcentaje_iva: 19,
    });
  }

  removerLinea(index: number): void {
    this.nuevaOrden.lineas.splice(index, 1);
  }

  calcularSubtotal(): number {
    return this.nuevaOrden.lineas.reduce((acc: number, l: any) => {
      return acc + (Number(l.cantidad_solicitada) || 0) * (Number(l.costo_unitario) || 0);
    }, 0);
  }

  calcularImpuestos(): number {
    return this.nuevaOrden.lineas.reduce((acc: number, l: any) => {
      const sub = (Number(l.cantidad_solicitada) || 0) * (Number(l.costo_unitario) || 0);
      return acc + (sub * (Number(l.porcentaje_iva) || 0)) / 100;
    }, 0);
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularImpuestos();
  }

  guardarOrden(): void {
    this.guardando.set(true);
    this.comprasService.crearOrden(this.nuevaOrden).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
      },
      error: (err) => {
        this.guardando.set(false);
        alert(err.error?.message || 'Error al crear la orden de compra');
      },
    });
  }

  cambiarEstado(orden: OrdenCompraItem, nuevoEstado: string): void {
    this.comprasService.cambiarEstado(orden.id, nuevoEstado).subscribe(() => {
      this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
    });
  }
}
