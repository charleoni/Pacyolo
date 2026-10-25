import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  InventariosService,
  ArticuloItem,
  EntradaAlmacenItem,
  KardexMovimientoItem,
  NotaAjusteItem,
  SaldoBodegaItem,
} from '../../../core/services/inventarios.service';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ComprasService, OrdenCompraItem } from '../../../core/services/compras.service';
import { TerceroLookupModalComponent } from '../../../shared/components/tercero-lookup-modal.component';
import { ArticuloLookupModalComponent } from '../../../shared/components/articulo-lookup-modal.component';
import { OrdenCompraLookupModalComponent } from '../../../shared/components/orden-compra-lookup-modal.component';
import { TablePaginationComponent } from '../../../shared/components/table-pagination.component';

@Component({
  selector: 'app-articulos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TerceroLookupModalComponent, ArticuloLookupModalComponent, TablePaginationComponent, OrdenCompraLookupModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Encabezado Principal -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-indigo-400 mb-1">
            <span>GESTIÓN DE CADENA DE SUMINISTRO (NIC 2)</span>
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📦</span>
            <span>Inventarios, Kardex & Catálogo Maestro</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Control físico y valorado de mercancías bajo costeo promedio ponderado móvil, recepciones y notas de ajuste.
          </p>
        </div>

        <div class="flex items-center gap-3">
          @if (pestanaActiva() === 'articulos') {
            <button
              (click)="abrirModalArticulo()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>+ Nuevo Artículo / Servicio</span>
            </button>
          } @else if (pestanaActiva() === 'entradas') {
            <button
              (click)="abrirModalEntrada()"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>+ Nueva Entrada de Almacén</span>
            </button>
          } @else if (pestanaActiva() === 'ajustes') {
            <button
              (click)="abrirModalAjuste()"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>+ Registrar Ajuste o Devolución</span>
            </button>
          } @else if (pestanaActiva() === 'traslados') {
            <button
              (click)="abrirModalTraslado()"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>+ Nuevo Traslado entre Bodegas</span>
            </button>
          }
        </div>
      </div>

      <!-- Barra de Pestañas -->
      <div class="flex items-center gap-1 border-b border-slate-800 pb-px overflow-x-auto text-xs">
        <button
          (click)="pestanaActiva.set('articulos')"
          [class]="pestanaActiva() === 'articulos' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>📦 Catálogo de Artículos</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {{ articulos().length }}
          </span>
        </button>

        <button
          (click)="pestanaActiva.set('entradas')"
          [class]="pestanaActiva() === 'entradas' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>📥 Entradas de Almacén</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {{ entradas().length }}
          </span>
        </button>

        <button
          (click)="pestanaActiva.set('traslados'); cargarTraslados()"
          [class]="pestanaActiva() === 'traslados' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>🔄 Traslados entre Bodegas</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {{ traslados().length }}
          </span>
        </button>

        <button
          (click)="pestanaActiva.set('kardex'); cargarKardex()"
          [class]="pestanaActiva() === 'kardex' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>⚖️ Kardex Continuo NIIF</span>
        </button>

        <button
          (click)="pestanaActiva.set('ajustes')"
          [class]="pestanaActiva() === 'ajustes' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>📝 Notas de Ajuste & Devoluciones</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {{ ajustes().length }}
          </span>
        </button>

        <button
          (click)="pestanaActiva.set('existencias'); cargarExistencias()"
          [class]="pestanaActiva() === 'existencias' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>🏢 Existencias por Bodega</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- PESTAÑA 1: CATÁLOGO DE ARTÍCULOS                                          -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'articulos') {
        <div class="space-y-4">
          <!-- Filtros de búsqueda -->
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="relative flex-1 w-full">
              <input
                type="text"
                [(ngModel)]="busquedaArticulo"
                (ngModelChange)="filtrarArticulos()"
                placeholder="Buscar por código SKU, nombre o código de barras..."
                class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <select
                [(ngModel)]="filtroTipoArticulo"
                (change)="filtrarArticulos()"
                class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todos los tipos</option>
                <option value="INVENTARIABLE">📦 Inventariable</option>
                <option value="SERVICIO">🛠️ Servicio</option>
                <option value="CONSUMIBLE">📎 Consumible / Gasto</option>
              </select>
            </div>
          </div>

          <!-- Tabla de Artículos -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-950">
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">Código / SKU</th>
                    <th class="p-3.5">Artículo / Descripción</th>
                    <th class="p-3.5">Tipo & Categoría</th>
                    <th class="p-3.5 text-right">Stock Actual</th>
                    <th class="p-3.5 text-right">Costo Promedio</th>
                    <th class="p-3.5 text-right">Precio Sugerido</th>
                    <th class="p-3.5 text-center">IVA</th>
                    <th class="p-3.5 text-center">Estado</th>
                    <th class="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (art of articulosPaginados(); track art.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-mono font-semibold text-white">
                        {{ art.codigo }}
                        @if (art.codigo_barras) {
                          <div class="text-[10px] text-slate-500 font-normal">EAN: {{ art.codigo_barras }}</div>
                        }
                      </td>
                      <td class="p-3.5 max-w-xs">
                        <div class="font-medium text-white truncate">{{ art.nombre }}</div>
                        <div class="text-[11px] text-slate-400 truncate">{{ art.descripcion || 'Sin descripción adicional' }}</div>
                      </td>
                      <td class="p-3.5">
                        <span
                          [class]="
                            art.tipo_articulo === 'INVENTARIABLE'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : art.tipo_articulo === 'SERVICIO'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          "
                          class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        >
                          {{ art.tipo_articulo }}
                        </span>
                        <div class="text-[11px] text-slate-400 mt-1">
                          {{ art.categoria?.nombre || 'General' }} ({{ art.unidad_medida?.codigo || 'UND' }})
                        </div>
                      </td>
                      <td class="p-3.5 text-right font-mono font-bold">
                        <span [class]="Number(art.stock_actual) <= Number(art.stock_minimo) ? 'text-rose-400' : 'text-emerald-400'">
                          {{ Number(art.stock_actual).toLocaleString('es-CO') }}
                        </span>
                        <div class="text-[10px] text-slate-500 font-normal">Min: {{ art.stock_minimo }}</div>
                      </td>
                      <td class="p-3.5 text-right font-mono text-slate-300">
                        \${{ Number(art.costo_promedio).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-right font-mono font-semibold text-indigo-300">
                        \${{ Number(art.precio_venta_sugerido).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-center font-mono">
                        <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {{ art.tarifa_iva }}%
                        </span>
                      </td>
                      <td class="p-3.5 text-center">
                        <button
                          (click)="cambiarEstadoArticulo(art)"
                          [class]="art.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
                          class="px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:opacity-80 transition"
                        >
                          {{ art.activo ? 'ACTIVO' : 'INACTIVO' }}
                        </button>
                      </td>
                      <td class="p-3.5 text-right space-x-1">
                        <button
                          (click)="editarArticulo(art)"
                          class="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                          title="Editar Ficha"
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="p-8 text-center text-slate-500">
                        No se encontraron artículos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-table-pagination
              [totalItems]="articulosFiltrados().length"
              [currentPage]="paginaArticulos()"
              [pageSize]="tamanoArticulos()"
              (pageChange)="paginaArticulos.set($event)"
              (pageSizeChange)="tamanoArticulos.set($event); paginaArticulos.set(1)"
            />
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 2: ENTRADAS DE ALMACÉN                                            -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'entradas') {
        <div class="space-y-4">
          <!-- Barra de Búsqueda y Filtros de Entradas -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="relative w-full sm:w-96">
              <input
                type="text"
                [(ngModel)]="busquedaEntrada"
                placeholder="Buscar por N° Entrada (EA-...), Proveedor, Remisión o Bodega..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
              <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
              @if (busquedaEntrada) {
                <button (click)="busquedaEntrada = ''" class="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer">✕</button>
              }
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>Registros: <span class="text-emerald-400 font-bold font-mono">{{ entradasFiltradas().length }}</span></span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-950">
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">N° Entrada</th>
                    <th class="p-3.5">Fecha</th>
                    <th class="p-3.5">Proveedor</th>
                    <th class="p-3.5">Bodega Destino</th>
                    <th class="p-3.5">Remisión</th>
                    <th class="p-3.5 text-center">Factura / CxP</th>
                    <th class="p-3.5 text-center">Ítems</th>
                    <th class="p-3.5 text-right">Total Valorado</th>
                    <th class="p-3.5 text-center">Estado</th>
                    <th class="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (ent of entradasPaginadas(); track ent.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-mono">
                        <div class="font-bold text-white">{{ ent.numero_entrada }}</div>
                        @if (ent.orden_compra || ent.orden_compra_id) {
                          <div class="text-[10px] text-indigo-400 font-sans font-medium flex items-center gap-1">
                            <span>OC: {{ ent.orden_compra?.numero_orden || 'Vinculada' }}</span>
                            <span class="text-slate-500">•</span>
                            <span class="text-emerald-400 font-bold">Entr #{{ ent.numero_entrega || 1 }}</span>
                          </div>
                        }
                      </td>
                      <td class="p-3.5 text-slate-400 font-mono">{{ ent.fecha_entrada }}</td>
                      <td class="p-3.5 font-medium text-white">{{ ent.proveedor?.nombre_completo || 'Proveedor Varios' }}</td>
                      <td class="p-3.5 text-slate-300">{{ ent.bodega?.nombre || 'Bodega Principal' }}</td>
                      <td class="p-3.5 font-mono text-slate-400">{{ ent.numero_remision_proveedor || 'N/A' }}</td>
                      <td class="p-3.5 text-center">
                        @if (ent.numero_factura_proveedor || ent.cxp_id) {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono" title="Causada en Cuentas por Pagar">
                            💳 {{ ent.numero_factura_proveedor || 'Facturada' }}
                          </span>
                        } @else {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Pendiente de facturar / Solo remisión">
                            📦 Remisión
                          </span>
                        }
                      </td>
                      <td class="p-3.5 text-center font-mono">{{ ent.lineas?.length || 0 }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
                        \${{ Number(ent.total_valorado).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {{ ent.estado }}
                        </span>
                      </td>
                      <td class="p-3.5 text-right whitespace-nowrap space-x-1">
                        @if (ent.estado === 'CONFIRMADA') {
                          <button
                            type="button"
                            (click)="abrirModalDevolucionDesdeEntrada(ent)"
                            class="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            title="Registrar devolución de compra a proveedor sobre esta entrada"
                          >
                            <span>↩️</span>
                            <span>Devolver</span>
                          </button>
                        }
                        <button
                          type="button"
                          (click)="abrirModalImprimirEntrada(ent)"
                          class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                          title="Imprimir / Consultar comprobante de recepción formal"
                        >
                          <span>🖨️</span>
                          <span>Imprimir / Ver</span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="10" class="p-8 text-center text-slate-500">
                        No se encontraron entradas de almacén coincidentes.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-table-pagination
              [totalItems]="entradasFiltradas().length"
              [currentPage]="paginaEntradas()"
              [pageSize]="tamanoEntradas()"
              (pageChange)="paginaEntradas.set($event)"
              (pageSizeChange)="tamanoEntradas.set($event); paginaEntradas.set(1)"
            />
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 3: KARDEX CONTINUO NIIF                                           -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'kardex') {
        <div class="space-y-4">
          <!-- Filtro de Kardex -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex flex-wrap items-center gap-3 flex-1">
              <!-- Selector de Artículo con Lookup Modal -->
              <div class="min-w-[280px]">
                <label class="block text-slate-400 mb-1 font-semibold">Artículo en Inspección</label>
                @if (articuloKardexSeleccionado(); as art) {
                  <div class="flex items-center justify-between p-2 bg-slate-950 border border-indigo-500/50 rounded-xl">
                    <div class="truncate text-xs">
                      <span class="font-mono font-bold text-indigo-400 mr-1">[{{ art.codigo }}]</span>
                      <span class="text-white">{{ art.nombre }}</span>
                    </div>
                    <div class="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        (click)="abrirLookupArticuloKardex()"
                        class="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Cambiar 🔍
                      </button>
                      <button
                        type="button"
                        (click)="limpiarArticuloKardex()"
                        class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[11px] transition cursor-pointer"
                        title="Ver todos los artículos"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                } @else {
                  <button
                    type="button"
                    (click)="abrirLookupArticuloKardex()"
                    class="w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 rounded-xl text-xs transition cursor-pointer group"
                  >
                    <span>🔍 Todos los artículos (Clic para filtrar)...</span>
                    <span class="bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition">
                      Catálogo
                    </span>
                  </button>
                }
              </div>

              <div class="w-48">
                <label class="block text-slate-400 mb-1 font-semibold">Bodega</label>
                <select
                  [(ngModel)]="kardexFiltroBodega"
                  (change)="cargarKardex()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="">Todas las bodegas</option>
                  @for (b of bodegas(); track b.id) {
                    <option [value]="b.id">{{ b.nombre }}</option>
                  }
                </select>
              </div>

              <div class="w-48">
                <label class="block text-slate-400 mb-1 font-semibold">Doc. Referencia</label>
                <input
                  type="text"
                  [(ngModel)]="kardexFiltroDoc"
                  placeholder="Ej: EA-0001, TR-0002..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 self-end">
              <button
                type="button"
                (click)="cargarKardex()"
                class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Actualizar</span>
              </button>

              <button
                type="button"
                (click)="abrirModalImprimirKardex()"
                [disabled]="kardexFiltrado().length === 0"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>🖨️</span>
                <span>Imprimir Reporte Kardex NIIF</span>
              </button>
            </div>
          </div>

          <!-- Tabla de Kardex -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-950">
                  <tr class="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-mono text-[9px] tracking-wider text-center">
                    <th class="p-3 text-left" colspan="4">Datos del Movimiento</th>
                    <th class="p-3 bg-blue-950/30 border-x border-slate-800" colspan="3">📥 Entradas</th>
                    <th class="p-3 bg-rose-950/30 border-r border-slate-800" colspan="3">📤 Salidas</th>
                    <th class="p-3 bg-emerald-950/30" colspan="3">⚖️ Saldo Resultante (Ponderado)</th>
                  </tr>
                  <tr class="border-b border-slate-800 bg-slate-950 text-slate-400 font-mono text-[10px]">
                    <th class="p-2.5">Fecha</th>
                    <th class="p-2.5">Doc. Ref</th>
                    <th class="p-2.5">Artículo</th>
                    <th class="p-2.5">Bodega</th>
                    <!-- Entradas -->
                    <th class="p-2.5 text-right bg-blue-950/20">Cant</th>
                    <th class="p-2.5 text-right bg-blue-950/20">Unitario</th>
                    <th class="p-2.5 text-right bg-blue-950/20 border-r border-slate-800">Total</th>
                    <!-- Salidas -->
                    <th class="p-2.5 text-right bg-rose-950/20">Cant</th>
                    <th class="p-2.5 text-right bg-rose-950/20">Unitario</th>
                    <th class="p-2.5 text-right bg-rose-950/20 border-r border-slate-800">Total</th>
                    <!-- Saldo -->
                    <th class="p-2.5 text-right bg-emerald-950/20 font-bold">Cant</th>
                    <th class="p-2.5 text-right bg-emerald-950/20">Costo Prom</th>
                    <th class="p-2.5 text-right bg-emerald-950/20 font-bold">Total Valorado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                  @for (k of kardexPaginado(); track k.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-2.5 text-slate-400">{{ k.fecha_movimiento }}</td>
                      <td class="p-2.5 font-bold text-white">{{ k.documento_referencia }}</td>
                      <td class="p-2.5 font-sans truncate max-w-[150px] text-slate-200">{{ k.articulo?.nombre }}</td>
                      <td class="p-2.5 font-sans text-slate-400">{{ k.bodega?.codigo }}</td>

                      <!-- Entradas -->
                      <td class="p-2.5 text-right bg-blue-950/10 text-blue-300">
                        {{ Number(k.cantidad_entrada) > 0 ? Number(k.cantidad_entrada).toLocaleString('es-CO') : '-' }}
                      </td>
                      <td class="p-2.5 text-right bg-blue-950/10 text-slate-400">
                        {{ Number(k.cantidad_entrada) > 0 ? '$' + Number(k.costo_unitario_entrada).toLocaleString('es-CO') : '-' }}
                      </td>
                      <td class="p-2.5 text-right bg-blue-950/10 text-blue-400 font-semibold border-r border-slate-800">
                        {{ Number(k.cantidad_entrada) > 0 ? '$' + Number(k.costo_total_entrada).toLocaleString('es-CO') : '-' }}
                      </td>

                      <!-- Salidas -->
                      <td class="p-2.5 text-right bg-rose-950/10 text-rose-300">
                        {{ Number(k.cantidad_salida) > 0 ? Number(k.cantidad_salida).toLocaleString('es-CO') : '-' }}
                      </td>
                      <td class="p-2.5 text-right bg-rose-950/10 text-slate-400">
                        {{ Number(k.cantidad_salida) > 0 ? '$' + Number(k.costo_unitario_salida).toLocaleString('es-CO') : '-' }}
                      </td>
                      <td class="p-2.5 text-right bg-rose-950/10 text-rose-400 font-semibold border-r border-slate-800">
                        {{ Number(k.cantidad_salida) > 0 ? '$' + Number(k.costo_total_salida).toLocaleString('es-CO') : '-' }}
                      </td>

                      <!-- Saldo Ponderado -->
                      <td class="p-2.5 text-right bg-emerald-950/10 font-bold text-emerald-300">
                        {{ Number(k.saldo_cantidad_resultante).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-2.5 text-right bg-emerald-950/10 text-slate-300">
                        \${{ Number(k.costo_unitario_promedio_resultante).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-2.5 text-right bg-emerald-950/10 font-bold text-emerald-400">
                        \${{ Number(k.saldo_costo_total_resultante).toLocaleString('es-CO') }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="13" class="p-8 text-center font-sans text-slate-500">
                        No se registran movimientos de Kardex para los filtros seleccionados.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-table-pagination
              [totalItems]="kardexFiltrado().length"
              [currentPage]="paginaKardex()"
              [pageSize]="tamanoKardex()"
              (pageChange)="paginaKardex.set($event)"
              (pageSizeChange)="tamanoKardex.set($event); paginaKardex.set(1)"
            />
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 4: NOTAS DE AJUSTE                                                -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'ajustes') {
        <div class="space-y-4">
          <!-- Barra de Búsqueda y Filtros de Ajustes -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div class="relative w-full sm:w-80">
                <input
                  type="text"
                  [(ngModel)]="busquedaAjuste"
                  placeholder="Buscar por N° Nota (AJ-...), Justificación o Bodega..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                />
                <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                @if (busquedaAjuste) {
                  <button (click)="busquedaAjuste = ''" class="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer">✕</button>
                }
              </div>

              <select
                [(ngModel)]="filtroTipoAjuste"
                class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos los tipos (Sobrante, Merma, Devoluciones, Cierre)</option>
                <option value="SOBRANTE">📥 Sobrantes de Inventario (+)</option>
                <option value="FALTANTE_MERMA">📤 Faltantes / Mermas (-)</option>
                <option value="DEVOLUCION_PROVEEDOR">📦 Devolución a Proveedor en Compra (-)</option>
                <option value="DEVOLUCION_CLIENTE">↩️ Devolución de Cliente en Venta (+)</option>
                <option value="CIERRE_INVENTARIO_FISICO">⚖️ Cierre Conteo Físico</option>
              </select>
            </div>

            <div class="text-xs text-slate-400">
              Registros: <span class="text-amber-400 font-bold font-mono">{{ ajustesFiltrados().length }}</span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-950">
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">N° Nota</th>
                    <th class="p-3.5">Fecha</th>
                    <th class="p-3.5">Bodega</th>
                    <th class="p-3.5">Tipo de Ajuste</th>
                    <th class="p-3.5">Justificación de Auditoría</th>
                    <th class="p-3.5 text-center">Ítems</th>
                    <th class="p-3.5 text-right">Total Valorado</th>
                    <th class="p-3.5 text-center">Asiento</th>
                    <th class="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (aj of ajustesPaginados(); track aj.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-mono font-bold text-white">
                        <div class="flex items-center gap-1.5">
                          <span>{{ aj.numero_nota }}</span>
                          @if (aj.estado === 'ANULADA') {
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              ANULADA
                            </span>
                          }
                        </div>
                      </td>
                      <td class="p-3.5 text-slate-400 font-mono">{{ aj.fecha_ajuste }}</td>
                      <td class="p-3.5">{{ aj.bodega?.nombre }}</td>
                      <td class="p-3.5">
                        <span
                          [class]="
                            aj.tipo_ajuste === 'SOBRANTE'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : aj.tipo_ajuste === 'FALTANTE_MERMA'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : aj.tipo_ajuste === 'DEVOLUCION_PROVEEDOR'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : aj.tipo_ajuste === 'DEVOLUCION_CLIENTE'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          "
                          class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        >
                          {{
                            aj.tipo_ajuste === 'DEVOLUCION_PROVEEDOR' ? '📦 Dev. Proveedor' :
                            aj.tipo_ajuste === 'DEVOLUCION_CLIENTE' ? '↩️ Dev. Cliente' :
                            aj.tipo_ajuste === 'SOBRANTE' ? '📥 Sobrante' :
                            aj.tipo_ajuste === 'FALTANTE_MERMA' ? '📤 Faltante/Merma' :
                            '⚖️ Cierre Físico'
                          }}
                        </span>
                      </td>
                      <td class="p-3.5 text-slate-300 max-w-xs truncate">{{ aj.justificacion }}</td>
                      <td class="p-3.5 text-center font-mono">{{ aj.lineas?.length || 0 }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-amber-400">
                        \${{ Number(aj.total_ajuste).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-center font-mono">
                        @if (aj.asiento?.numero_comprobante) {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {{ aj.asiento.numero_comprobante }}
                          </span>
                        } @else {
                          <span class="text-[10px] text-slate-500 italic">Sin asiento</span>
                        }
                      </td>
                      <td class="p-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          (click)="abrirModalImprimirAjuste(aj)"
                          class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                          title="Imprimir / Consultar acta de ajuste formal"
                        >
                          <span>🖨️</span>
                          <span>Imprimir / Ver</span>
                        </button>
                        @if (aj.estado !== 'ANULADA') {
                          <button
                            type="button"
                            (click)="anularNotaAjuste(aj)"
                            class="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            title="Anular formalmente esta nota de ajuste (revierte stock, Kardex y asiento contable)"
                          >
                            <span>🚫</span>
                            <span>Anular</span>
                          </button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="p-8 text-center text-slate-500">
                        No se encontraron notas de ajuste coincidentes.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-table-pagination
              [totalItems]="ajustesFiltrados().length"
              [currentPage]="paginaAjustes()"
              [pageSize]="tamanoAjustes()"
              (pageChange)="paginaAjustes.set($event)"
              (pageSizeChange)="tamanoAjustes.set($event); paginaAjustes.set(1)"
            />
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 5: EXISTENCIAS POR BODEGA                                         -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'existencias') {
        <div class="space-y-4">
          <!-- Barra de Búsqueda, Filtro Bodega, Indicadores y Botón Imprimir Reporte -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
              <div class="relative w-full sm:w-72">
                <input
                  type="text"
                  [(ngModel)]="busquedaExistencia"
                  placeholder="Buscar por SKU o Nombre..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
                @if (busquedaExistencia) {
                  <button (click)="busquedaExistencia = ''" class="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer">✕</button>
                }
              </div>

              <select
                [(ngModel)]="filtroBodegaExistencias"
                class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Todas las bodegas</option>
                @for (b of bodegas(); track b.id) {
                  <option [value]="b.id">{{ b.nombre }} ({{ b.codigo }})</option>
                }
              </select>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <!-- Indicadores consolidados -->
              <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px]">
                <span class="text-slate-400">Total Físico:</span>
                <span class="text-emerald-400 font-bold">{{ totalStockExistencias().toLocaleString('es-CO') }}</span>
                <span class="text-slate-600">|</span>
                <span class="text-slate-400">Valor Total:</span>
                <span class="text-cyan-400 font-bold">\${{ totalValoradoExistencias().toLocaleString('es-CO') }}</span>
              </div>

              <button
                type="button"
                (click)="abrirModalImprimirExistencias()"
                [disabled]="existenciasFiltradas().length === 0"
                class="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
                title="Imprimir reporte formal de existencias valoradas"
              >
                <span>🖨️</span>
                <span>Imprimir Reporte Valorado</span>
              </button>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-950">
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">Bodega</th>
                    <th class="p-3.5">Código SKU</th>
                    <th class="p-3.5">Artículo</th>
                    <th class="p-3.5 text-right">Existencia Física</th>
                    <th class="p-3.5 text-right">Costo Promedio Móvil</th>
                    <th class="p-3.5 text-right">Valor Total en Bodega</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (ex of existenciasPaginadas(); track ex.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-semibold text-white">{{ ex.bodega?.nombre }} ({{ ex.bodega?.codigo }})</td>
                      <td class="p-3.5 font-mono text-indigo-300">{{ ex.articulo?.codigo }}</td>
                      <td class="p-3.5 text-white font-medium">{{ ex.articulo?.nombre }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
                        {{ Number(ex.stock_actual).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-right font-mono text-slate-300">
                        \${{ Number(ex.costo_promedio).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-right font-mono font-bold text-white">
                        \${{ (Number(ex.stock_actual) * Number(ex.costo_promedio)).toLocaleString('es-CO') }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-500">
                        No hay existencias registradas con los filtros seleccionados.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-table-pagination
              [totalItems]="existenciasFiltradas().length"
              [currentPage]="paginaExistencias()"
              [pageSize]="tamanoExistencias()"
              (pageChange)="paginaExistencias.set($event)"
              (pageSizeChange)="tamanoExistencias.set($event); paginaExistencias.set(1)"
            />
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA: TRASLADOS ENTRE BODEGAS                                          -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'traslados') {
        <div class="space-y-4">
          <!-- Barra de Búsqueda de Traslados -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="relative w-full sm:w-96">
              <input
                type="text"
                [(ngModel)]="busquedaTraslado"
                placeholder="Buscar por N° Traslado (TR-...), Bodega, Artículo u Observaciones..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
              />
              <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
              @if (busquedaTraslado) {
                <button (click)="busquedaTraslado = ''" class="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer">✕</button>
              }
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>Registros: <span class="text-purple-400 font-bold font-mono">{{ trasladosFiltrados().length }}</span></span>
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 z-10 bg-slate-950">
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">N° Traslado</th>
                    <th class="p-3.5">Fecha</th>
                    <th class="p-3.5">Bodega Origen</th>
                    <th class="p-3.5">Artículo</th>
                    <th class="p-3.5 text-right">Cantidad</th>
                    <th class="p-3.5 text-right">Costo Unitario</th>
                    <th class="p-3.5 text-right">Costo Total</th>
                    <th class="p-3.5">Observaciones</th>
                    <th class="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y border-slate-800/60 text-slate-300">
                  @for (tr of trasladosPaginados(); track tr.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-mono font-bold text-purple-400">{{ tr.documento_referencia }}</td>
                      <td class="p-3.5 font-mono text-slate-400">{{ tr.fecha_movimiento }}</td>
                      <td class="p-3.5 font-medium text-white">{{ tr.bodega?.nombre || 'Bodega' }}</td>
                      <td class="p-3.5 text-slate-200">[{{ tr.articulo?.codigo }}] {{ tr.articulo?.nombre }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-amber-300">{{ tr.cantidad_salida || tr.cantidad_entrada }}</td>
                      <td class="p-3.5 text-right font-mono text-slate-300">\${{ Number(tr.costo_unitario_salida || tr.costo_unitario_entrada).toLocaleString('es-CO') }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-white">\${{ Number(tr.costo_total_salida || tr.costo_total_entrada).toLocaleString('es-CO') }}</td>
                      <td class="p-3.5 text-slate-400 text-[11px] max-w-[150px] truncate">{{ tr.observaciones || 'Traslado entre bodegas' }}</td>
                      <td class="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          (click)="abrirModalImprimirTraslado(tr)"
                          class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                          title="Imprimir comprobante de traslado formal"
                        >
                          <span>🖨️</span>
                          <span>Imprimir / Ver</span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="p-8 text-center text-slate-500">
                        No hay registros de traslados coincidentes.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-table-pagination
              [totalItems]="trasladosFiltrados().length"
              [currentPage]="paginaTraslados()"
              [pageSize]="tamanoTraslados()"
              (pageChange)="paginaTraslados.set($event)"
              (pageSizeChange)="tamanoTraslados.set($event); paginaTraslados.set(1)"
            />
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL: CREAR / EDITAR ARTÍCULO                                            -->
      <!-- ========================================================================= -->
      @if (mostrarModalArticulo()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📦</span>
                <span>{{ articuloEnEdicion() ? 'Editar Ficha de Artículo' : 'Nuevo Artículo / Servicio (NIC 2)' }}</span>
              </h3>
              <button (click)="mostrarModalArticulo.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">
                  Código / SKU *
                  @if (articuloEnEdicion()) {
                    <span class="text-[10px] text-amber-400 font-semibold ml-1">🔒 Inmutable</span>
                  }
                </label>
                <input
                  type="text"
                  [(ngModel)]="articuloForm.codigo"
                  [disabled]="articuloEnEdicion() !== null"
                  placeholder="Ej: ART-001"
                  [class]="articuloEnEdicion() ? 'bg-slate-900/80 text-slate-400 border-slate-800 cursor-not-allowed select-none' : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'"
                  class="w-full border rounded-xl px-3 py-2 font-mono uppercase focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">
                  Tipo de Artículo *
                  @if (articuloEnEdicion()) {
                    <span class="text-[10px] text-amber-400 font-semibold ml-1">🔒 Inmutable</span>
                  }
                </label>
                <select
                  [(ngModel)]="articuloForm.tipo_articulo"
                  [disabled]="articuloEnEdicion() !== null"
                  [class]="articuloEnEdicion() ? 'bg-slate-900/80 text-slate-400 border-slate-800 cursor-not-allowed select-none' : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'"
                  class="w-full border rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="INVENTARIABLE">📦 Inventariable (Control de Stock)</option>
                  <option value="SERVICIO">🛠️ Servicio (Sin Stock)</option>
                  <option value="CONSUMIBLE">📎 Consumible / Gasto Directo</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Nombre Comercial del Artículo *</label>
                <input
                  type="text"
                  [(ngModel)]="articuloForm.nombre"
                  placeholder="Ej: Resma Papel Bond Carta 75g"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Categoría de Artículo</label>
                <select
                  [(ngModel)]="articuloForm.categoria_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione categoría...</option>
                  @for (cat of categorias(); track cat.id) {
                    <option [value]="cat.id">{{ cat.nombre }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Unidad de Medida</label>
                <select
                  [(ngModel)]="articuloForm.unidad_medida_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione unidad...</option>
                  @for (u of unidades(); track u.id) {
                    <option [value]="u.id">[{{ u.codigo }}] {{ u.nombre }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Precio de Venta Sugerido</label>
                <input
                  type="number"
                  [(ngModel)]="articuloForm.precio_venta_sugerido"
                  placeholder="0"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">
                  Costo Promedio Móvil (NIC 2)
                  @if (articuloEnEdicion()) {
                    <span class="text-[10px] text-amber-400 font-semibold ml-1">🔒 Calculado por Kardex</span>
                  } @else {
                    <span class="text-[10px] text-slate-400 font-normal ml-1">(Inicial)</span>
                  }
                </label>
                <input
                  type="number"
                  [(ngModel)]="articuloForm.costo_promedio"
                  [disabled]="articuloEnEdicion() !== null"
                  placeholder="0"
                  [class]="articuloEnEdicion() ? 'bg-slate-900/80 text-slate-400 border-slate-800 cursor-not-allowed select-none' : 'bg-slate-950 text-white border-slate-800 focus:border-indigo-500'"
                  class="w-full border rounded-xl px-3 py-2 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  [(ngModel)]="articuloForm.stock_minimo"
                  placeholder="0"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tarifa IVA (%)</label>
                <select
                  [(ngModel)]="articuloForm.tarifa_iva"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option [value]="0">0% (Excluido / Exento)</option>
                  <option [value]="5">5% (Canasta / Especial)</option>
                  <option [value]="19">19% (Tarifa General)</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Código de Barras (EAN / UPC)</label>
                <input
                  type="text"
                  [(ngModel)]="articuloForm.codigo_barras"
                  placeholder="Ej: 7701234567890"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
              <button
                (click)="mostrarModalArticulo.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="guardarArticulo()"
                [disabled]="!articuloForm.codigo || !articuloForm.nombre || guardando()"
                class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                {{ guardando() ? 'Guardando...' : 'Guardar Artículo' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL: REGISTRAR ENTRADA DE ALMACÉN                                       -->
      <!-- ========================================================================= -->
      @if (mostrarModalEntrada()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📥</span>
                <span>Registrar Entrada de Almacén (Recepción Física)</span>
              </h3>
              <button (click)="mostrarModalEntrada.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <!-- Vinculación a Orden de Compra Enterprise Lookup -->
            <div class="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs mb-3">
              <div class="flex items-center justify-between">
                <label class="block font-bold text-indigo-400 uppercase tracking-wider">Vincular a Orden de Compra (Opcional)</label>
                @if (ordenCompraSeleccionada()) {
                  <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Vinculada a {{ ordenCompraSeleccionada()?.numero_orden }}
                  </span>
                }
              </div>

              @if (ordenCompraSeleccionada(); as oc) {
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-inner">
                  <div class="space-y-1 truncate text-xs">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono font-bold text-white text-sm">[{{ oc.numero_orden }}]</span>
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
                        <span class="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Fac/Rem: {{ oc.numero_factura_proveedor }}</span>
                      }
                    </div>
                    <div class="text-xs text-slate-200 font-medium truncate">
                      🏢 {{ oc.proveedor?.nombre_completo }} <span class="text-slate-500 font-mono">[NIT: {{ oc.proveedor?.numero_identificacion }}]</span>
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono flex items-center gap-3 flex-wrap">
                      <span>Total: <b class="text-emerald-400">\${{ Number(oc.total).toLocaleString('es-CO') }}</b></span>
                      <span>📍 Bodega: {{ oc.bodega_destino?.nombre || 'Principal' }}</span>
                      <span>📅 Emisión: {{ oc.fecha_emision }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      (click)="abrirLookupOrdenCompra()"
                      class="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Cambiar</span>
                      <span>🔍</span>
                    </button>
                    <button
                      type="button"
                      (click)="desvincularOrdenCompra()"
                      class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      title="Quitar orden y recibir mercancía directamente"
                    >
                      <span>✕</span>
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              } @else {
                <button
                  type="button"
                  (click)="abrirLookupOrdenCompra()"
                  class="w-full flex items-center justify-between p-3 bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 rounded-xl text-xs transition cursor-pointer group"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm group-hover:scale-110 transition">
                      🔍
                    </span>
                    <div class="text-left">
                      <span class="block font-semibold text-slate-200 group-hover:text-white">Buscar y Vincular Orden de Compra Pendiente...</span>
                      <span class="block text-[11px] text-slate-500">Filtrar órdenes aprobadas o con recepciones parciales pendientes</span>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition">
                    Recepción Directa
                  </span>
                </button>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Proveedor *</label>
                @if (proveedorSeleccionado(); as prov) {
                  <div class="flex items-center justify-between p-2 bg-slate-950 border border-emerald-500/50 rounded-xl">
                    <div class="truncate text-xs">
                      <span class="font-mono font-bold text-emerald-400 mr-1">[{{ prov.numero_identificacion }}]</span>
                      <span class="text-white">{{ prov.razon_social || prov.nombre_completo }}</span>
                    </div>
                    <button
                      type="button"
                      (click)="abrirLookupProveedor()"
                      class="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-[11px] font-semibold transition cursor-pointer ml-1"
                    >
                      Cambiar 🔍
                    </button>
                  </div>
                } @else {
                  <button
                    type="button"
                    (click)="abrirLookupProveedor()"
                    class="w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-300 rounded-xl text-xs transition cursor-pointer group"
                  >
                    <span>🔍 Buscar Proveedor...</span>
                    <span class="text-[10px] text-emerald-400 font-bold">Catálogo</span>
                  </button>
                }
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Bodega de Destino *</label>
                <select
                  [(ngModel)]="entradaForm.bodega_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione bodega...</option>
                  @for (b of bodegas(); track b.id) {
                    <option [value]="b.id">{{ b.nombre }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">N° Remisión de Entrega</label>
                <input
                  type="text"
                  [(ngModel)]="entradaForm.numero_remision_proveedor"
                  placeholder="Ej: REM-5542"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Control de Facturación / Causación Inmediata de la Entrada -->
            <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                  <input
                    type="checkbox"
                    [(ngModel)]="entradaForm.causar_cxp"
                    class="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>💳 ¿Esta entrega viene con factura para causar ya en Cuentas por Pagar (CxP)?</span>
                </label>
                <span class="text-[11px] font-mono text-emerald-400">
                  {{ entradaForm.causar_cxp ? '✓ Causará pasivo financiero' : 'Solo remisión física (Kardex)' }}
                </span>
              </div>

              @if (entradaForm.causar_cxp) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">N° Factura del Proveedor *</label>
                    <input
                      type="text"
                      [(ngModel)]="entradaForm.numero_factura_proveedor"
                      placeholder="Ej: FE-98412"
                      class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Fecha de la Factura *</label>
                    <input
                      type="date"
                      [(ngModel)]="entradaForm.fecha_factura"
                      class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  @if (entradasPreviasPendientesCausar().length > 0) {
                    <div class="col-span-1 sm:col-span-2 p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-start gap-2.5 text-xs text-blue-200">
                      <span class="text-base text-blue-400">ℹ️</span>
                      <div class="space-y-1">
                        <p class="font-semibold text-blue-100">
                          Consolidación Automática de Entregas Parciales con Remisión
                        </p>
                        <p class="text-[11px] text-blue-300 leading-relaxed">
                          Esta orden cuenta con <strong class="text-white">{{ entradasPreviasPendientesCausar().length }} entrega(s) previa(s)</strong> recibida(s) con remisión pendiente(s) de facturar por
                          <strong class="text-emerald-400 font-mono">\${{ totalEntradasPreviasPendientesCausar().toLocaleString('es-CO') }}</strong>
                          ({{ entradasPreviasPendientesCausarNumeros() }
}).
                        </p>
                        <p class="text-[11px] text-blue-300">
                          Al causar con esta factura, el backend consolidará el valor de las remisiones anteriores más la entrega actual en el comprobante y pasivo de CxP.
                        </p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Líneas de Artículos a Recibir -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Artículos a Recibir</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="abrirCatalogoMultipleEntrada()"
                    class="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    title="Buscar y agregar varios artículos a la vez"
                  >
                    <span>📦</span>
                    <span>Buscar Catálogo (Múltiples)</span>
                  </button>
                  <button
                    type="button"
                    (click)="agregarLineaEntrada()"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    + Agregar Fila
                  </button>
                </div>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
                @for (lin of entradaForm.lineas; track $index) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <div class="col-span-5">
                      @if (obtenerArticulo(lin.articulo_id); as art) {
                        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg px-2 py-1 transition group">
                          <div class="truncate text-xs">
                            <span class="font-mono text-emerald-400 font-bold mr-1">[{{ art.codigo }}]</span>
                            <span class="text-slate-200">{{ art.nombre }}</span>
                          </div>
                          <button
                            type="button"
                            (click)="abrirLookupArticuloParaEntrada($index)"
                            class="text-[11px] text-slate-400 hover:text-emerald-300 font-semibold ml-1 cursor-pointer shrink-0"
                            title="Cambiar artículo"
                          >
                            🔍
                          </button>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="abrirLookupArticuloParaEntrada($index)"
                          class="w-full text-left bg-slate-900 border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg px-2 py-1 text-slate-400 hover:text-emerald-300 text-xs transition cursor-pointer flex items-center justify-between"
                        >
                          <span>🔍 Seleccionar artículo...</span>
                          <span class="text-[10px] text-emerald-500 font-bold">Catálogo</span>
                        </button>
                      }
                    </div>

                    <div class="col-span-2">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        [(ngModel)]="lin.cantidad"
                        placeholder="Cant"
                        class="w-full bg-slate-900 border rounded-lg px-2 py-1.5 text-white font-mono text-right text-xs"
                        [class.border-rose-500]="entradaForm.orden_compra_id && obtenerPendienteEnOrden(lin.articulo_id) !== null && Number(lin.cantidad) > (obtenerPendienteEnOrden(lin.articulo_id) || 0)"
                        [class.border-slate-800]="!entradaForm.orden_compra_id || obtenerPendienteEnOrden(lin.articulo_id) === null || Number(lin.cantidad) <= (obtenerPendienteEnOrden(lin.articulo_id) || 0)"
                      />
                      @if (entradaForm.orden_compra_id && obtenerPendienteEnOrden(lin.articulo_id) !== null) {
                        <div class="text-[10px] text-right mt-0.5 leading-tight">
                          @if (Number(lin.cantidad) > (obtenerPendienteEnOrden(lin.articulo_id) || 0)) {
                            <span class="text-rose-400 font-bold">⚠️ Excede (Máx: {{ obtenerPendienteEnOrden(lin.articulo_id) }})</span>
                          } @else {
                            <span class="text-slate-400">Pend: <span class="text-emerald-400 font-mono font-bold">{{ obtenerPendienteEnOrden(lin.articulo_id) }}</span></span>
                          }
                        </div>
                      }
                    </div>

                    <div class="col-span-2">
                      <input
                        type="number"
                        [(ngModel)]="lin.costo_unitario"
                        placeholder="Costo Unit."
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-1">
                      <input
                        type="number"
                        [(ngModel)]="lin.porcentaje_iva"
                        placeholder="IVA %"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                        title="Tarifa IVA %"
                      />
                    </div>

                    <div class="col-span-1 text-right font-mono font-bold text-slate-300 truncate" title="Subtotal">
                      \${{ (Number(lin.cantidad || 0) * Number(lin.costo_unitario || 0)).toLocaleString('es-CO') }}
                    </div>

                    <div class="col-span-1 text-center">
                      <button
                        (click)="removerLineaEntrada($index)"
                        class="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Resumen Financiero y Desglose de IVA de la Entrada -->
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div class="flex justify-between text-slate-400">
                  <span>Subtotal Mercancías (Valor Kardex):</span>
                  <span class="font-mono font-bold text-slate-200">\${{ totalSubtotalEntrada().toLocaleString('es-CO') }}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Impuestos (IVA Descontable Estimado):</span>
                  <span class="font-mono font-bold text-slate-200">\${{ totalIvaEntrada().toLocaleString('es-CO') }}</span>
                </div>
                <div class="flex justify-between pt-1 border-t border-slate-800 font-bold text-sm">
                  <span class="text-white">Total con Impuestos de la Recepción:</span>
                  <span class="text-emerald-400 font-mono">\${{ totalConIvaEntrada().toLocaleString('es-CO') }}</span>
                </div>
              </div>

              <!-- Observaciones / Propuesta Editable por el Usuario -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-semibold text-slate-300 text-xs">Observaciones / Trazabilidad de la Entrega</label>
                  <span class="text-[10px] text-emerald-400 font-mono font-semibold">Propuesta del sistema (editable)</span>
                </div>
                <textarea
                  [(ngModel)]="entradaForm.observaciones"
                  rows="2"
                  placeholder="Detalles de la entrega parcial, soporte o estado de la mercancía..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
              <button
                (click)="mostrarModalEntrada.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="guardarEntrada()"
                [disabled]="!entradaForm.proveedor_id || !entradaForm.bodega_id || entradaForm.lineas.length === 0 || guardando()"
                class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                {{ guardando() ? 'Registrando...' : 'Confirmar Recepción & Kardex' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL: REGISTRAR NOTA DE AJUSTE                                           -->
      <!-- ========================================================================= -->
      @if (mostrarModalAjuste()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📝</span>
                <span>Registrar Nota de Ajuste de Inventario</span>
              </h3>
              <button (click)="mostrarModalAjuste.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Bodega *</label>
                <select
                  [(ngModel)]="ajusteForm.bodega_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione bodega...</option>
                  @for (b of bodegas(); track b.id) {
                    <option [value]="b.id">{{ b.nombre }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Operación / Devolución *</label>
                <select
                  [(ngModel)]="ajusteForm.tipo_ajuste"
                  (change)="alCambiarTipoAjuste()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SOBRANTE">📥 SOBRANTE (Aumenta Stock)</option>
                  <option value="FALTANTE_MERMA">📤 FALTANTE / MERMA (Disminuye Stock)</option>
                  <option value="DEVOLUCION_PROVEEDOR">📦 DEVOLUCIÓN A PROVEEDOR EN COMPRA (Disminuye Stock)</option>
                  <option value="DEVOLUCION_CLIENTE">↩️ DEVOLUCIÓN DE CLIENTE EN VENTA (Aumenta Stock)</option>
                  <option value="CIERRE_INVENTARIO_FISICO">⚖️ CIERRE POR CONTEO FÍSICO</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Justificación / Motivo de la Operación *</label>
                <textarea
                  [(ngModel)]="ajusteForm.justificacion"
                  rows="2"
                  placeholder="Detalle el motivo, acta de conteo físico o causa de la devolución/merma..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>
            </div>

            <!-- Panel de Entrada de Almacén Vinculada para Devolución a Proveedor -->
            @if (ajusteForm.tipo_ajuste === 'DEVOLUCION_PROVEEDOR') {
              <div class="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Recepción de Origen (Entrada de Almacén a Devolver)</span>
                  </span>
                  @if (entradaSeleccionadaParaDevolucion()) {
                    <button
                      type="button"
                      (click)="desvincularEntradaDevolucion()"
                      class="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                    >
                      ✕ Cambiar / Desvincular Entrada
                    </button>
                  }
                </div>

                @if (entradaSeleccionadaParaDevolucion(); as ent) {
                  <div class="flex items-center justify-between bg-slate-900 border border-purple-500/30 rounded-lg p-2.5 text-xs">
                    <div class="space-y-0.5">
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-purple-400">{{ ent.numero_entrada }}</span>
                        <span class="text-white font-medium">{{ ent.proveedor?.nombre_completo || 'Proveedor' }}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono">
                        Fecha: {{ ent.fecha_entrada }} • Bodega: {{ ent.bodega?.nombre }}
                        @if (ent.numero_factura_proveedor) { • Factura: {{ ent.numero_factura_proveedor }} }
                        @if (ent.numero_remision_proveedor) { • Remisión: {{ ent.numero_remision_proveedor }} }
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {{ ent.lineas?.length || 0 }} ítems recibidos
                    </span>
                  </div>
                } @else {
                  <div class="space-y-1">
                    <label class="block text-[11px] text-slate-400">Seleccione la compra/entrada recibida a la cual desea aplicarle devolución:</label>
                    <select
                      (change)="alSeleccionarEntradaParaDevolucion($event)"
                      class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Seleccionar Entrada de Almacén a devolver --</option>
                      @for (e of entradas(); track e.id) {
                        <option [value]="e.id">
                          {{ e.numero_entrada }} • {{ e.proveedor?.nombre_completo }} ({{ e.fecha_entrada }}) {{ e.numero_factura_proveedor ? '[Fac: ' + e.numero_factura_proveedor + ']' : (e.numero_remision_proveedor ? '[Rem: ' + e.numero_remision_proveedor + ']' : '') }}
                        </option>
                      }
                    </select>
                  </div>
                }
              </div>
            }

            <!-- Líneas de Ajuste -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Artículos a Ajustar</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="abrirCatalogoMultipleAjuste()"
                    class="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    title="Buscar y agregar varios artículos para ajuste"
                  >
                    <span>📦</span>
                    <span>Buscar Catálogo (Múltiples)</span>
                  </button>
                  <button
                    type="button"
                    (click)="agregarLineaAjuste()"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    + Agregar Fila
                  </button>
                </div>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
                @for (lin of ajusteForm.lineas; track $index) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <div class="col-span-5">
                      @if (obtenerArticulo(lin.articulo_id); as art) {
                        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg px-2 py-1 transition group">
                          <div class="truncate text-xs">
                            <span class="font-mono text-amber-400 font-bold mr-1">[{{ art.codigo }}]</span>
                            <span class="text-slate-200">{{ art.nombre }}</span>
                          </div>
                          <button
                            type="button"
                            (click)="abrirLookupArticuloParaAjuste($index)"
                            class="text-[11px] text-slate-400 hover:text-amber-300 font-semibold ml-1 cursor-pointer shrink-0"
                            title="Cambiar artículo"
                          >
                            🔍
                          </button>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="abrirLookupArticuloParaAjuste($index)"
                          class="w-full text-left bg-slate-900 border border-dashed border-slate-700 hover:border-amber-500 rounded-lg px-2 py-1 text-slate-400 hover:text-amber-300 text-xs transition cursor-pointer flex items-center justify-between"
                        >
                          <span>🔍 Seleccionar artículo...</span>
                          <span class="text-[10px] text-amber-500 font-bold">Catálogo</span>
                        </button>
                      }
                    </div>

                    <div class="col-span-3">
                      @if (ajusteForm.tipo_ajuste === 'FALTANTE_MERMA') {
                        <div class="w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg px-2 py-1.5 text-center text-xs">
                          📤 Resta (- Stock)
                        </div>
                      } @else if (ajusteForm.tipo_ajuste === 'DEVOLUCION_PROVEEDOR') {
                        <div class="w-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold rounded-lg px-2 py-1.5 text-center text-xs">
                          📦 Dev. Proveedor (- Stock)
                        </div>
                      } @else if (ajusteForm.tipo_ajuste === 'DEVOLUCION_CLIENTE') {
                        <div class="w-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold rounded-lg px-2 py-1.5 text-center text-xs">
                          ↩️ Dev. Cliente (+ Stock)
                        </div>
                      } @else if (ajusteForm.tipo_ajuste === 'SOBRANTE') {
                        <div class="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-lg px-2 py-1.5 text-center text-xs">
                          📥 Suma (+ Stock)
                        </div>
                      } @else {
                        <select
                          [(ngModel)]="lin.tipo_movimiento"
                          class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                        >
                          <option value="ENTRADA">📥 Suma</option>
                          <option value="SALIDA">📤 Resta</option>
                        </select>
                      }
                    </div>

                    <div class="col-span-3">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        [(ngModel)]="lin.cantidad"
                        placeholder="Cantidad"
                        class="w-full bg-slate-900 border rounded-lg px-2 py-1.5 text-white font-mono text-right text-xs"
                        [class.border-rose-500]="esSalidaAjuste(lin) && Number(lin.cantidad) > obtenerStockBodegaParaAjuste(lin.articulo_id, ajusteForm.bodega_id)"
                        [class.border-slate-800]="!esSalidaAjuste(lin) || Number(lin.cantidad) <= obtenerStockBodegaParaAjuste(lin.articulo_id, ajusteForm.bodega_id)"
                      />
                      <div class="text-[10px] text-right mt-0.5 leading-tight space-y-0.5">
                        @if (ajusteForm.tipo_ajuste === 'DEVOLUCION_PROVEEDOR' && obtenerCantIngresadaEnEntrada(lin.articulo_id) !== null) {
                          <div>
                            @if (Number(lin.cantidad) > (obtenerCantIngresadaEnEntrada(lin.articulo_id) || 0)) {
                              <span class="text-rose-400 font-bold">⚠️ Excede lo recibido (Máx: {{ obtenerCantIngresadaEnEntrada(lin.articulo_id) }})</span>
                            } @else {
                              <span class="text-slate-400">Ingresaron: <span class="text-purple-400 font-mono font-bold">{{ obtenerCantIngresadaEnEntrada(lin.articulo_id) }}</span></span>
                            }
                          </div>
                        }
                        <div>
                          @if (esSalidaAjuste(lin) && Number(lin.cantidad) > obtenerStockBodegaParaAjuste(lin.articulo_id, ajusteForm.bodega_id)) {
                            <span class="text-rose-400 font-bold">⚠️ Excede stock (Disp: {{ obtenerStockBodegaParaAjuste(lin.articulo_id, ajusteForm.bodega_id) }})</span>
                          } @else {
                            <span class="text-slate-400">Disp en bodega: <span class="text-slate-200 font-mono font-bold">{{ obtenerStockBodegaParaAjuste(lin.articulo_id, ajusteForm.bodega_id) }}</span></span>
                          }
                        </div>
                      </div>
                    </div>

                    <div class="col-span-1 text-center">
                      <button (click)="removerLineaAjuste($index)" class="text-slate-500 hover:text-rose-400 cursor-pointer">✕</button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
              <button
                (click)="mostrarModalAjuste.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="guardarAjuste()"
                [disabled]="!ajusteForm.bodega_id || !ajusteForm.justificacion || ajusteForm.lineas.length === 0 || guardando()"
                class="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-amber-600/20 transition cursor-pointer"
              >
                {{ guardando() ? 'Guardando...' : 'Aplicar Nota de Ajuste' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL: REGISTRAR TRASLADO ENTRE BODEGAS                                   -->
      <!-- ========================================================================= -->
      @if (mostrarModalTraslado()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>🔄</span>
                <span>Registrar Traslado de Mercancía entre Bodegas</span>
              </h3>
              <button (click)="mostrarModalTraslado.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Bodega de Origen *</label>
                <select
                  [(ngModel)]="trasladoForm.bodega_origen_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione origen...</option>
                  @for (b of bodegas(); track b.id) {
                    <option [value]="b.id">{{ b.nombre }} ({{ b.codigo }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Bodega de Destino *</label>
                <select
                  [(ngModel)]="trasladoForm.bodega_destino_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione destino...</option>
                  @for (b of bodegas(); track b.id) {
                    <option [value]="b.id">{{ b.nombre }} ({{ b.codigo }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Fecha de Traslado *</label>
                <input
                  type="date"
                  [(ngModel)]="trasladoForm.fecha_traslado"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div class="sm:col-span-3">
                <label class="block font-semibold text-slate-300 mb-1">Observaciones / Motivo de Traslado</label>
                <input
                  type="text"
                  [(ngModel)]="trasladoForm.observaciones"
                  placeholder="Ej: Reabastecimiento de stock, traslado preventivo..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Líneas de Artículos a Trasladar -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Artículos a Trasladar</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="abrirCatalogoMultipleTraslado()"
                    class="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    title="Buscar y agregar varios artículos a trasladar"
                  >
                    <span>📦</span>
                    <span>Buscar Catálogo (Múltiples)</span>
                  </button>
                  <button
                    type="button"
                    (click)="agregarLineaTraslado()"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    + Agregar Artículo
                  </button>
                </div>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
                @for (lin of trasladoForm.lineas; track $index) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <div class="col-span-7">
                      @if (obtenerArticulo(lin.articulo_id); as art) {
                        <div class="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-lg px-2 py-1 transition group">
                          <div class="truncate text-xs">
                            <span class="font-mono text-purple-400 font-bold mr-1">[{{ art.codigo }}]</span>
                            <span class="text-slate-200">{{ art.nombre }}</span>
                          </div>
                          <button
                            type="button"
                            (click)="abrirLookupArticuloParaTraslado($index)"
                            class="text-[11px] text-slate-400 hover:text-purple-300 font-semibold ml-1 cursor-pointer shrink-0"
                            title="Cambiar artículo"
                          >
                            🔍
                          </button>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="abrirLookupArticuloParaTraslado($index)"
                          class="w-full text-left bg-slate-900 border border-dashed border-slate-700 hover:border-purple-500 rounded-lg px-2 py-1 text-slate-400 hover:text-purple-300 text-xs transition cursor-pointer flex items-center justify-between"
                        >
                          <span>🔍 Seleccionar artículo...</span>
                          <span class="text-[10px] text-purple-400 font-bold">Catálogo</span>
                        </button>
                      }
                    </div>

                    <div class="col-span-4">
                      <input
                        type="number"
                        [(ngModel)]="lin.cantidad"
                        placeholder="Cantidad a trasladar"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-1 text-center">
                      <button (click)="removerLineaTraslado($index)" [disabled]="trasladoForm.lineas.length === 1" class="text-slate-500 hover:text-rose-400 cursor-pointer disabled:opacity-30">✕</button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800 text-xs">
              <button
                (click)="mostrarModalTraslado.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                (click)="guardarTraslado()"
                [disabled]="!trasladoForm.bodega_origen_id || !trasladoForm.bodega_destino_id || trasladoForm.bodega_origen_id === trasladoForm.bodega_destino_id || trasladoForm.lineas.length === 0 || guardando()"
                class="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition cursor-pointer"
              >
                {{ guardando() ? 'Trasladando...' : 'Procesar Traslado en Kardex' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL FORMAL: VISOR E IMPRESIÓN DOCUMENTAL (AUDITORÍA & DIAN)            -->
      <!-- ========================================================================= -->
      @if (documentoParaImprimir(); as doc) {
        <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex justify-center items-start p-4 sm:p-6 overflow-y-auto" (click)="cerrarModalImprimir()">
          <div class="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 my-4 sm:my-8 relative" (click)="$event.stopPropagation()">
            <!-- Barra superior de acciones (fijada arriba para nunca perderse en pantallas de cualquier tamaño) -->
            <div class="sticky top-0 z-30 bg-slate-900/95 backdrop-blur px-6 py-4 flex items-center justify-between print:hidden border-b border-slate-800 shadow-md">
              <div class="flex items-center gap-3">
                <span class="text-xl">🖨️</span>
                <div>
                  <h3 class="text-sm font-bold text-white tracking-wide uppercase">{{ doc.titulo }}</h3>
                  <p class="text-[11px] text-slate-400 font-mono">{{ doc.consecutivo }} - Pista Auditoría Oficial</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="imprimirDocumento()"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>🖨️</span>
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  (click)="cerrarModalImprimir()"
                  class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <!-- CONTENEDOR DOCUMENTAL IMPRESO -->
            <div id="hoja-impresion" class="p-8 sm:p-10 space-y-6 text-xs bg-white text-slate-900">
              @if (doc.datos?.estado === 'ANULADA') {
                <div class="border-2 border-dashed border-rose-600 bg-rose-50 text-rose-700 font-black text-center py-2.5 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  <span>DOCUMENTO ANULADO — REVERTIDO EN KARDEX Y CONTABILIDAD</span>
                  <span>⚠️</span>
                </div>
              }
              <!-- Encabezado Membretado Oficial -->
              <div class="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div class="space-y-1">
                  <h1 class="text-xl font-black text-slate-900 tracking-tight">
                    {{ authService.empresaActiva()?.razon_social || 'PACYOLO S.A.S.' }}
                  </h1>
                  <p class="font-mono text-xs text-slate-700 font-bold">
                    NIT: {{ authService.empresaActiva()?.nit || '900.123.456-7' }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    Sistema Integrado de Gestión Contable, Inventarios y Cadena de Suministro
                  </p>
                </div>

                <div class="text-right">
                  <div class="inline-block border-2 border-slate-900 rounded-xl p-3 bg-slate-50">
                    <span class="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Documento Oficial</span>
                    <span class="text-base font-black font-mono text-slate-900">{{ doc.consecutivo }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1 font-mono">Fecha Emisión: {{ doc.fecha }}</p>
                </div>
              </div>

              <!-- CONTENIDO SEGÚN TIPO DE DOCUMENTO -->

              <!-- 1. ENTRADA DE ALMACÉN -->
              @if (doc.tipo === 'ENTRADA') {
                <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span class="block text-[10px] font-bold uppercase text-slate-500">Proveedor</span>
                    <p class="font-bold text-slate-900 text-sm">{{ doc.datos.proveedor?.nombre_completo || doc.datos.proveedor?.razon_social || 'Proveedor' }}</p>
                    <p class="font-mono text-[11px] text-slate-600">NIT/CC: {{ doc.datos.proveedor?.numero_documento || 'N/A' }}</p>
                  </div>
                  <div class="text-right space-y-0.5">
                    <div>
                      <span class="text-[10px] font-bold uppercase text-slate-500">Bodega de Recepción:</span>
                      <span class="font-bold text-slate-900 ml-1">{{ doc.datos.bodega?.nombre }} ({{ doc.datos.bodega?.codigo }})</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold uppercase text-slate-500">N° Remisión Prov:</span>
                      <span class="font-mono font-bold text-slate-800 ml-1">{{ doc.datos.numero_remision_proveedor || 'N/A' }}</span>
                    </div>
                    @if (doc.datos.orden_compra) {
                      <div>
                        <span class="text-[10px] font-bold uppercase text-slate-500">Orden de Compra:</span>
                        <span class="font-mono font-bold text-slate-800 ml-1">{{ doc.datos.orden_compra?.numero_orden }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Tabla de Líneas Recibidas -->
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase text-slate-700">
                      <tr>
                        <th class="p-2.5">Código SKU</th>
                        <th class="p-2.5">Descripción del Artículo</th>
                        <th class="p-2.5 text-right">Cant. Recibida</th>
                        <th class="p-2.5 text-right">Costo Unitario</th>
                        <th class="p-2.5 text-right">Subtotal</th>
                        <th class="p-2.5 text-center">IVA %</th>
                        <th class="p-2.5 text-right">Valor IVA</th>
                        <th class="p-2.5 text-right">Total con IVA</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[11px]">
                      @for (l of doc.datos.lineas; track l.id || $index) {
                        <tr>
                          <td class="p-2.5 font-bold text-slate-800">{{ l.articulo?.codigo || 'SKU' }}</td>
                          <td class="p-2.5 font-sans font-medium text-slate-900">{{ l.articulo?.nombre || 'Artículo' }}</td>
                          <td class="p-2.5 text-right font-bold">{{ Number(l.cantidad).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right">\${{ Number(l.costo_unitario).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right font-bold text-slate-900">\${{ (Number(l.cantidad) * Number(l.costo_unitario)).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-center">{{ Number(l.porcentaje_iva ?? 19) }}%</td>
                          <td class="p-2.5 text-right text-slate-600">\${{ Number(l.valor_iva || (Number(l.cantidad) * Number(l.costo_unitario) * Number(l.porcentaje_iva ?? 19) / 100)).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right font-bold text-indigo-700">\${{ Number(l.total_con_iva || (Number(l.cantidad) * Number(l.costo_unitario) * (1 + Number(l.porcentaje_iva ?? 19) / 100))).toLocaleString('es-CO') }}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-slate-50 border-t-2 border-slate-900 font-mono font-bold text-xs">
                      <tr>
                        <td colspan="4" class="p-2.5 text-right uppercase">Subtotal Mercancías:</td>
                        <td class="p-2.5 text-right text-slate-900">\${{ Number(doc.datos.subtotal || doc.datos.total_valorado || 0).toLocaleString('es-CO') }}</td>
                        <td colspan="2" class="p-2.5 text-right uppercase">Total IVA:</td>
                        <td class="p-2.5 text-right text-indigo-700">\${{ Number(doc.datos.total_con_iva ? (doc.datos.total_con_iva - (doc.datos.subtotal || doc.datos.total_valorado)) : (doc.datos.total_iva || 0)).toLocaleString('es-CO') }}</td>
                      </tr>
                      <tr class="bg-slate-100 text-sm">
                        <td colspan="7" class="p-2.5 text-right uppercase">TOTAL GENERAL RECEPCIÓN:</td>
                        <td class="p-2.5 text-right font-black text-slate-950">\${{ Number(doc.datos.total_con_iva || doc.datos.total_valorado || 0).toLocaleString('es-CO') }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                @if (doc.datos.observaciones) {
                  <div class="mt-3 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                    <span class="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Observaciones & Trazabilidad de la Entrega:</span>
                    <p class="text-slate-800 italic">{{ doc.datos.observaciones }}</p>
                  </div>
                }

                <!-- Historial Completo de Entregas Parciales de esta Orden de Compra -->
                @if (doc.datos.orden_compra_id && historialEntradasDeOrden(doc.datos.orden_compra_id).length > 1) {
                  <div class="mt-3 border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/20 text-xs">
                    <div class="bg-indigo-100/60 p-2.5 font-bold text-indigo-950 uppercase tracking-wider flex items-center justify-between text-[11px]">
                      <span>📦 Historial Completo de Entregas de esta Orden ({{ doc.datos.orden_compra?.numero_orden || 'OC' }})</span>
                      <span class="font-mono text-indigo-800">{{ historialEntradasDeOrden(doc.datos.orden_compra_id).length }} entregas</span>
                    </div>
                    <table class="w-full text-left border-collapse font-mono text-[11px]">
                      <thead class="bg-white/80 text-slate-600 border-b border-indigo-100 text-[10px] uppercase">
                        <tr>
                          <th class="p-2">N° Entrada</th>
                          <th class="p-2">Fecha</th>
                          <th class="p-2">Doc. Soporte</th>
                          <th class="p-2 text-right">Subtotal</th>
                          <th class="p-2 text-right">IVA</th>
                          <th class="p-2 text-right">Total</th>
                          <th class="p-2 text-center">Estado CxP</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-indigo-100/60">
                        @for (he of historialEntradasDeOrden(doc.datos.orden_compra_id); track he.id) {
                          <tr [class]="he.id === doc.datos.id ? 'bg-indigo-50 font-bold' : ''">
                            <td class="p-2">
                              {{ he.numero_entrada }} (Entr #{{ he.numero_entrega || ($index + 1) }})
                              @if (he.id === doc.datos.id) {
                                <span class="text-[9px] text-indigo-600 font-sans ml-1">(Actual)</span>
                              }
                            </td>
                            <td class="p-2 text-slate-600">{{ he.fecha_entrada }}</td>
                            <td class="p-2">{{ he.numero_remision_proveedor ? 'Rem: ' + he.numero_remision_proveedor : (he.numero_factura_proveedor ? 'Fac: ' + he.numero_factura_proveedor : 'Directa') }}</td>
                            <td class="p-2 text-right">\${{ Number(he.subtotal || he.total_valorado || 0).toLocaleString('es-CO') }}</td>
                            <td class="p-2 text-right text-slate-600">\${{ Number(he.total_iva || 0).toLocaleString('es-CO') }}</td>
                            <td class="p-2 text-right text-indigo-900">\${{ Number(he.total_con_iva || he.total_valorado || 0).toLocaleString('es-CO') }}</td>
                            <td class="p-2 text-center">
                              @if (he.cxp_id || he.numero_factura_proveedor) {
                                <span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800">
                                  Factura: {{ he.numero_factura_proveedor || 'Causada' }}
                                </span>
                              } @else {
                                <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800">
                                  Remisión
                                </span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }

                <!-- Resumen Contable Oficial (Partida Doble NIIF) -->
                @if (doc.datos.asiento) {
                  <div class="mt-3 bg-slate-50 border border-slate-300 rounded-xl p-3">
                    <div class="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs">
                      <span class="font-bold text-slate-900 uppercase">
                        Comprobante Contable Asociado:
                        <span class="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-300 ml-1">
                          {{ doc.datos.asiento.numero_comprobante }}
                        </span>
                      </span>
                      <span class="text-[11px] text-slate-600 font-mono">
                        Estado: <b class="text-emerald-700">{{ doc.datos.asiento.estado }}</b>
                      </span>
                    </div>

                    @if (doc.datos.asiento.lineas?.length > 0) {
                      <div class="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <table class="w-full text-left text-[11px] border-collapse">
                          <thead class="bg-slate-100 font-mono text-[10px] uppercase text-slate-700 border-b border-slate-200">
                            <tr>
                              <th class="p-1.5">Cuenta PUC</th>
                              <th class="p-1.5">Nombre Cuenta</th>
                              <th class="p-1.5 text-right">Débito</th>
                              <th class="p-1.5 text-right">Crédito</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100 font-mono">
                            @for (lin of doc.datos.asiento.lineas; track lin.id || $index) {
                              <tr>
                                <td class="p-1.5 font-bold text-slate-900">{{ lin.cuenta?.codigo }}</td>
                                <td class="p-1.5 font-sans text-slate-700">{{ lin.cuenta?.nombre }}</td>
                                <td class="p-1.5 text-right text-emerald-700 font-bold">
                                  {{ Number(lin.debito) > 0 ? ('$' + Number(lin.debito).toLocaleString('es-CO')) : '-' }}
                                </td>
                                <td class="p-1.5 text-right text-indigo-700 font-bold">
                                  {{ Number(lin.credito) > 0 ? ('$' + Number(lin.credito).toLocaleString('es-CO')) : '-' }}
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                }
              }

              <!-- 2. NOTA DE AJUSTE / DEVOLUCIÓN -->
              @if (doc.tipo === 'AJUSTE') {
                <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div class="space-y-1">
                    <span class="block text-[10px] font-bold uppercase text-slate-500">Bodega de Despacho / Ajuste</span>
                    <p class="font-bold text-slate-900 text-sm">{{ doc.datos.bodega?.nombre }} ({{ doc.datos.bodega?.codigo }})</p>
                    <p class="text-[11px] text-slate-700">
                      <span class="font-bold uppercase">Tipo:</span>
                      <span class="font-bold ml-1 text-slate-900">
                        {{
                          doc.datos.tipo_ajuste === 'DEVOLUCION_PROVEEDOR' ? '📦 Devolución a Proveedor en Compra' :
                          doc.datos.tipo_ajuste === 'DEVOLUCION_CLIENTE' ? '↩️ Devolución de Cliente en Venta' :
                          doc.datos.tipo_ajuste
                        }}
                      </span>
                    </p>
                    @if (doc.datos.entrada_almacen || doc.datos.entrada_almacen_id) {
                      <p class="text-[11px] text-purple-700 font-mono font-bold">
                        <span class="uppercase font-semibold">Entrada de Origen:</span> {{ doc.datos.entrada_almacen?.numero_entrada || doc.datos.entrada_almacen_id }}
                      </p>
                    }
                    @if (doc.datos.proveedor || doc.datos.entrada_almacen?.proveedor) {
                      <p class="text-[11px] text-slate-800">
                        <span class="font-bold uppercase">Proveedor Destino:</span> {{ doc.datos.proveedor?.nombre_completo || doc.datos.entrada_almacen?.proveedor?.nombre_completo }}
                      </p>
                    }
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold uppercase text-slate-500">Justificación Técnica / Auditoría</span>
                    <p class="text-[11px] text-slate-800 italic bg-white p-2 rounded border border-slate-200 mt-0.5">
                      "{{ doc.datos.justificacion }}"
                    </p>
                  </div>
                </div>

                <!-- Tabla de Líneas de Ajuste -->
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase text-slate-700">
                      <tr>
                        <th class="p-2.5">Código SKU</th>
                        <th class="p-2.5">Artículo</th>
                        <th class="p-2.5 text-center">Efecto</th>
                        <th class="p-2.5 text-right">Cantidad</th>
                        <th class="p-2.5 text-right">Costo Unit.</th>
                        <th class="p-2.5 text-right">Impacto Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[11px]">
                      @for (l of doc.datos.lineas; track l.id || $index) {
                        <tr>
                          <td class="p-2.5 font-bold">{{ l.articulo?.codigo }}</td>
                          <td class="p-2.5 font-sans">{{ l.articulo?.nombre }}</td>
                          <td class="p-2.5 text-center">
                            <span class="font-bold" [class]="l.tipo_movimiento === 'ENTRADA' ? 'text-blue-700' : 'text-rose-700'">
                              {{ l.tipo_movimiento === 'ENTRADA' ? '+ ENTRADA' : '- SALIDA' }}
                            </span>
                          </td>
                          <td class="p-2.5 text-right font-bold">{{ Number(l.cantidad).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right">\${{ Number(l.costo_unitario).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right font-bold">\${{ (Number(l.cantidad) * Number(l.costo_unitario)).toLocaleString('es-CO') }}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-slate-50 border-t-2 border-slate-900 font-mono font-bold text-xs">
                      <tr>
                        <td colspan="5" class="p-2.5 text-right uppercase">Total Valorado Ajuste:</td>
                        <td class="p-2.5 text-right text-sm text-slate-900">\${{ Number(doc.datos.total_ajuste || 0).toLocaleString('es-CO') }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <!-- Resumen Contable Oficial (Partida Doble NIIF) -->
                @if (doc.datos.asiento) {
                  <div class="mt-3 bg-slate-50 border border-slate-300 rounded-xl p-3">
                    <div class="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs">
                      <span class="font-bold text-slate-900 uppercase">
                        Comprobante Contable Asociado:
                        <span class="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-300 ml-1">
                          {{ doc.datos.asiento.numero_comprobante }}
                        </span>
                      </span>
                      <span class="text-[11px] text-slate-600 font-mono">
                        Estado: <b class="text-emerald-700">{{ doc.datos.asiento.estado }}</b>
                      </span>
                    </div>

                    @if (doc.datos.asiento.lineas?.length > 0) {
                      <div class="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <table class="w-full text-left text-[11px] border-collapse">
                          <thead class="bg-slate-100 font-mono text-[10px] uppercase text-slate-700 border-b border-slate-200">
                            <tr>
                              <th class="p-1.5">Cuenta PUC</th>
                              <th class="p-1.5">Nombre Cuenta</th>
                              <th class="p-1.5 text-right">Débito</th>
                              <th class="p-1.5 text-right">Crédito</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100 font-mono">
                            @for (lin of doc.datos.asiento.lineas; track lin.id || $index) {
                              <tr>
                                <td class="p-1.5 font-bold text-slate-900">{{ lin.cuenta?.codigo }}</td>
                                <td class="p-1.5 font-sans text-slate-700">{{ lin.cuenta?.nombre }}</td>
                                <td class="p-1.5 text-right text-emerald-700 font-bold">
                                  {{ Number(lin.debito) > 0 ? ('$' + Number(lin.debito).toLocaleString('es-CO')) : '-' }}
                                </td>
                                <td class="p-1.5 text-right text-indigo-700 font-bold">
                                  {{ Number(lin.credito) > 0 ? ('$' + Number(lin.credito).toLocaleString('es-CO')) : '-' }}
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                }
              }

              <!-- 3. TRASLADO ENTRE BODEGAS -->
              @if (doc.tipo === 'TRASLADO') {
                <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span class="block text-[10px] font-bold uppercase text-slate-500">Bodega Origen</span>
                    <p class="font-bold text-slate-900 text-sm">{{ doc.datos.bodega?.nombre || 'Bodega Origen' }}</p>
                  </div>
                  <div>
                    <span class="block text-[10px] font-bold uppercase text-slate-500">Bodega Destino / Referencia</span>
                    <p class="font-bold text-slate-900 text-sm">{{ doc.datos.bodega_destino?.nombre || 'Bodega Destino' }}</p>
                  </div>
                  <div class="col-span-2">
                    <span class="text-[10px] font-bold uppercase text-slate-500">Observaciones:</span>
                    <p class="text-[11px] text-slate-700 mt-0.5">{{ doc.datos.observaciones || 'Sin observaciones registradas.' }}</p>
                  </div>
                </div>

                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase text-slate-700">
                      <tr>
                        <th class="p-2.5">Código SKU</th>
                        <th class="p-2.5">Artículo Trasladado</th>
                        <th class="p-2.5 text-right">Cantidad</th>
                        <th class="p-2.5 text-right">Costo Unitario</th>
                        <th class="p-2.5 text-right">Total Valorado</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr>
                        <td class="p-2.5 font-bold">{{ doc.datos.articulo?.codigo || 'SKU' }}</td>
                        <td class="p-2.5 font-sans">{{ doc.datos.articulo?.nombre || 'Artículo' }}</td>
                        <td class="p-2.5 text-right font-bold">{{ Number(doc.datos.cantidad_salida || doc.datos.cantidad_entrada || 1).toLocaleString('es-CO') }}</td>
                        <td class="p-2.5 text-right">\${{ Number(doc.datos.costo_unitario_salida || doc.datos.costo_unitario_entrada || 0).toLocaleString('es-CO') }}</td>
                        <td class="p-2.5 text-right font-bold">\${{ Number(doc.datos.costo_total_salida || doc.datos.costo_total_entrada || 0).toLocaleString('es-CO') }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }

              <!-- 4. REPORTE KARDEX NIIF -->
              @if (doc.tipo === 'KARDEX') {
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Artículo:</span>
                    <span class="font-bold text-slate-900 ml-1">{{ doc.articulo?.nombre || 'Consolidado General' }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Bodega:</span>
                    <span class="font-bold text-slate-900 ml-1">{{ doc.bodegaNombre || 'Todas las Bodegas' }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Método de Valuación:</span>
                    <span class="font-bold text-indigo-700 ml-1">Promedio Ponderado Móvil (NIC 2)</span>
                  </div>
                </div>

                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-100 border-b border-slate-300 font-mono text-[9px] uppercase text-slate-700">
                      <tr>
                        <th class="p-2" colspan="3">Movimiento</th>
                        <th class="p-2 text-center bg-blue-50 border-x border-slate-200" colspan="3">Entradas</th>
                        <th class="p-2 text-center bg-rose-50 border-r border-slate-200" colspan="3">Salidas</th>
                        <th class="p-2 text-center bg-emerald-50" colspan="3">Saldo Resultante</th>
                      </tr>
                      <tr class="border-t border-slate-300">
                        <th class="p-1.5">Fecha</th>
                        <th class="p-1.5">Doc</th>
                        <th class="p-1.5">Artículo</th>
                        <th class="p-1.5 text-right bg-blue-50">Cant</th>
                        <th class="p-1.5 text-right bg-blue-50">Unit</th>
                        <th class="p-1.5 text-right bg-blue-50 border-r border-slate-200">Total</th>
                        <th class="p-1.5 text-right bg-rose-50">Cant</th>
                        <th class="p-1.5 text-right bg-rose-50">Unit</th>
                        <th class="p-1.5 text-right bg-rose-50 border-r border-slate-200">Total</th>
                        <th class="p-1.5 text-right bg-emerald-50 font-bold">Cant</th>
                        <th class="p-1.5 text-right bg-emerald-50">Prom</th>
                        <th class="p-1.5 text-right bg-emerald-50 font-bold">Saldo Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[10px]">
                      @for (k of doc.movimientos; track k.id || $index) {
                        <tr>
                          <td class="p-1.5 text-slate-600">{{ k.fecha_movimiento }}</td>
                          <td class="p-1.5 font-bold">{{ k.documento_referencia }}</td>
                          <td class="p-1.5 truncate max-w-[120px] font-sans">{{ k.articulo?.nombre }}</td>
                          <td class="p-1.5 text-right bg-blue-50/50">{{ Number(k.cantidad_entrada) > 0 ? Number(k.cantidad_entrada).toLocaleString('es-CO') : '-' }}</td>
                          <td class="p-1.5 text-right bg-blue-50/50">{{ Number(k.cantidad_entrada) > 0 ? '$' + Number(k.costo_unitario_entrada).toLocaleString('es-CO') : '-' }}</td>
                          <td class="p-1.5 text-right bg-blue-50/50 font-bold border-r border-slate-200">{{ Number(k.cantidad_entrada) > 0 ? '$' + Number(k.costo_total_entrada).toLocaleString('es-CO') : '-' }}</td>
                          <td class="p-1.5 text-right bg-rose-50/50">{{ Number(k.cantidad_salida) > 0 ? Number(k.cantidad_salida).toLocaleString('es-CO') : '-' }}</td>
                          <td class="p-1.5 text-right bg-rose-50/50">{{ Number(k.cantidad_salida) > 0 ? '$' + Number(k.costo_unitario_salida).toLocaleString('es-CO') : '-' }}</td>
                          <td class="p-1.5 text-right bg-rose-50/50 font-bold border-r border-slate-200">{{ Number(k.cantidad_salida) > 0 ? '$' + Number(k.costo_total_salida).toLocaleString('es-CO') : '-' }}</td>
                          <td class="p-1.5 text-right bg-emerald-50/50 font-bold text-emerald-900">{{ Number(k.saldo_cantidad_resultante).toLocaleString('es-CO') }}</td>
                          <td class="p-1.5 text-right bg-emerald-50/50">\${{ Number(k.costo_unitario_promedio_resultante).toLocaleString('es-CO') }}</td>
                          <td class="p-1.5 text-right bg-emerald-50/50 font-bold text-slate-900">\${{ Number(k.saldo_costo_total_resultante).toLocaleString('es-CO') }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- 5. REPORTE DE EXISTENCIAS VALORADO -->
              @if (doc.tipo === 'EXISTENCIAS') {
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Bodega:</span>
                    <span class="font-bold text-slate-900 ml-1">{{ doc.bodegaNombre || 'Todas las Bodegas' }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Total Físico:</span>
                    <span class="font-bold text-emerald-700 font-mono ml-1">{{ doc.totalStock.toLocaleString('es-CO') }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Valorización NIIF:</span>
                    <span class="font-bold text-slate-900 font-mono ml-1">\${{ doc.totalValorado.toLocaleString('es-CO') }}</span>
                  </div>
                </div>

                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-100 border-b border-slate-300 font-mono text-[10px] uppercase text-slate-700">
                      <tr>
                        <th class="p-2.5">Bodega</th>
                        <th class="p-2.5">Código SKU</th>
                        <th class="p-2.5">Descripción de Artículo</th>
                        <th class="p-2.5 text-right">Existencia Física</th>
                        <th class="p-2.5 text-right">Costo Promedio</th>
                        <th class="p-2.5 text-right">Valor Total en Bodega</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[11px]">
                      @for (ex of doc.items; track ex.id || $index) {
                        <tr>
                          <td class="p-2.5 font-bold">{{ ex.bodega?.nombre }} ({{ ex.bodega?.codigo }})</td>
                          <td class="p-2.5 text-indigo-700 font-bold">{{ ex.articulo?.codigo }}</td>
                          <td class="p-2.5 font-sans font-medium">{{ ex.articulo?.nombre }}</td>
                          <td class="p-2.5 text-right font-bold text-emerald-700">{{ Number(ex.stock_actual).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right">\${{ Number(ex.costo_promedio).toLocaleString('es-CO') }}</td>
                          <td class="p-2.5 text-right font-bold text-slate-900">\${{ (Number(ex.stock_actual) * Number(ex.costo_promedio)).toLocaleString('es-CO') }}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-slate-50 border-t-2 border-slate-900 font-mono font-bold text-xs">
                      <tr>
                        <td colspan="3" class="p-2.5 text-right uppercase">Totales Consolidados:</td>
                        <td class="p-2.5 text-right text-emerald-700">{{ doc.totalStock.toLocaleString('es-CO') }}</td>
                        <td></td>
                        <td class="p-2.5 text-right text-sm text-slate-900">\${{ doc.totalValorado.toLocaleString('es-CO') }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>


              }

              <!-- Firmas y Pistas de Auditoría -->
              <div class="pt-8 grid grid-cols-3 gap-6 text-center text-xs font-mono">
                <div class="border-t border-slate-400 pt-2">
                  <p class="font-bold text-slate-800">Elaboró / Responsable</p>
                  <p class="text-[10px] text-slate-500">{{ authService.usuario()?.nombres || 'Usuario Autorizado' }}</p>
                </div>
                <div class="border-t border-slate-400 pt-2">
                  <p class="font-bold text-slate-800">Revisó / Jefe Almacén</p>
                  <p class="text-[10px] text-slate-500">Control de Inventarios</p>
                </div>
                <div class="border-t border-slate-400 pt-2">
                  <p class="font-bold text-slate-800">Aprobó / Contador General</p>
                  <p class="text-[10px] text-slate-500">Certificación NIIF / Revisoría</p>
                </div>
              </div>

              <!-- Pie Legal -->
              <div class="text-[9px] text-slate-400 border-t border-slate-200 pt-3 flex justify-between font-mono">
                <span>Generado por PACYOLO Cloud ERP | Cumplimiento NIC 2 Inventarios</span>
                <span>Pista de Auditoría: {{ doc.fecha }} | ID: {{ doc.consecutivo }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modales de Búsqueda Avanzada (Enterprise Lookup) -->
      <app-tercero-lookup-modal
        [(visible)]="mostrarLookupProveedor"
        titulo="Búsqueda Avanzada de Proveedor"
        [terceros]="proveedores()"
        (seleccionado)="alSeleccionarProveedorLookup($event)"
      />

      <app-articulo-lookup-modal
        [(visible)]="mostrarLookupArticulo"
        titulo="Catálogo Central de Artículos"
        [articulos]="articulos()"
        [modoSeleccion]="modoLookupArticulo()"
        (articuloSeleccionado)="alSeleccionarArticuloIndividual($event)"
        (articulosSeleccionados)="alSeleccionarArticulosMultiples($event)"
      />

      <app-orden-compra-lookup-modal
        [(visible)]="mostrarLookupOrdenCompra"
        titulo="Búsqueda de Órdenes de Compra Pendientes"
        [ordenes]="ordenesCompra()"
        (ordenSeleccionada)="alSeleccionarOrdenCompraDesdeLookup($event)"
      />
    </div>
  `,
})
export class ArticulosAdminComponent implements OnInit {

  historialEntradasDeOrden(ordenId: string): EntradaAlmacenItem[] {
    if (!ordenId) return [];
    return this.entradas().filter((e: any) => e.orden_compra_id === ordenId);
  }

  totalSubtotalEntrada(): number {
    return (this.entradaForm.lineas || []).reduce(
      (sum: number, l: any) => sum + (Number(l.cantidad || 0) * Number(l.costo_unitario || 0)),
      0
    );
  }

  totalIvaEntrada(): number {
    return (this.entradaForm.lineas || []).reduce(
      (sum: number, l: any) => {
        const sub = Number(l.cantidad || 0) * Number(l.costo_unitario || 0);
        const iva = Number(l.porcentaje_iva !== undefined ? l.porcentaje_iva : 19);
        return sum + (sub * iva / 100);
      },
      0
    );
  }

  totalConIvaEntrada(): number {
    return this.totalSubtotalEntrada() + this.totalIvaEntrada();
  }

  private readonly inventariosService = inject(InventariosService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly comprasService = inject(ComprasService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly http = inject(HttpClient);

  // Helper template
  readonly Number = Number;

  // Estado reactivo
  readonly pestanaActiva = signal<'articulos' | 'entradas' | 'traslados' | 'kardex' | 'ajustes' | 'existencias'>('articulos');
  readonly articulos = signal<ArticuloItem[]>([]);
  readonly articulosFiltrados = signal<ArticuloItem[]>([]);
  readonly entradas = signal<EntradaAlmacenItem[]>([]);
  readonly traslados = signal<any[]>([]);
  readonly kardexMovimientos = signal<KardexMovimientoItem[]>([]);
  readonly ajustes = signal<NotaAjusteItem[]>([]);
  readonly existencias = signal<SaldoBodegaItem[]>([]);
  readonly ordenesCompra = signal<OrdenCompraItem[]>([]);
  readonly entradaSeleccionadaParaDevolucion = signal<EntradaAlmacenItem | null>(null);

  readonly categorias = signal<ParametroItem[]>([]);
  readonly unidades = signal<ParametroItem[]>([]);
  readonly bodegas = signal<ParametroItem[]>([]);
  readonly proveedores = signal<any[]>([]);

  // Filtros de búsqueda
  busquedaArticulo = '';
  filtroTipoArticulo = '';
  busquedaEntrada = '';
  busquedaAjuste = '';
  filtroTipoAjuste = '';
  busquedaTraslado = '';
  busquedaExistencia = '';
  filtroBodegaExistencias = '';
  kardexFiltroArticulo = '';
  kardexFiltroBodega = '';
  kardexFiltroDoc = '';

  // Selecciones y visor documental
  readonly articuloKardexSeleccionado = signal<ArticuloItem | null>(null);
  readonly documentoParaImprimir = signal<any | null>(null);

  // Modales
  readonly mostrarModalArticulo = signal(false);
  readonly mostrarModalEntrada = signal(false);
  readonly mostrarModalTraslado = signal(false);
  readonly mostrarModalAjuste = signal(false);
  readonly guardando = signal(false);
  readonly articuloEnEdicion = signal<ArticuloItem | null>(null);

  // Paginación Reactiva por Listados
  readonly paginaArticulos = signal(1);
  readonly tamanoArticulos = signal(25);
  articulosPaginados(): ArticuloItem[] {
    const p = this.paginaArticulos();
    const s = this.tamanoArticulos();
    return this.articulosFiltrados().slice((p - 1) * s, p * s);
  }

  readonly paginaEntradas = signal(1);
  readonly tamanoEntradas = signal(25);
  entradasPaginadas(): EntradaAlmacenItem[] {
    const p = this.paginaEntradas();
    const s = this.tamanoEntradas();
    return this.entradasFiltradas().slice((p - 1) * s, p * s);
  }

  readonly paginaKardex = signal(1);
  readonly tamanoKardex = signal(25);
  kardexPaginado(): KardexMovimientoItem[] {
    const p = this.paginaKardex();
    const s = this.tamanoKardex();
    return this.kardexFiltrado().slice((p - 1) * s, p * s);
  }

  readonly paginaAjustes = signal(1);
  readonly tamanoAjustes = signal(25);
  ajustesPaginados(): NotaAjusteItem[] {
    const p = this.paginaAjustes();
    const s = this.tamanoAjustes();
    return this.ajustesFiltrados().slice((p - 1) * s, p * s);
  }

  readonly paginaExistencias = signal(1);
  readonly tamanoExistencias = signal(25);
  existenciasPaginadas(): SaldoBodegaItem[] {
    const p = this.paginaExistencias();
    const s = this.tamanoExistencias();
    return this.existenciasFiltradas().slice((p - 1) * s, p * s);
  }

  readonly paginaTraslados = signal(1);
  readonly tamanoTraslados = signal(25);
  trasladosPaginados(): any[] {
    const p = this.paginaTraslados();
    const s = this.tamanoTraslados();
    return this.trasladosFiltrados().slice((p - 1) * s, p * s);
  }

  // Estados de Modales Lookup Enterprise
  readonly mostrarLookupProveedor = signal(false);
  readonly mostrarLookupOrdenCompra = signal(false);

  ordenCompraSeleccionada(): OrdenCompraItem | undefined {
    return this.ordenesCompra().find((oc) => oc.id === this.entradaForm.orden_compra_id);
  }

  entradasPreviasPendientesCausar(): EntradaAlmacenItem[] {
    const ocId = this.entradaForm.orden_compra_id;
    if (!ocId) return [];
    return this.entradas().filter(
      (e) => e.orden_compra_id === ocId && (!e.cxp_id || e.cxp_id === null)
    );
  }

  totalEntradasPreviasPendientesCausar(): number {
    return this.entradasPreviasPendientesCausar().reduce(
      (acc, e) => acc + Number(e.total_valorado || 0),
      0
    );
  }

  entradasPreviasPendientesCausarNumeros(): string {
    return this.entradasPreviasPendientesCausar().map((e) => e.numero_entrada).join(', ');
  }

  obtenerPendienteEnOrden(articuloId: string): number | null {
    const oc = this.ordenCompraSeleccionada();
    if (!oc || !oc.lineas) return null;
    const lin = oc.lineas.find((l: any) => (l.articulo?.id || l.articulo_id) === articuloId);
    if (!lin) return null;
    const solicitada = Number(lin.cantidad_solicitada || 0);
    const recibida = Number(lin.cantidad_recibida || 0);
    return Math.max(0, Number((solicitada - recibida).toFixed(2)));
  }

  obtenerCantIngresadaEnEntrada(articuloId: string): number | null {
    const ent = this.entradaSeleccionadaParaDevolucion();
    if (!ent || !ent.lineas) return null;
    const lin = ent.lineas.find((l: any) => (l.articulo?.id || l.articulo_id) === articuloId);
    return lin ? Number(lin.cantidad) : null;
  }

  obtenerStockBodegaParaAjuste(articuloId: string, bodegaId?: string): number {
    if (!articuloId) return 0;
    const bId = bodegaId || this.ajusteForm.bodega_id;
    if (!bId) {
      const art = this.articulos().find((a) => a.id === articuloId);
      return art ? Number(art.stock_actual || 0) : 0;
    }
    const saldo = this.existencias().find((e: any) => {
      const eArtId = e.articulo?.id || e.articulo_id;
      const eBodId = e.bodega?.id || e.bodega_id;
      return eArtId === articuloId && eBodId === bId;
    });
    return saldo ? Number(saldo.stock_actual || 0) : 0;
  }

  esSalidaAjuste(lin: any): boolean {
    if (this.ajusteForm.tipo_ajuste === 'FALTANTE_MERMA' || this.ajusteForm.tipo_ajuste === 'DEVOLUCION_PROVEEDOR') return true;
    if (this.ajusteForm.tipo_ajuste === 'SOBRANTE' || this.ajusteForm.tipo_ajuste === 'DEVOLUCION_CLIENTE') return false;
    return lin.tipo_movimiento === 'SALIDA';
  }
  readonly mostrarLookupArticulo = signal(false);
  readonly destinoLookupArticulo = signal<'ENTRADA' | 'AJUSTE' | 'TRASLADO' | 'KARDEX'>('ENTRADA');
  readonly lineaSeleccionandoArticulo = signal<number | null>(null);
  readonly modoLookupArticulo = signal<'INDIVIDUAL' | 'MULTIPLE'>('INDIVIDUAL');

  // Cálculos y Filtrados Reactivos
  entradasFiltradas(): EntradaAlmacenItem[] {
    const q = this.busquedaEntrada.toLowerCase().trim();
    if (!q) return this.entradas();
    return this.entradas().filter((e) => {
      return (
        (e.numero_entrada && e.numero_entrada.toLowerCase().includes(q)) ||
        (e.numero_remision_proveedor && e.numero_remision_proveedor.toLowerCase().includes(q)) ||
        (e.proveedor?.nombre_completo && e.proveedor.nombre_completo.toLowerCase().includes(q)) ||
        (e.bodega?.nombre && e.bodega.nombre.toLowerCase().includes(q))
      );
    });
  }

  ajustesFiltrados(): NotaAjusteItem[] {
    const q = this.busquedaAjuste.toLowerCase().trim();
    const tipo = this.filtroTipoAjuste;
    return this.ajustes().filter((a) => {
      const matchQ =
        !q ||
        (a.numero_nota && a.numero_nota.toLowerCase().includes(q)) ||
        (a.justificacion && a.justificacion.toLowerCase().includes(q)) ||
        (a.bodega?.nombre && a.bodega.nombre.toLowerCase().includes(q));
      const matchTipo = !tipo || a.tipo_ajuste === tipo;
      return matchQ && matchTipo;
    });
  }

  trasladosFiltrados(): any[] {
    const q = this.busquedaTraslado.toLowerCase().trim();
    if (!q) return this.traslados();
    return this.traslados().filter((t) => {
      return (
        (t.documento_referencia && t.documento_referencia.toLowerCase().includes(q)) ||
        (t.bodega?.nombre && t.bodega.nombre.toLowerCase().includes(q)) ||
        (t.articulo?.nombre && t.articulo.nombre.toLowerCase().includes(q)) ||
        (t.articulo?.codigo && t.articulo.codigo.toLowerCase().includes(q)) ||
        (t.observaciones && t.observaciones.toLowerCase().includes(q))
      );
    });
  }

  kardexFiltrado(): KardexMovimientoItem[] {
    const qDoc = this.kardexFiltroDoc.toLowerCase().trim();
    if (!qDoc) return this.kardexMovimientos();
    return this.kardexMovimientos().filter((k) => {
      return (
        (k.documento_referencia && k.documento_referencia.toLowerCase().includes(qDoc)) ||
        (k.articulo?.nombre && k.articulo.nombre.toLowerCase().includes(qDoc)) ||
        (k.articulo?.codigo && k.articulo.codigo.toLowerCase().includes(qDoc))
      );
    });
  }

  existenciasFiltradas(): SaldoBodegaItem[] {
    const q = this.busquedaExistencia.toLowerCase().trim();
    const bodegaId = this.filtroBodegaExistencias;
    return this.existencias().filter((e) => {
      const matchQ =
        !q ||
        (e.articulo?.codigo && e.articulo.codigo.toLowerCase().includes(q)) ||
        (e.articulo?.nombre && e.articulo.nombre.toLowerCase().includes(q));
      const matchBodega = !bodegaId || e.bodega?.id === bodegaId || (e as any).bodega_id === bodegaId;
      return matchQ && matchBodega;
    });
  }

  totalStockExistencias(): number {
    return this.existenciasFiltradas().reduce((acc, curr) => acc + Number(curr.stock_actual || 0), 0);
  }

  totalValoradoExistencias(): number {
    return this.existenciasFiltradas().reduce(
      (acc, curr) => acc + Number(curr.stock_actual || 0) * Number(curr.costo_promedio || 0),
      0,
    );
  }

  proveedorSeleccionado(): any {
    return this.proveedores().find((p) => p.id === this.entradaForm.proveedor_id);
  }

  obtenerArticulo(id: string): any {
    return this.articulos().find((a) => a.id === id);
  }

  abrirLookupProveedor(): void {
    this.mostrarLookupProveedor.set(true);
  }

  alSeleccionarProveedorLookup(tercero: any): void {
    this.entradaForm.proveedor_id = tercero.id;
  }

  abrirLookupArticuloParaEntrada(index: number): void {
    this.destinoLookupArticulo.set('ENTRADA');
    this.lineaSeleccionandoArticulo.set(index);
    this.modoLookupArticulo.set('INDIVIDUAL');
    this.mostrarLookupArticulo.set(true);
  }

  abrirCatalogoMultipleEntrada(): void {
    this.destinoLookupArticulo.set('ENTRADA');
    this.modoLookupArticulo.set('MULTIPLE');
    this.mostrarLookupArticulo.set(true);
  }

  abrirLookupArticuloParaAjuste(index: number): void {
    this.destinoLookupArticulo.set('AJUSTE');
    this.lineaSeleccionandoArticulo.set(index);
    this.modoLookupArticulo.set('INDIVIDUAL');
    this.mostrarLookupArticulo.set(true);
  }

  abrirCatalogoMultipleAjuste(): void {
    this.destinoLookupArticulo.set('AJUSTE');
    this.modoLookupArticulo.set('MULTIPLE');
    this.mostrarLookupArticulo.set(true);
  }

  abrirLookupArticuloParaTraslado(index: number): void {
    this.destinoLookupArticulo.set('TRASLADO');
    this.lineaSeleccionandoArticulo.set(index);
    this.modoLookupArticulo.set('INDIVIDUAL');
    this.mostrarLookupArticulo.set(true);
  }

  abrirCatalogoMultipleTraslado(): void {
    this.destinoLookupArticulo.set('TRASLADO');
    this.modoLookupArticulo.set('MULTIPLE');
    this.mostrarLookupArticulo.set(true);
  }

  abrirLookupArticuloKardex(): void {
    this.destinoLookupArticulo.set('KARDEX');
    this.lineaSeleccionandoArticulo.set(null);
    this.modoLookupArticulo.set('INDIVIDUAL');
    this.mostrarLookupArticulo.set(true);
  }

  limpiarArticuloKardex(): void {
    this.articuloKardexSeleccionado.set(null);
    this.kardexFiltroArticulo = '';
    this.cargarKardex();
  }

  // Modales de Impresión Formal
  abrirModalImprimirEntrada(ent: any): void {
    this.documentoParaImprimir.set({
      tipo: 'ENTRADA',
      titulo: 'COMPROBANTE OFICIAL DE ENTRADA DE ALMACÉN',
      consecutivo: ent.numero_entrada || 'EA-BORRADOR',
      fecha: ent.fecha_entrada || new Date().toISOString().slice(0, 10),
      datos: ent,
    });
  }

  abrirModalImprimirAjuste(aj: any): void {
    this.documentoParaImprimir.set({
      tipo: 'AJUSTE',
      titulo: 'ACTA FORMAL DE NOTA DE AJUSTE DE INVENTARIO',
      consecutivo: aj.numero_nota || 'AJ-BORRADOR',
      fecha: aj.fecha_ajuste || new Date().toISOString().slice(0, 10),
      datos: aj,
    });
  }

  abrirModalImprimirTraslado(tr: any): void {
    this.documentoParaImprimir.set({
      tipo: 'TRASLADO',
      titulo: 'COMPROBANTE FORMAL DE TRASLADO ENTRE BODEGAS',
      consecutivo: tr.documento_referencia || 'TR-BORRADOR',
      fecha: tr.fecha_movimiento || new Date().toISOString().slice(0, 10),
      datos: tr,
    });
  }

  abrirModalImprimirKardex(): void {
    const art = this.articuloKardexSeleccionado();
    const bod = this.bodegas().find((b) => b.id === this.kardexFiltroBodega);
    this.documentoParaImprimir.set({
      tipo: 'KARDEX',
      titulo: 'LIBRO AUXILIAR DE KARDEX CONTINUO NIIF (NIC 2)',
      consecutivo: `KDX-${art ? art.codigo : 'GENERAL'}`,
      fecha: new Date().toISOString().slice(0, 10),
      articulo: art,
      bodegaNombre: bod ? `${bod.nombre} (${bod.codigo})` : 'Todas las Bodegas',
      movimientos: this.kardexFiltrado(),
    });
  }

  abrirModalImprimirExistencias(): void {
    const bod = this.bodegas().find((b) => b.id === this.filtroBodegaExistencias);
    this.documentoParaImprimir.set({
      tipo: 'EXISTENCIAS',
      titulo: 'REPORTE OFICIAL DE EXISTENCIAS DE INVENTARIO VALORADO',
      consecutivo: `INV-${new Date().toISOString().slice(0, 10)}`,
      fecha: new Date().toISOString().slice(0, 10),
      bodegaNombre: bod ? `${bod.nombre} (${bod.codigo})` : 'Todas las Bodegas',
      totalStock: this.totalStockExistencias(),
      totalValorado: this.totalValoradoExistencias(),
      items: this.existenciasFiltradas(),
      datos: {},
    });
  }

  cerrarModalImprimir(): void {
    this.documentoParaImprimir.set(null);
  }

  imprimirDocumento(): void {
    window.print();
  }

  alSeleccionarArticuloIndividual(art: any): void {
    const destino = this.destinoLookupArticulo();
    if (destino === 'KARDEX') {
      this.articuloKardexSeleccionado.set(art);
      this.kardexFiltroArticulo = art.id;
      this.cargarKardex();
      return;
    }

    const idx = this.lineaSeleccionandoArticulo();
    if (idx === null) return;

    if (destino === 'ENTRADA' && this.entradaForm.lineas[idx]) {
      this.entradaForm.lineas[idx].articulo_id = art.id;
      this.entradaForm.lineas[idx].costo_unitario = Number(art.costo_promedio || 0);
    } else if (destino === 'AJUSTE' && this.ajusteForm.lineas[idx]) {
      this.ajusteForm.lineas[idx].articulo_id = art.id;
    } else if (destino === 'TRASLADO' && this.trasladoForm.lineas[idx]) {
      this.trasladoForm.lineas[idx].articulo_id = art.id;
    }
  }

  alSeleccionarArticulosMultiples(articulosSeleccionados: any[]): void {
    if (!articulosSeleccionados || articulosSeleccionados.length === 0) return;
    const destino = this.destinoLookupArticulo();

    if (destino === 'ENTRADA') {
      if (
        this.entradaForm.lineas.length === 1 &&
        (!this.entradaForm.lineas[0].articulo_id || this.entradaForm.lineas[0].articulo_id === '')
      ) {
        this.entradaForm.lineas = [];
      }
      for (const art of articulosSeleccionados) {
        const yaExiste = this.entradaForm.lineas.some((l: any) => l.articulo_id === art.id);
        if (!yaExiste) {
          this.entradaForm.lineas.push({
            articulo_id: art.id,
            cantidad: 1,
            costo_unitario: Number(art.costo_promedio || 0),
          });
        }
      }
      if (this.entradaForm.lineas.length === 0) this.agregarLineaEntrada();
    } else if (destino === 'AJUSTE') {
      if (
        this.ajusteForm.lineas.length === 1 &&
        (!this.ajusteForm.lineas[0].articulo_id || this.ajusteForm.lineas[0].articulo_id === '')
      ) {
        this.ajusteForm.lineas = [];
      }
      const movAjuste = this.ajusteForm.tipo_ajuste === 'FALTANTE_MERMA' ? 'SALIDA' : 'ENTRADA';
      for (const art of articulosSeleccionados) {
        const yaExiste = this.ajusteForm.lineas.some((l: any) => l.articulo_id === art.id);
        if (!yaExiste) {
          this.ajusteForm.lineas.push({
            articulo_id: art.id,
            tipo_movimiento: movAjuste,
            cantidad: 1,
          });
        }
      }
      if (this.ajusteForm.lineas.length === 0) this.agregarLineaAjuste();
    } else if (destino === 'TRASLADO') {
      if (
        this.trasladoForm.lineas.length === 1 &&
        (!this.trasladoForm.lineas[0].articulo_id || this.trasladoForm.lineas[0].articulo_id === '')
      ) {
        this.trasladoForm.lineas = [];
      }
      for (const art of articulosSeleccionados) {
        const yaExiste = this.trasladoForm.lineas.some((l: any) => l.articulo_id === art.id);
        if (!yaExiste) {
          this.trasladoForm.lineas.push({
            articulo_id: art.id,
            cantidad: 1,
          });
        }
      }
      if (this.trasladoForm.lineas.length === 0) this.agregarLineaTraslado();
    }
  }

  articuloForm: any = {
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_articulo: 'INVENTARIABLE',
    categoria_id: '',
    unidad_medida_id: '',
    codigo_barras: '',
    precio_venta_sugerido: 0,
    costo_promedio: 0,
    stock_minimo: 5,
    tarifa_iva: 19,
  };

  entradaForm: any = {
    orden_compra_id: '',
    proveedor_id: '',
    bodega_id: '',
    numero_remision_proveedor: '',
    fecha_entrada: new Date().toISOString().slice(0, 10),
    lineas: [{ articulo_id: '', cantidad: 10, costo_unitario: 0 }],
  };

  trasladoForm: any = {
    bodega_origen_id: '',
    bodega_destino_id: '',
    fecha_traslado: new Date().toISOString().slice(0, 10),
    observaciones: '',
    lineas: [{ articulo_id: '', cantidad: 1 }],
  };

  ajusteForm: any = {
    bodega_id: '',
    tipo_ajuste: 'SOBRANTE',
    fecha_ajuste: new Date().toISOString().slice(0, 10),
    justificacion: '',
    lineas: [{ articulo_id: '', tipo_movimiento: 'ENTRADA', cantidad: 1 }],
  };

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargarArticulos();
    this.cargarEntradas();
    this.cargarAjustes();
    this.cargarTraslados();
    this.cargarExistencias();

    // Cargar catálogos
    this.parametrosService.obtenerCategoriasArticulos().subscribe((cats: ParametroItem[]) => this.categorias.set(cats));
    this.parametrosService.obtenerUnidadesMedida().subscribe((uns: ParametroItem[]) => this.unidades.set(uns));
    this.parametrosService.obtenerBodegas().subscribe((bods: ParametroItem[]) => this.bodegas.set(bods));

    // Cargar órdenes de compra para vincular a entradas
    this.comprasService.listarOrdenes().subscribe((ords) => this.ordenesCompra.set(ords));

    // Cargar proveedores desde Terceros de la empresa activa
    const emp = this.authService.empresaActiva();
    const provUrl = emp
      ? `http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`
      : 'http://localhost:3000/api/v1/terceros';

    this.http.get<any[]>(provUrl).subscribe({
      next: (terceros) => this.proveedores.set(terceros),
      error: (err) => console.error('Error cargando proveedores:', err),
    });
  }

  cargarArticulos(): void {
    this.inventariosService.listarArticulos().subscribe((arts) => {
      this.articulos.set(arts);
      this.filtrarArticulos();
    });
  }

  filtrarArticulos(): void {
    this.paginaArticulos.set(1);
    const q = this.busquedaArticulo.toLowerCase().trim();
    const tipo = this.filtroTipoArticulo;

    const filtrados = this.articulos().filter((a) => {
      const matchQ =
        !q ||
        a.codigo.toLowerCase().includes(q) ||
        a.nombre.toLowerCase().includes(q) ||
        (a.codigo_barras && a.codigo_barras.includes(q));
      const matchTipo = !tipo || a.tipo_articulo === tipo;
      return matchQ && matchTipo;
    });

    this.articulosFiltrados.set(filtrados);
  }

  cargarEntradas(): void {
    this.inventariosService.listarEntradas().subscribe((ents) => this.entradas.set(ents));
  }

  cargarKardex(): void {
    this.inventariosService
      .consultarKardex({
        articulo_id: this.kardexFiltroArticulo || undefined,
        bodega_id: this.kardexFiltroBodega || undefined,
      })
      .subscribe((movs) => this.kardexMovimientos.set(movs));
  }

  cargarAjustes(): void {
    this.inventariosService.listarAjustes().subscribe((ajs) => this.ajustes.set(ajs));
  }

  cargarExistencias(): void {
    this.inventariosService.consultarExistencias().subscribe((ex) => this.existencias.set(ex));
  }

  // Modales y Acciones
  abrirModalArticulo(): void {
    this.articuloEnEdicion.set(null);
    this.articuloForm = {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_articulo: 'INVENTARIABLE',
      categoria_id: this.categorias()[0]?.id || '',
      unidad_medida_id: this.unidades()[0]?.id || '',
      codigo_barras: '',
      precio_venta_sugerido: 0,
      costo_promedio: 0,
      stock_minimo: 5,
      tarifa_iva: 19,
    };
    this.mostrarModalArticulo.set(true);
  }

  editarArticulo(art: ArticuloItem): void {
    this.articuloEnEdicion.set(art);
    this.articuloForm = {
      codigo: art.codigo || '',
      nombre: art.nombre || '',
      descripcion: art.descripcion || '',
      tipo_articulo: art.tipo_articulo || 'INVENTARIABLE',
      categoria_id: art.categoria_id || (art.categoria ? (art.categoria as any).id : ''),
      unidad_medida_id: art.unidad_medida_id || (art.unidad_medida ? (art.unidad_medida as any).id : ''),
      codigo_barras: art.codigo_barras || '',
      precio_venta_sugerido: Number(art.precio_venta_sugerido ?? 0),
      costo_promedio: Number(art.costo_promedio ?? 0),
      stock_minimo: Number(art.stock_minimo ?? 0),
      stock_maximo: Number(art.stock_maximo ?? 100),
      tarifa_iva: Number(art.tarifa_iva ?? 19),
      tarifa_inc: Number(art.tarifa_inc ?? 0),
      cuenta_inventario: art.cuenta_inventario || '',
      cuenta_costo_venta: art.cuenta_costo_venta || '',
      cuenta_gasto: art.cuenta_gasto || '',
    };
    this.mostrarModalArticulo.set(true);
  }

  guardarArticulo(): void {
    this.guardando.set(true);
    const edicion = this.articuloEnEdicion();

    if (edicion) {
      // EN EDICIÓN: Omitir estrictamente campos inmutables (codigo, tipo_articulo, costo_promedio)
      const updatePayload: any = {
        nombre: (this.articuloForm.nombre || '').trim(),
        descripcion: (this.articuloForm.descripcion || '').trim() || undefined,
        categoria_id: this.articuloForm.categoria_id || undefined,
        unidad_medida_id: this.articuloForm.unidad_medida_id || undefined,
        codigo_barras: (this.articuloForm.codigo_barras || '').trim() || undefined,
        precio_venta_sugerido: Number(this.articuloForm.precio_venta_sugerido ?? 0),
        stock_minimo: Number(this.articuloForm.stock_minimo ?? 0),
        stock_maximo: Number(this.articuloForm.stock_maximo ?? 100),
        tarifa_iva: Number(this.articuloForm.tarifa_iva ?? 19),
        tarifa_inc: Number(this.articuloForm.tarifa_inc ?? 0),
        cuenta_inventario: (this.articuloForm.cuenta_inventario || '').trim() || undefined,
        cuenta_costo_venta: (this.articuloForm.cuenta_costo_venta || '').trim() || undefined,
        cuenta_gasto: (this.articuloForm.cuenta_gasto || '').trim() || undefined,
      };

      this.inventariosService.actualizarArticulo(edicion.id, updatePayload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalArticulo.set(false);
          this.notificationService.success('Artículo actualizado exitosamente en el catálogo.');
          this.cargarArticulos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.notificationService.error(err.error?.message || 'Error al actualizar artículo');
        },
      });
    } else {
      // EN CREACIÓN: Incluye código, tipo_articulo y costo promedio inicial
      const createPayload: any = {
        codigo: (this.articuloForm.codigo || '').trim().toUpperCase(),
        nombre: (this.articuloForm.nombre || '').trim(),
        descripcion: (this.articuloForm.descripcion || '').trim() || undefined,
        tipo_articulo: this.articuloForm.tipo_articulo || 'INVENTARIABLE',
        categoria_id: this.articuloForm.categoria_id || undefined,
        unidad_medida_id: this.articuloForm.unidad_medida_id || undefined,
        codigo_barras: (this.articuloForm.codigo_barras || '').trim() || undefined,
        precio_venta_sugerido: Number(this.articuloForm.precio_venta_sugerido ?? 0),
        costo_promedio: Number(this.articuloForm.costo_promedio ?? 0),
        stock_minimo: Number(this.articuloForm.stock_minimo ?? 0),
        stock_maximo: Number(this.articuloForm.stock_maximo ?? 100),
        tarifa_iva: Number(this.articuloForm.tarifa_iva ?? 19),
        tarifa_inc: Number(this.articuloForm.tarifa_inc ?? 0),
        cuenta_inventario: (this.articuloForm.cuenta_inventario || '').trim() || undefined,
        cuenta_costo_venta: (this.articuloForm.cuenta_costo_venta || '').trim() || undefined,
        cuenta_gasto: (this.articuloForm.cuenta_gasto || '').trim() || undefined,
      };

      this.inventariosService.crearArticulo(createPayload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalArticulo.set(false);
          this.notificationService.success('Artículo creado exitosamente en el catálogo.');
          this.cargarArticulos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.notificationService.error(err.error?.message || 'Error al crear artículo');
        },
      });
    }
  }

  cambiarEstadoArticulo(art: ArticuloItem): void {
    this.inventariosService.cambiarEstadoArticulo(art.id, !art.activo).subscribe({
      next: () => {
        this.notificationService.info(`El artículo ahora está ${!art.activo ? 'activo' : 'inactivo'}.`);
        this.cargarArticulos();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Error al cambiar estado del artículo');
      },
    });
  }

  abrirModalEntrada(): void {
    const primerArticulo = this.articulos()[0];
    this.comprasService.listarOrdenes().subscribe((ords) => this.ordenesCompra.set(ords));
    this.entradaForm = {
      orden_compra_id: '',
      proveedor_id: this.proveedores()[0]?.id || '',
      bodega_id: this.bodegas()[0]?.id || '',
      numero_remision_proveedor: '',
      fecha_entrada: new Date().toISOString().slice(0, 10),
      causar_cxp: false,
      numero_factura_proveedor: '',
      fecha_factura: new Date().toISOString().slice(0, 10),
      lineas: [
        {
          articulo_id: primerArticulo?.id || '',
          cantidad: 1,
          costo_unitario: Number(primerArticulo?.costo_promedio || 0),
        },
      ],
    };
    this.mostrarModalEntrada.set(true);
  }

  agregarLineaEntrada(): void {
    const primerArticulo = this.articulos()[0];
    this.entradaForm.lineas.push({
      articulo_id: primerArticulo?.id || '',
      cantidad: 1,
      costo_unitario: Number(primerArticulo?.costo_promedio || 0),
    });
  }

  removerLineaEntrada(index: number): void {
    this.entradaForm.lineas.splice(index, 1);
  }

  guardarEntrada(): void {
    if (!this.entradaForm.proveedor_id) {
      this.notificationService.warning('Debe seleccionar un proveedor para la entrada.');
      return;
    }
    if (!this.entradaForm.bodega_id) {
      this.notificationService.warning('Debe seleccionar una bodega de destino.');
      return;
    }
    if (this.entradaForm.causar_cxp && !this.entradaForm.numero_factura_proveedor?.trim()) {
      this.notificationService.warning('Debe ingresar el número de factura del proveedor para causar en CxP.');
      return;
    }

    const lineas = this.entradaForm.lineas || [];
    if (lineas.length === 0) {
      this.notificationService.warning('Debe agregar al menos un artículo en la entrada.');
      return;
    }

    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (!l.articulo_id || String(l.articulo_id).trim() === '') {
        this.notificationService.warning(`La línea #${i + 1} no tiene un artículo seleccionado.`);
        return;
      }
      const cant = Number(l.cantidad);
      if (isNaN(cant) || cant <= 0) {
        this.notificationService.warning(`La cantidad en la línea #${i + 1} debe ser un valor positivo mayor a cero.`);
        return;
      }
      const costo = Number(l.costo_unitario);
      if (isNaN(costo) || costo < 0) {
        this.notificationService.warning(`El costo unitario en la línea #${i + 1} no puede ser negativo.`);
        return;
      }
      const iva = Number(l.porcentaje_iva !== undefined ? l.porcentaje_iva : 19);
      if (isNaN(iva) || iva < 0) {
        this.notificationService.warning(`El porcentaje de IVA en la línea #${i + 1} no puede ser negativo.`);
        return;
      }

      if (this.entradaForm.orden_compra_id) {
        const pend = this.obtenerPendienteEnOrden(l.articulo_id);
        if (pend === null) {
          const art = this.obtenerArticulo(l.articulo_id);
          this.notificationService.error(
            `El artículo '${art?.nombre || l.articulo_id}' no forma parte de la Orden de Compra vinculada.`
          );
          return;
        }
        if (cant > pend) {
          const art = this.obtenerArticulo(l.articulo_id);
          this.notificationService.error(
            `No es posible ingresar ${cant} unidades de '${art?.nombre || l.articulo_id}'. La Orden de Compra vinculada solo tiene pendiente ${pend} unidad(es). No se permiten recepciones en exceso.`
          );
          return;
        }
      }
    }

    const lineasSanitizadas = lineas.map((l: any) => ({
      articulo_id: l.articulo_id,
      cantidad: Number(l.cantidad),
      costo_unitario: Number(l.costo_unitario),
      porcentaje_iva: Number(l.porcentaje_iva !== undefined ? l.porcentaje_iva : 19),
    }));

    const payload: any = {
      proveedor_id: this.entradaForm.proveedor_id,
      bodega_id: this.entradaForm.bodega_id,
      fecha_entrada: this.entradaForm.fecha_entrada || new Date().toISOString().slice(0, 10),
      causar_cxp: !!this.entradaForm.causar_cxp,
      observaciones: this.entradaForm.observaciones?.trim() || undefined,
      lineas: lineasSanitizadas,
    };

    if (this.entradaForm.orden_compra_id) {
      payload.orden_compra_id = this.entradaForm.orden_compra_id;
    }
    if (this.entradaForm.numero_remision_proveedor?.trim()) {
      payload.numero_remision_proveedor = this.entradaForm.numero_remision_proveedor.trim();
    }
    if (this.entradaForm.causar_cxp) {
      payload.numero_factura_proveedor = this.entradaForm.numero_factura_proveedor.trim();
      payload.fecha_factura = this.entradaForm.fecha_factura || payload.fecha_entrada;
    }

    this.guardando.set(true);
    this.inventariosService.registrarEntrada(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalEntrada.set(false);
        const mensaje = payload.causar_cxp
          ? 'Entrada de almacén registrada, Kardex actualizado y Factura causada en Cuentas por Pagar (CxP).'
          : 'Entrada de almacén física registrada exitosamente y Kardex actualizado.';
        this.notificationService.success(mensaje, 'Recepción Completada');
        this.cargarEntradas();
        this.cargarArticulos();
        this.cargarExistencias();
        this.comprasService.listarOrdenes().subscribe((ords) => this.ordenesCompra.set(ords));
        if (this.pestanaActiva() === 'kardex') this.cargarKardex();
      },
      error: (err) => {
        this.guardando.set(false);
        this.notificationService.error(err.error?.message || 'Error al registrar entrada de almacén');
      },
    });
  }

  abrirModalAjuste(): void {
    const primerArticulo = this.articulos()[0];
    this.cargarExistencias();
    this.entradaSeleccionadaParaDevolucion.set(null);
    this.ajusteForm = {
      bodega_id: this.bodegas()[0]?.id || '',
      tipo_ajuste: 'FALTANTE_MERMA',
      fecha_ajuste: new Date().toISOString().slice(0, 10),
      justificacion: '',
      lineas: [{ articulo_id: primerArticulo?.id || '', tipo_movimiento: 'SALIDA', cantidad: 1 }],
    };
    this.mostrarModalAjuste.set(true);
  }

  abrirModalDevolucionDesdeEntrada(ent: EntradaAlmacenItem): void {
    this.cargarExistencias();
    this.entradaSeleccionadaParaDevolucion.set(ent);
    const lineasPrecargadas = (ent.lineas || []).map((l: any) => ({
      articulo_id: l.articulo?.id || l.articulo_id,
      tipo_movimiento: 'SALIDA',
      cantidad: Number(l.cantidad),
      costo_unitario: Number(l.costo_unitario || 0),
    }));

    this.ajusteForm = {
      bodega_id: ent.bodega?.id || (ent as any).bodega_id || this.bodegas()[0]?.id || '',
      tipo_ajuste: 'DEVOLUCION_PROVEEDOR',
      entrada_almacen_id: ent.id,
      proveedor_id: ent.proveedor?.id || (ent as any).proveedor_id || undefined,
      fecha_ajuste: new Date().toISOString().slice(0, 10),
      justificacion: `Devolución de compra a proveedor correspondiente a la Entrada ${ent.numero_entrada} (${ent.proveedor?.nombre_completo || 'Proveedor'})${ent.numero_factura_proveedor ? ' - Fac ' + ent.numero_factura_proveedor : (ent.numero_remision_proveedor ? ' - Rem ' + ent.numero_remision_proveedor : '')}`,
      lineas: lineasPrecargadas.length > 0 ? lineasPrecargadas : [{ articulo_id: this.articulos()[0]?.id || '', tipo_movimiento: 'SALIDA', cantidad: 1 }],
    };
    this.mostrarModalAjuste.set(true);
    this.notificationService.info(`Formulario de Devolución precargado con los artículos de la Entrada ${ent.numero_entrada}.`);
  }

  desvincularEntradaDevolucion(): void {
    this.entradaSeleccionadaParaDevolucion.set(null);
    if (this.ajusteForm) {
      delete this.ajusteForm.entrada_almacen_id;
      delete this.ajusteForm.proveedor_id;
    }
  }

  alSeleccionarEntradaParaDevolucion(event: Event): void {
    const entId = (event.target as HTMLSelectElement).value;
    if (!entId) {
      this.desvincularEntradaDevolucion();
      return;
    }
    const ent = this.entradas().find((e) => e.id === entId);
    if (ent) {
      this.abrirModalDevolucionDesdeEntrada(ent);
    }
  }

  alCambiarTipoAjuste(): void {
    const tipo = this.ajusteForm.tipo_ajuste;
    if (tipo === 'FALTANTE_MERMA' || tipo === 'DEVOLUCION_PROVEEDOR') {
      this.ajusteForm.lineas.forEach((l: any) => (l.tipo_movimiento = 'SALIDA'));
    } else if (tipo === 'SOBRANTE' || tipo === 'DEVOLUCION_CLIENTE') {
      this.ajusteForm.lineas.forEach((l: any) => (l.tipo_movimiento = 'ENTRADA'));
    }
  }

  agregarLineaAjuste(): void {
    const mov = (this.ajusteForm.tipo_ajuste === 'FALTANTE_MERMA' || this.ajusteForm.tipo_ajuste === 'DEVOLUCION_PROVEEDOR') ? 'SALIDA' : 'ENTRADA';
    this.ajusteForm.lineas.push({
      articulo_id: this.articulos()[0]?.id || '',
      tipo_movimiento: mov,
      cantidad: 1,
    });
  }

  removerLineaAjuste(index: number): void {
    this.ajusteForm.lineas.splice(index, 1);
  }

  anularNotaAjuste(aj: NotaAjusteItem): void {
    this.notificationService.confirm({
      title: 'Confirmar Anulación de Ajuste',
      message: `¿Está seguro de ANULAR la Nota de Ajuste ${aj.numero_nota}? Se revertirá automáticamente el stock de las bodegas, se registrará el contra-asiento contable oficial y se actualizará el Kardex NIIF.`,
      confirmText: 'Sí, Anular Ajuste',
      cancelText: 'Cancelar',
      intent: 'danger',
    }).then((confirmado) => {
      if (!confirmado) return;
      this.guardando.set(true);
      this.inventariosService.anularAjuste(aj.id, 'Anulación solicitada por usuario en panel de control').subscribe({
        next: () => {
          this.guardando.set(false);
          this.notificationService.success(
            `Nota de ajuste ${aj.numero_nota} anulada exitosamente. Stock, Kardex y asiento contable revertidos con éxito.`,
            'Ajuste Anulado',
          );
          this.cargarAjustes();
          this.cargarArticulos();
          if (this.pestanaActiva() === 'kardex') this.cargarKardex();
        },
        error: (err) => {
          this.guardando.set(false);
          this.notificationService.error(err.error?.message || 'Error al anular nota de ajuste');
        },
      });
    });
  }

  guardarAjuste(): void {
    if (!this.ajusteForm.bodega_id) {
      this.notificationService.warning('Debe seleccionar una bodega para el ajuste.');
      return;
    }
    if (!this.ajusteForm.justificacion?.trim()) {
      this.notificationService.warning('Debe ingresar una justificación detallada para el ajuste.');
      return;
    }
    const lineas = this.ajusteForm.lineas || [];
    if (lineas.length === 0) {
      this.notificationService.warning('Debe incluir al menos un artículo para ajustar.');
      return;
    }

    for (let i = 0; i < lineas.length; i++) {
      const lin = lineas[i];
      if (!lin.articulo_id || String(lin.articulo_id).trim() === '') {
        this.notificationService.warning(`La línea #${i + 1} no tiene un artículo seleccionado.`);
        return;
      }
      const cant = Number(lin.cantidad);
      if (isNaN(cant) || cant <= 0) {
        this.notificationService.warning(`La cantidad en la línea #${i + 1} debe ser mayor a cero.`);
        return;
      }
      if (this.esSalidaAjuste(lin)) {
        // Validación contra stock disponible en bodega
        const stockDisp = this.obtenerStockBodegaParaAjuste(lin.articulo_id, this.ajusteForm.bodega_id);
        if (cant > stockDisp) {
          const art = this.obtenerArticulo(lin.articulo_id);
          const nomArt = art?.nombre || `Línea #${i + 1}`;
          this.notificationService.error(
            `No es posible registrar salida de ${cant} unidades de '${nomArt}'. El stock disponible en bodega es de ${stockDisp} unidades. No se permite inventario negativo.`
          );
          return;
        }

        // Validación estricta contra cantidad recibida en la entrada vinculada
        if (this.ajusteForm.tipo_ajuste === 'DEVOLUCION_PROVEEDOR' && this.entradaSeleccionadaParaDevolucion()) {
          const cantIngresada = this.obtenerCantIngresadaEnEntrada(lin.articulo_id);
          if (cantIngresada !== null && cant > cantIngresada) {
            const art = this.obtenerArticulo(lin.articulo_id);
            const nomArt = art?.nombre || `Línea #${i + 1}`;
            this.notificationService.error(
              `No es posible devolver ${cant} unidades de '${nomArt}'. La Entrada vinculada solo recibió ${cantIngresada} unidad(es).`
            );
            return;
          }
        }
      }
    }

    const emp = this.authService.empresaActiva();
    const payload = {
      ...this.ajusteForm,
      empresa_id: emp?.empresa_id || undefined,
    };
    this.guardando.set(true);
    this.inventariosService.registrarAjuste(payload).subscribe({
      next: (res: any) => {
        this.guardando.set(false);
        this.mostrarModalAjuste.set(false);
        const comprobante = res?.asiento?.numero_comprobante ? ` (Comprobante ${res.asiento.numero_comprobante})` : '';
        this.notificationService.success(
          `Nota de ajuste ${res?.numero_nota || ''} registrada, aplicada al Kardex y contabilizada${comprobante}.`,
          'Ajuste Exitoso',
        );
        this.cargarAjustes();
        this.cargarArticulos();
        this.cargarExistencias();
        if (this.pestanaActiva() === 'kardex') this.cargarKardex();
      },
      error: (err) => {
        this.guardando.set(false);
        this.notificationService.error(err.error?.message || 'Error al registrar nota de ajuste');
      },
    });
  }

  abrirLookupOrdenCompra(): void {
    this.comprasService.listarOrdenes().subscribe((ords) => this.ordenesCompra.set(ords));
    this.mostrarLookupOrdenCompra.set(true);
  }

  alSeleccionarOrdenCompraDesdeLookup(oc: OrdenCompraItem): void {
    this.entradaForm.orden_compra_id = oc.id;

    // Proveedor automático
    if (oc.proveedor?.id) {
      this.entradaForm.proveedor_id = oc.proveedor.id;
    }

    // Bodega destino automática
    if (oc.bodega_destino?.id) {
      this.entradaForm.bodega_id = oc.bodega_destino.id;
    }

    // Factura o remisión sugerida
    if (oc.numero_factura_proveedor) {
      this.entradaForm.numero_remision_proveedor = oc.numero_factura_proveedor;
    }

    // Precarga inteligente de líneas pendientes (solo cantidades no recibidas aún)
    if (oc.lineas && oc.lineas.length > 0) {
      const pendientes = oc.lineas.filter((l) => {
        return Number(l.cantidad_solicitada) - Number(l.cantidad_recibida || 0) > 0;
      });

      if (pendientes.length > 0) {
        this.entradaForm.lineas = pendientes.map((l) => ({
          articulo_id: l.articulo?.id || '',
          cantidad: Math.max(1, Number(l.cantidad_solicitada) - Number(l.cantidad_recibida || 0)),
          costo_unitario: Number(l.costo_unitario) || 0,
          porcentaje_iva: Number(l.porcentaje_iva ?? 19),
        }));
      }
    }

    // Proponer observación descriptiva de entrega parcial
    const previas = this.entradas().filter((e: any) => e.orden_compra_id === oc.id);
    const numEntrega = previas.length + 1;
    const resumenItems = this.entradaForm.lineas.map((l: any) => {
      const art = this.obtenerArticulo(l.articulo_id);
      return `${l.cantidad}x ${art ? art.nombre : 'Ítem'}`;
    }).join(', ');

    let textoPropuesto = `Recepción de entrega parcial #${numEntrega} vinculada a la orden ${oc.numero_orden}. Ítems a recibir: ${resumenItems}.`;
    if (previas.length > 0) {
      const listaPrevias = previas.map((p: any) => `${p.numero_entrada} (${p.numero_remision_proveedor ? 'Rem ' + p.numero_remision_proveedor : 'Directa'})`).join(', ');
      textoPropuesto += ` Entregas previas de esta orden: [${listaPrevias}].`;
    }
    this.entradaForm.observaciones = textoPropuesto;

    this.notificationService.success(`Orden ${oc.numero_orden} vinculada. Ítems pendientes precargados exitosamente.`);
  }

  desvincularOrdenCompra(): void {
    this.entradaForm.orden_compra_id = '';
    this.notificationService.info('Orden de compra desvinculada. Recepción física directa activa.');
  }

  cargarTraslados(): void {
    this.inventariosService.listarTraslados().subscribe((data) => this.traslados.set(data));
  }

  abrirModalTraslado(): void {
    const b1 = this.bodegas()[0]?.id || '';
    const b2 = this.bodegas()[1]?.id || this.bodegas()[0]?.id || '';

    this.trasladoForm = {
      bodega_origen_id: b1,
      bodega_destino_id: b2,
      fecha_traslado: new Date().toISOString().slice(0, 10),
      observaciones: '',
      lineas: [
        {
          articulo_id: this.articulos()[0]?.id || '',
          cantidad: 1,
        },
      ],
    };
    this.mostrarModalTraslado.set(true);
  }

  agregarLineaTraslado(): void {
    this.trasladoForm.lineas.push({
      articulo_id: this.articulos()[0]?.id || '',
      cantidad: 1,
    });
  }

  removerLineaTraslado(index: number): void {
    this.trasladoForm.lineas.splice(index, 1);
  }

  guardarTraslado(): void {
    if (this.trasladoForm.bodega_origen_id === this.trasladoForm.bodega_destino_id) {
      this.notificationService.error('La bodega de origen debe ser diferente a la bodega de destino.');
      return;
    }

    this.guardando.set(true);
    this.inventariosService.registrarTraslado(this.trasladoForm).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mostrarModalTraslado.set(false);
        this.notificationService.success(res.mensaje || 'Traslado entre bodegas procesado exitosamente.');
        this.cargarTraslados();
        this.cargarArticulos();
        this.cargarExistencias();
        if (this.pestanaActiva() === 'kardex') this.cargarKardex();
      },
      error: (err) => {
        this.guardando.set(false);
        this.notificationService.error(err.error?.message || 'Error al procesar traslado de inventario.');
      },
    });
  }
}
