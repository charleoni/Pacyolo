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

@Component({
  selector: 'app-articulos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              <span>+ Nueva Nota de Ajuste</span>
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
          <span>📝 Notas de Ajuste</span>
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
                <thead>
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
                  @for (art of articulosFiltrados(); track art.id) {
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
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 2: ENTRADAS DE ALMACÉN                                            -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'entradas') {
        <div class="space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">N° Entrada</th>
                    <th class="p-3.5">Fecha</th>
                    <th class="p-3.5">Proveedor</th>
                    <th class="p-3.5">Bodega Destino</th>
                    <th class="p-3.5">Remisión</th>
                    <th class="p-3.5 text-center">Ítems</th>
                    <th class="p-3.5 text-right">Total Valorado</th>
                    <th class="p-3.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (ent of entradas(); track ent.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-mono font-bold text-white">{{ ent.numero_entrada }}</td>
                      <td class="p-3.5 text-slate-400 font-mono">{{ ent.fecha_entrada }}</td>
                      <td class="p-3.5 font-medium text-white">{{ ent.proveedor?.nombre_completo || 'Proveedor Varios' }}</td>
                      <td class="p-3.5 text-slate-300">{{ ent.bodega?.nombre || 'Bodega Principal' }}</td>
                      <td class="p-3.5 font-mono text-slate-400">{{ ent.numero_remision_proveedor || 'N/A' }}</td>
                      <td class="p-3.5 text-center font-mono">{{ ent.lineas?.length || 0 }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
                        \${{ Number(ent.total_valorado).toLocaleString('es-CO') }}
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {{ ent.estado }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="p-8 text-center text-slate-500">
                        No hay entradas de almacén registradas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 3: KARDEX CONTINUO NIIF                                           -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'kardex') {
        <div class="space-y-4">
          <!-- Filtro de Kardex -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 text-xs">
            <div class="flex-1 min-w-[200px]">
              <label class="block text-slate-400 mb-1">Filtrar por Artículo</label>
              <select
                [(ngModel)]="kardexFiltroArticulo"
                (change)="cargarKardex()"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todos los artículos</option>
                @for (a of articulos(); track a.id) {
                  <option [value]="a.id">[{{ a.codigo }}] {{ a.nombre }}</option>
                }
              </select>
            </div>

            <div class="w-48">
              <label class="block text-slate-400 mb-1">Bodega</label>
              <select
                [(ngModel)]="kardexFiltroBodega"
                (change)="cargarKardex()"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas las bodegas</option>
                @for (b of bodegas(); track b.id) {
                  <option [value]="b.id">{{ b.nombre }}</option>
                }
              </select>
            </div>

            <button
              (click)="cargarKardex()"
              class="self-end px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer"
            >
              🔄 Actualizar
            </button>
          </div>

          <!-- Tabla de Kardex -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
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
                  @for (k of kardexMovimientos(); track k.id) {
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
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 4: NOTAS DE AJUSTE                                                -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'ajustes') {
        <div class="space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                    <th class="p-3.5">N° Nota</th>
                    <th class="p-3.5">Fecha</th>
                    <th class="p-3.5">Bodega</th>
                    <th class="p-3.5">Tipo de Ajuste</th>
                    <th class="p-3.5">Justificación de Auditoría</th>
                    <th class="p-3.5 text-center">Ítems</th>
                    <th class="p-3.5 text-right">Total Valorado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-300">
                  @for (aj of ajustes(); track aj.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="p-3.5 font-mono font-bold text-white">{{ aj.numero_nota }}</td>
                      <td class="p-3.5 text-slate-400 font-mono">{{ aj.fecha_ajuste }}</td>
                      <td class="p-3.5">{{ aj.bodega?.nombre }}</td>
                      <td class="p-3.5">
                        <span
                          [class]="
                            aj.tipo_ajuste === 'SOBRANTE'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : aj.tipo_ajuste === 'FALTANTE_MERMA'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          "
                          class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                        >
                          {{ aj.tipo_ajuste }}
                        </span>
                      </td>
                      <td class="p-3.5 text-slate-300 max-w-xs truncate">{{ aj.justificacion }}</td>
                      <td class="p-3.5 text-center font-mono">{{ aj.lineas?.length || 0 }}</td>
                      <td class="p-3.5 text-right font-mono font-bold text-amber-400">
                        \${{ Number(aj.total_ajuste).toLocaleString('es-CO') }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="p-8 text-center text-slate-500">
                        No hay notas de ajuste registradas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 5: EXISTENCIAS POR BODEGA                                         -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'existencias') {
        <div class="space-y-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
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
                  @for (ex of existencias(); track ex.id) {
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
                        No hay existencias registradas en bodegas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
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
                <label class="block font-semibold text-slate-300 mb-1">Código / SKU *</label>
                <input
                  type="text"
                  [(ngModel)]="articuloForm.codigo"
                  placeholder="Ej: ART-001"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Artículo *</label>
                <select
                  [(ngModel)]="articuloForm.tipo_articulo"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
                <label class="block font-semibold text-slate-300 mb-1">Costo Estimado / Referencia</label>
                <input
                  type="number"
                  [(ngModel)]="articuloForm.costo_promedio"
                  placeholder="0"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
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

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Proveedor *</label>
                <select
                  [(ngModel)]="entradaForm.proveedor_id"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccione proveedor...</option>
                  @for (p of proveedores(); track p.id) {
                    <option [value]="p.id">{{ p.nombre_completo }}</option>
                  }
                </select>
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

            <!-- Líneas de Artículos a Recibir -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Artículos a Recibir</span>
                <button
                  type="button"
                  (click)="agregarLineaEntrada()"
                  class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  + Agregar Fila
                </button>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
                @for (lin of entradaForm.lineas; track $index) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <div class="col-span-6">
                      <select
                        [(ngModel)]="lin.articulo_id"
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
                        [(ngModel)]="lin.cantidad"
                        placeholder="Cant"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-3">
                      <input
                        type="number"
                        [(ngModel)]="lin.costo_unitario"
                        placeholder="Costo Unit."
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
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
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Ajuste *</label>
                <select
                  [(ngModel)]="ajusteForm.tipo_ajuste"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SOBRANTE">📥 SOBRANTE (Aumenta Stock)</option>
                  <option value="FALTANTE_MERMA">📤 FALTANTE / MERMA (Disminuye Stock)</option>
                  <option value="CIERRE_INVENTARIO_FISICO">⚖️ CIERRE POR CONTEO FÍSICO</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Justificación del Ajuste *</label>
                <textarea
                  [(ngModel)]="ajusteForm.justificacion"
                  rows="2"
                  placeholder="Detalle el motivo, acta de conteo físico o causa de la merma..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>
            </div>

            <!-- Líneas de Ajuste -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Artículos a Ajustar</span>
                <button
                  type="button"
                  (click)="agregarLineaAjuste()"
                  class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  + Agregar Fila
                </button>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-3">
                @for (lin of ajusteForm.lineas; track $index) {
                  <div class="grid grid-cols-12 gap-2 items-center text-xs">
                    <div class="col-span-5">
                      <select
                        [(ngModel)]="lin.articulo_id"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                      >
                        <option value="">Seleccione artículo...</option>
                        @for (a of articulos(); track a.id) {
                          <option [value]="a.id">[{{ a.codigo }}] {{ a.nombre }}</option>
                        }
                      </select>
                    </div>

                    <div class="col-span-3">
                      <select
                        [(ngModel)]="lin.tipo_movimiento"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white"
                      >
                        <option value="ENTRADA">📥 Suma</option>
                        <option value="SALIDA">📤 Resta</option>
                      </select>
                    </div>

                    <div class="col-span-3">
                      <input
                        type="number"
                        [(ngModel)]="lin.cantidad"
                        placeholder="Cantidad"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
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
    </div>
  `,
})
export class ArticulosAdminComponent implements OnInit {
  private readonly inventariosService = inject(InventariosService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  // Helper template
  readonly Number = Number;

  // Estado reactivo
  readonly pestanaActiva = signal<'articulos' | 'entradas' | 'kardex' | 'ajustes' | 'existencias'>('articulos');
  readonly articulos = signal<ArticuloItem[]>([]);
  readonly articulosFiltrados = signal<ArticuloItem[]>([]);
  readonly entradas = signal<EntradaAlmacenItem[]>([]);
  readonly kardexMovimientos = signal<KardexMovimientoItem[]>([]);
  readonly ajustes = signal<NotaAjusteItem[]>([]);
  readonly existencias = signal<SaldoBodegaItem[]>([]);

  readonly categorias = signal<ParametroItem[]>([]);
  readonly unidades = signal<ParametroItem[]>([]);
  readonly bodegas = signal<ParametroItem[]>([]);
  readonly proveedores = signal<any[]>([]);

  // Filtros
  busquedaArticulo = '';
  filtroTipoArticulo = '';
  kardexFiltroArticulo = '';
  kardexFiltroBodega = '';

  // Modales
  readonly mostrarModalArticulo = signal(false);
  readonly mostrarModalEntrada = signal(false);
  readonly mostrarModalAjuste = signal(false);
  readonly guardando = signal(false);
  readonly articuloEnEdicion = signal<ArticuloItem | null>(null);

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
    proveedor_id: '',
    bodega_id: '',
    numero_remision_proveedor: '',
    fecha_entrada: new Date().toISOString().slice(0, 10),
    lineas: [{ articulo_id: '', cantidad: 1, costo_unitario: 0 }],
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

    // Cargar catálogos
    this.parametrosService.obtenerCategoriasArticulos().subscribe((cats: ParametroItem[]) => this.categorias.set(cats));
    this.parametrosService.obtenerUnidadesMedida().subscribe((uns: ParametroItem[]) => this.unidades.set(uns));
    this.parametrosService.obtenerBodegas().subscribe((bods: ParametroItem[]) => this.bodegas.set(bods));

    // Cargar proveedores desde Terceros
    this.http.get<any[]>('http://localhost:3000/api/v1/terceros').subscribe((terceros) => {
      this.proveedores.set(terceros);
    });
  }

  cargarArticulos(): void {
    this.inventariosService.listarArticulos().subscribe((arts) => {
      this.articulos.set(arts);
      this.filtrarArticulos();
    });
  }

  filtrarArticulos(): void {
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
    this.articuloForm = { ...art };
    this.mostrarModalArticulo.set(true);
  }

  guardarArticulo(): void {
    this.guardando.set(true);
    const edicion = this.articuloEnEdicion();

    if (edicion) {
      this.inventariosService.actualizarArticulo(edicion.id, this.articuloForm).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalArticulo.set(false);
          this.cargarArticulos();
        },
        error: (err) => {
          this.guardando.set(false);
          alert(err.error?.message || 'Error al actualizar artículo');
        },
      });
    } else {
      this.inventariosService.crearArticulo(this.articuloForm).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModalArticulo.set(false);
          this.cargarArticulos();
        },
        error: (err) => {
          this.guardando.set(false);
          alert(err.error?.message || 'Error al crear artículo');
        },
      });
    }
  }

  cambiarEstadoArticulo(art: ArticuloItem): void {
    this.inventariosService.cambiarEstadoArticulo(art.id, !art.activo).subscribe(() => {
      this.cargarArticulos();
    });
  }

  abrirModalEntrada(): void {
    this.entradaForm = {
      proveedor_id: this.proveedores()[0]?.id || '',
      bodega_id: this.bodegas()[0]?.id || '',
      numero_remision_proveedor: '',
      fecha_entrada: new Date().toISOString().slice(0, 10),
      lineas: [{ articulo_id: this.articulos()[0]?.id || '', cantidad: 10, costo_unitario: 0 }],
    };
    this.mostrarModalEntrada.set(true);
  }

  agregarLineaEntrada(): void {
    this.entradaForm.lineas.push({
      articulo_id: this.articulos()[0]?.id || '',
      cantidad: 1,
      costo_unitario: 0,
    });
  }

  removerLineaEntrada(index: number): void {
    this.entradaForm.lineas.splice(index, 1);
  }

  guardarEntrada(): void {
    this.guardando.set(true);
    this.inventariosService.registrarEntrada(this.entradaForm).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalEntrada.set(false);
        this.cargarEntradas();
        this.cargarArticulos();
        if (this.pestanaActiva() === 'kardex') this.cargarKardex();
      },
      error: (err) => {
        this.guardando.set(false);
        alert(err.error?.message || 'Error al registrar entrada de almacén');
      },
    });
  }

  abrirModalAjuste(): void {
    this.ajusteForm = {
      bodega_id: this.bodegas()[0]?.id || '',
      tipo_ajuste: 'SOBRANTE',
      fecha_ajuste: new Date().toISOString().slice(0, 10),
      justificacion: '',
      lineas: [{ articulo_id: this.articulos()[0]?.id || '', tipo_movimiento: 'ENTRADA', cantidad: 1 }],
    };
    this.mostrarModalAjuste.set(true);
  }

  agregarLineaAjuste(): void {
    this.ajusteForm.lineas.push({
      articulo_id: this.articulos()[0]?.id || '',
      tipo_movimiento: 'ENTRADA',
      cantidad: 1,
    });
  }

  removerLineaAjuste(index: number): void {
    this.ajusteForm.lineas.splice(index, 1);
  }

  guardarAjuste(): void {
    this.guardando.set(true);
    this.inventariosService.registrarAjuste(this.ajusteForm).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalAjuste.set(false);
        this.cargarAjustes();
        this.cargarArticulos();
        if (this.pestanaActiva() === 'kardex') this.cargarKardex();
      },
      error: (err) => {
        this.guardando.set(false);
        alert(err.error?.message || 'Error al registrar nota de ajuste');
      },
    });
  }
}
