import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComprasService, OrdenCompraItem } from '../../../core/services/compras.service';
import { InventariosService, ArticuloItem } from '../../../core/services/inventarios.service';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TerceroLookupModalComponent, TerceroItem } from '../../../shared/components/tercero-lookup-modal.component';
import { ArticuloLookupModalComponent, ArticuloLookupItem } from '../../../shared/components/articulo-lookup-modal.component';
import { TablePaginationComponent } from '../../../shared/components/table-pagination.component';

@Component({
  selector: 'app-compras-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TerceroLookupModalComponent, ArticuloLookupModalComponent, TablePaginationComponent],
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
            Gestión documental de compras, condición comercial (crédito/contado), recepción física y causación formal en Cuentas por Pagar.
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
            placeholder="Buscar por número de orden, proveedor o factura..."
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
            <thead class="sticky top-0 z-10 bg-slate-950">
              <tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th class="p-3.5">N° Orden / Factura</th>
                <th class="p-3.5">Fecha Compra</th>
                <th class="p-3.5">Proveedor</th>
                <th class="p-3.5">Condición de Pago</th>
                <th class="p-3.5">Bodega Destino</th>
                <th class="p-3.5 text-center">Ítems</th>
                <th class="p-3.5 text-right">Subtotal</th>
                <th class="p-3.5 text-right">Total</th>
                <th class="p-3.5 text-center">Estado Operativo</th>
                <th class="p-3.5 text-center">Causación CxP</th>
                <th class="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              @for (orden of ordenesPaginadas(); track orden.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="p-3.5 font-mono">
                    <span class="font-bold text-white block">{{ orden.numero_orden }}</span>
                    @if (orden.numero_factura_proveedor) {
                      <span class="text-[10px] text-slate-400">Fac: {{ orden.numero_factura_proveedor }}</span>
                    }
                  </td>
                  <td class="p-3.5 text-slate-300 font-mono">
                    <span>{{ orden.fecha_emision }}</span>
                    @if (orden.fecha_entrega_esperada) {
                      <span class="block text-[10px] text-slate-500">Esp: {{ orden.fecha_entrega_esperada }}</span>
                    }
                  </td>
                  <td class="p-3.5">
                    <span class="font-medium text-white block">{{ orden.proveedor?.nombre_completo || 'Proveedor Varios' }}</span>
                    @if (orden.proveedor?.numero_identificacion) {
                      <span class="text-[10px] text-slate-500 font-mono">NIT: {{ orden.proveedor?.numero_identificacion }}</span>
                    }
                  </td>
                  <td class="p-3.5">
                    @if (orden.condicion_pago === 'CONTADO') {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span>💵</span> CONTADO
                      </span>
                    } @else {
                      <div class="inline-block">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <span>📅</span> CRÉDITO ({{ orden.dias_credito || 30 }}d)
                        </span>
                        @if (orden.fecha_vencimiento) {
                          <span class="block text-[10px] text-slate-400 mt-0.5 font-mono">Vence: {{ orden.fecha_vencimiento }}</span>
                        }
                      </div>
                    }
                  </td>
                  <td class="p-3.5 text-slate-300">{{ orden.bodega_destino?.nombre || 'Bodega Principal' }}</td>
                  <td class="p-3.5 text-center font-mono">{{ orden.lineas?.length || 0 }}</td>
                  <td class="p-3.5 text-right font-mono text-slate-300">
                    \${{ Number(orden.subtotal).toLocaleString('es-CO') }}
                  </td>
                  <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
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
                  <td class="p-3.5 text-center">
                    @if (orden.asiento_id || orden.cxp_id) {
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span>✓</span> Causada CxP
                      </span>
                    } @else {
                      <button
                        (click)="abrirModalCausar(orden)"
                        class="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                        title="Causar formalmente en Cuentas por Pagar"
                      >
                        <span>💳</span> Causar en CxP
                      </button>
                    }
                  </td>
                  <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                    <button
                      (click)="abrirModalImprimir(orden)"
                      class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                      title="Imprimir / Exportar Orden de Compra para enviar al proveedor"
                    >
                      <span>🖨️</span>
                      <span>Imprimir</span>
                    </button>
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
                  <td colspan="11" class="p-8 text-center text-slate-500">
                    No se encontraron órdenes de compra registradas.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-table-pagination
          [totalItems]="ordenesFiltradas().length"
          [currentPage]="paginaOrdenes()"
          [pageSize]="tamanoOrdenes()"
          (pageChange)="paginaOrdenes.set($event)"
          (pageSizeChange)="tamanoOrdenes.set($event); paginaOrdenes.set(1)"
        />
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
                <span>Registrar Nueva Orden de Compra</span>
              </h3>
              <button (click)="mostrarModal.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <!-- Fila 1: Fechas y Proveedor -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Fecha de Compra / Emisión *</label>
                <input
                  type="date"
                  [(ngModel)]="nuevaOrden.fecha_emision"
                  (change)="recalcularVencimiento()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Proveedor *</label>
                @if (proveedorSeleccionado(); as prov) {
                  <div class="flex items-center justify-between p-2 bg-slate-950 border border-indigo-500/50 rounded-xl">
                    <div class="flex items-center gap-2 text-xs truncate">
                      <span class="font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                        {{ prov.numero_identificacion }}{{ prov.digito_verificacion ? '-' + prov.digito_verificacion : '' }}
                      </span>
                      <span class="font-semibold text-white truncate">
                        {{ prov.razon_social || prov.nombre_completo }}
                      </span>
                      @if (prov.ciudad) {
                        <span class="text-slate-500 text-[11px]">({{ prov.ciudad }})</span>
                      }
                    </div>
                    <button
                      type="button"
                      (click)="abrirLookupProveedor()"
                      class="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ml-2"
                    >
                      Cambiar 🔍
                    </button>
                  </div>
                } @else {
                  <button
                    type="button"
                    (click)="abrirLookupProveedor()"
                    class="w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 rounded-xl text-xs transition cursor-pointer group"
                  >
                    <span class="flex items-center gap-2">
                      <span class="text-indigo-400 text-sm">🔍</span>
                      <span>Haga clic para buscar y seleccionar proveedor (NIT o Razón Social)...</span>
                    </span>
                    <span class="bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-0.5 rounded text-[11px] font-bold transition">
                      Buscar en Catálogo
                    </span>
                  </button>
                }
              </div>
            </div>

            <!-- Fila 2: Condición Comercial (Crédito vs Contado) -->
            <div class="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Condición de Pago & Términos Comerciales</label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="seleccionarCondicionPago('CREDITO')"
                    [class]="nuevaOrden.condicion_pago === 'CREDITO' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    class="px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                  >
                    📅 A Crédito
                  </button>
                  <button
                    type="button"
                    (click)="seleccionarCondicionPago('CONTADO')"
                    [class]="nuevaOrden.condicion_pago === 'CONTADO' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'"
                    class="px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                  >
                    💵 De Contado
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                @if (nuevaOrden.condicion_pago === 'CREDITO') {
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Plazo de Pago (Días)</label>
                    <select
                      [(ngModel)]="nuevaOrden.dias_credito"
                      (change)="recalcularVencimiento()"
                      class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option [value]="15">15 Días</option>
                      <option [value]="30">30 Días (Estándar)</option>
                      <option [value]="45">45 Días</option>
                      <option [value]="60">60 Días</option>
                      <option [value]="90">90 Días</option>
                    </select>
                  </div>

                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Fecha de Vencimiento Estimada</label>
                    <input
                      type="date"
                      [(ngModel)]="nuevaOrden.fecha_vencimiento"
                      class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                } @else {
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Método de Pago Sugerido</label>
                    <select
                      [(ngModel)]="nuevaOrden.metodo_pago"
                      class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                      <option value="EFECTIVO">Efectivo / Caja Menor</option>
                      <option value="TARJETA">Tarjeta Débito / Crédito</option>
                      <option value="CHEQUE">Cheque de Gerencia</option>
                    </select>
                  </div>
                }

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">N° Factura del Proveedor (Opcional)</label>
                  <input
                    type="text"
                    [(ngModel)]="nuevaOrden.numero_factura_proveedor"
                    placeholder="Ej: FAC-84920"
                    class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- Fila 3: Bodega y Fecha de Entrega -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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

              <div class="sm:col-span-2">
                <label class="block font-semibold text-slate-300 mb-1">Observaciones / Notas Adicionales</label>
                <input
                  type="text"
                  [(ngModel)]="nuevaOrden.observaciones"
                  placeholder="Ej: Pedido de reposición mensual, flete por cuenta del proveedor..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Líneas de Artículos de la Orden -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Líneas de la Orden</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="abrirCatalogoMultiple()"
                    class="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    title="Buscar y agregar varios artículos a la vez"
                  >
                    <span>📦</span>
                    <span>Buscar Catálogo (Múltiples)</span>
                  </button>
                  <button
                    type="button"
                    (click)="agregarLinea()"
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    + Agregar Fila
                  </button>
                </div>
              </div>

              <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-2">
                <div class="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 px-1">
                  <div class="col-span-5">Artículo *</div>
                  <div class="col-span-2 text-right">Cantidad *</div>
                  <div class="col-span-2 text-right">Costo Unit. *</div>
                  <div class="col-span-2 text-center">IVA %</div>
                  <div class="col-span-1 text-center">Acción</div>
                </div>
                @for (lin of nuevaOrden.lineas; track $index) {
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
                            (click)="abrirLookupArticuloParaLinea($index)"
                            class="text-[11px] text-slate-400 hover:text-emerald-300 font-semibold ml-1 cursor-pointer shrink-0"
                            title="Cambiar artículo"
                          >
                            🔍
                          </button>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="abrirLookupArticuloParaLinea($index)"
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
                        [(ngModel)]="lin.cantidad_solicitada"
                        placeholder="Cant"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        [(ngModel)]="lin.costo_unitario"
                        placeholder="Costo"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-right"
                      />
                    </div>

                    <div class="col-span-2">
                      <select
                        [(ngModel)]="lin.porcentaje_iva"
                        class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-center text-xs"
                      >
                        <option [value]="0">0% Exento</option>
                        <option [value]="5">5% Reducido</option>
                        <option [value]="19">19% General</option>
                      </select>
                    </div>

                    <div class="col-span-1 text-center">
                      <button
                        type="button"
                        (click)="removerLinea($index)"
                        [disabled]="nuevaOrden.lineas.length === 1"
                        class="text-rose-500 hover:text-rose-400 p-1 rounded transition cursor-pointer disabled:opacity-30"
                        title="Eliminar fila"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Resumen de Totales -->
            <div class="flex justify-end pt-2">
              <div class="w-64 bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 text-xs">
                <div class="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span class="font-mono text-slate-200">\${{ calcularSubtotal().toLocaleString('es-CO') }}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Impuestos (IVA):</span>
                  <span class="font-mono text-slate-200">\${{ calcularImpuestos().toLocaleString('es-CO') }}</span>
                </div>
                <div class="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800">
                  <span>Total Orden:</span>
                  <span class="font-mono text-indigo-400">\${{ calcularTotal().toLocaleString('es-CO') }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="mostrarModal.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="guardarOrden()"
                [disabled]="guardando() || !nuevaOrden.proveedor_id || nuevaOrden.lineas.length === 0"
                class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                @if (guardando()) {
                  <span>Guardando orden...</span>
                } @else {
                  <span>Confirmar y Guardar Orden</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL: CAUSAR ORDEN EN CUENTAS POR PAGAR (CxP / NIIF)                    -->
      <!-- ========================================================================= -->
      @if (mostrarModalCausar(); as orden) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>💳</span>
                <span>Causar Orden en Cuentas por Pagar (CxP)</span>
              </h3>
              <button (click)="mostrarModalCausar.set(false)" class="text-slate-500 hover:text-white cursor-pointer text-sm">✕</button>
            </div>

            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400">Orden de Compra:</span>
                <span class="font-bold text-white font-mono">{{ ordenParaCausar()?.numero_orden }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Proveedor:</span>
                <span class="text-slate-200">{{ ordenParaCausar()?.proveedor?.nombre_completo }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Condición de Pago:</span>
                <span class="text-indigo-400 font-semibold">{{ ordenParaCausar()?.condicion_pago }} ({{ ordenParaCausar()?.dias_credito || 30 }} días)</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-slate-800 font-bold">
                <span class="text-slate-300">Total a Causar:</span>
                <span class="text-emerald-400 font-mono text-sm">\${{ Number(ordenParaCausar()?.total || 0).toLocaleString('es-CO') }}</span>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">N° de Factura Oficial del Proveedor *</label>
                <input
                  type="text"
                  [(ngModel)]="datosCausacion.numero_factura_proveedor"
                  placeholder="Ej: FE-99238"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Fecha de la Factura *</label>
                <input
                  type="date"
                  [(ngModel)]="datosCausacion.fecha_factura"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Plantilla de Causación Contable NIIF</label>
                <select
                  [(ngModel)]="datosCausacion.codigo_concepto"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="COMPRA_INVENTARIO">Compra de Mercancías e Inventarios (Activo 1435 <-> Pasivo 2205)</option>
                  <option value="COMPRA_SERVICIOS">Compra de Servicios Generales (Gasto 51/52 <-> Pasivo 2335)</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Detalle / Glosa Contable</label>
                <input
                  type="text"
                  [(ngModel)]="datosCausacion.glosa"
                  placeholder="Detalle para el libro diario..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="mostrarModalCausar.set(false)"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="confirmarCausacion()"
                [disabled]="guardando() || !datosCausacion.numero_factura_proveedor"
                class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                @if (guardando()) {
                  <span>Generando asiento CAU...</span>
                } @else {
                  <span>Confirmar Causación NIIF</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL: VISTA PREVIA E IMPRESIÓN FORMAL DE ORDEN DE COMPRA                -->
      <!-- ========================================================================= -->
      @if (mostrarModalImprimir(); as orden) {
        <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex justify-center items-start p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0" (click)="mostrarModalImprimir.set(null)">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-4 sm:my-8 overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white relative" (click)="$event.stopPropagation()">
            <!-- Barra de Herramientas Superior (fijada arriba para nunca perderse) -->
            <div class="sticky top-0 z-30 px-6 py-3.5 bg-slate-950/95 backdrop-blur border-b border-slate-800 flex items-center justify-between print:hidden shadow-md">
              <div class="flex items-center gap-2 text-white font-bold text-sm">
                <span>🖨️</span>
                <span>Vista Previa de Documento Oficial — {{ orden.numero_orden }}</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="imprimirDocumento()"
                  class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <span>🖨️ Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  (click)="mostrarModalImprimir.set(null)"
                  class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- CONTENIDO MEMBRETADO DEL DOCUMENTO (Se imprime en blanco y negro / papel membretado) -->
            <div class="flex-1 overflow-y-auto p-8 bg-white text-slate-900 space-y-6 print:p-6 print:overflow-visible font-sans">
              <!-- Encabezado Membretado -->
              <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div class="space-y-1">
                  <div class="text-xl font-black text-slate-950 tracking-tight uppercase">
                    {{ empresaActiva()?.razon_social || 'PACYOLO CORE LEDGER S.A.S.' }}
                  </div>
                  <div class="text-xs text-slate-600 font-mono font-bold">
                    NIT: {{ empresaActiva()?.nit || '901.849.201-4' }} • Régimen Común / Responsable de IVA
                  </div>
                  <div class="text-xs text-slate-500">
                    Sistema Contable & ERP Multi-Tenant NIIF Universal
                  </div>
                </div>

                <div class="text-right space-y-1">
                  <div class="inline-block bg-slate-950 text-white font-black text-sm px-3 py-1 rounded">
                    ORDEN DE COMPRA
                  </div>
                  <div class="text-lg font-mono font-bold text-slate-900">
                    {{ orden.numero_orden }}
                  </div>
                  <div class="text-xs text-slate-500 font-medium">
                    Estado: <span class="font-bold uppercase text-slate-800">{{ orden.estado }}</span>
                  </div>
                </div>
              </div>

              <!-- Bloque 2 Columnas: Datos Proveedor y Condiciones -->
              <div class="grid grid-cols-2 gap-6 text-xs">
                <!-- Columna Izquierda: Proveedor -->
                <div class="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50/50">
                  <div class="font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                    DATOS DEL PROVEEDOR
                  </div>
                  <div class="font-bold text-slate-900 text-sm">
                    {{ orden.proveedor?.razon_social || orden.proveedor?.nombre_completo || 'Proveedor General' }}
                  </div>
                  <div class="text-slate-600 font-mono">
                    <span class="font-semibold">NIT / Cédula:</span> {{ orden.proveedor?.numero_identificacion || 'No especificado' }}
                  </div>
                  <div class="text-slate-600">
                    <span class="font-semibold">Ciudad / Dirección:</span> {{ orden.proveedor?.ciudad || 'Colombia' }}
                  </div>
                  <div class="text-slate-600">
                    <span class="font-semibold">Contacto / Tel:</span> {{ orden.proveedor?.telefono || orden.proveedor?.email || 'N/A' }}
                  </div>
                </div>

                <!-- Columna Derecha: Condiciones Comerciales -->
                <div class="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50/50">
                  <div class="font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                    TÉRMINOS Y CONDICIONES COMERCIALES
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600 font-medium">Fecha Emisión:</span>
                    <span class="font-bold font-mono text-slate-900">{{ orden.fecha_emision }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600 font-medium">Fecha Entrega Esperada:</span>
                    <span class="font-bold font-mono text-slate-900">{{ orden.fecha_entrega_esperada || 'Inmediata' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600 font-medium">Condición de Pago:</span>
                    <span class="font-bold text-slate-900">
                      {{ orden.condicion_pago }}
                      @if (orden.condicion_pago === 'CREDITO') {
                        ({{ orden.dias_credito || 30 }} días - Vence: {{ orden.fecha_vencimiento }})
                      }
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600 font-medium">Bodega de Destino:</span>
                    <span class="font-bold text-slate-900">{{ orden.bodega_destino?.nombre || 'Bodega Principal' }}</span>
                  </div>
                  @if (orden.numero_factura_proveedor) {
                    <div class="flex justify-between">
                      <span class="text-slate-600 font-medium">N° Factura Proveedor:</span>
                      <span class="font-mono font-bold text-slate-900">{{ orden.numero_factura_proveedor }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Tabla de Ítems / Productos -->
              <div>
                <table class="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th class="p-2 border-r border-slate-300 w-8 text-center">#</th>
                      <th class="p-2 border-r border-slate-300 w-24">Código SKU</th>
                      <th class="p-2 border-r border-slate-300">Descripción del Artículo</th>
                      <th class="p-2 border-r border-slate-300 text-right w-16">Cant. Sol.</th>
                      <th class="p-2 border-r border-slate-300 text-right w-16">Cant. Rec.</th>
                      <th class="p-2 border-r border-slate-300 text-right w-24">Costo Unit.</th>
                      <th class="p-2 border-r border-slate-300 text-center w-14">IVA %</th>
                      <th class="p-2 text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    @for (lin of orden.lineas; track lin.id || $index) {
                      <tr>
                        <td class="p-2 border-r border-slate-200 text-center text-slate-500 font-mono">{{ $index + 1 }}</td>
                        <td class="p-2 border-r border-slate-200 font-mono font-bold text-slate-800">{{ lin.articulo?.codigo || 'N/A' }}</td>
                        <td class="p-2 border-r border-slate-200 font-medium text-slate-900">{{ lin.articulo?.nombre || 'Artículo sin nombre' }}</td>
                        <td class="p-2 border-r border-slate-200 text-right font-mono font-bold">{{ Number(lin.cantidad_solicitada).toLocaleString('es-CO') }}</td>
                        <td class="p-2 border-r border-slate-200 text-right font-mono text-slate-600">{{ Number(lin.cantidad_recibida || 0).toLocaleString('es-CO') }}</td>
                        <td class="p-2 border-r border-slate-200 text-right font-mono">\${{ Number(lin.costo_unitario).toLocaleString('es-CO') }}</td>
                        <td class="p-2 border-r border-slate-200 text-center font-mono">{{ Number(lin.porcentaje_iva || 19) }}%</td>
                        <td class="p-2 text-right font-mono font-bold text-slate-900">\${{ Number(lin.subtotal).toLocaleString('es-CO') }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Resumen Financiero y Observaciones -->
              <div class="grid grid-cols-2 gap-6 items-start pt-2">
                <div class="border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                  <div class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Observaciones Comerciales</div>
                  <p class="text-slate-600 italic">
                    {{ orden.observaciones || 'No se registraron observaciones adicionales para este pedido.' }}
                  </p>
                </div>

                <div class="border border-slate-300 rounded-lg p-3.5 space-y-1.5 bg-slate-50 text-xs">
                  <div class="flex justify-between text-slate-600">
                    <span>Subtotal Mercancías:</span>
                    <span class="font-mono font-bold text-slate-900">\${{ Number(orden.subtotal || 0).toLocaleString('es-CO') }}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>Impuestos (IVA):</span>
                    <span class="font-mono font-bold text-slate-900">\${{ Number(orden.total_impuestos || 0).toLocaleString('es-CO') }}</span>
                  </div>
                  <div class="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-300">
                    <span>VALOR TOTAL ORDEN:</span>
                    <span class="font-mono text-indigo-700">\${{ Number(orden.total || 0).toLocaleString('es-CO') }}</span>
                  </div>
                </div>
              </div>

              <!-- Historial de Recepciones Físicas (Entregas Parciales y Facturación) -->
              @if (orden.entradas && orden.entradas.length > 0) {
                <div class="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div class="bg-slate-100 p-2.5 font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-300 text-[11px]">
                    <span class="flex items-center gap-1.5">
                      <span>📥</span>
                      <span>Historial de Recepciones Físicas (Entregas Parciales & Facturación)</span>
                    </span>
                    <span class="font-mono text-indigo-700 font-bold">
                      {{ orden.entradas.length }} entrega(s) registrada(s)
                    </span>
                  </div>
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th class="p-2 border-r border-slate-200">Entrega</th>
                        <th class="p-2 border-r border-slate-200">Fecha</th>
                        <th class="p-2 border-r border-slate-200">Doc. Soporte</th>
                        <th class="p-2 border-r border-slate-200">Ítems Recibidos</th>
                        <th class="p-2 border-r border-slate-200 text-right">Subtotal</th>
                        <th class="p-2 border-r border-slate-200 text-right">IVA</th>
                        <th class="p-2 border-r border-slate-200 text-right">Total con IVA</th>
                        <th class="p-2 text-center">Estado CxP</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[11px]">
                      @for (e of orden.entradas; track e.id) {
                        <tr>
                          <td class="p-2 border-r border-slate-200 font-bold text-slate-900">
                            {{ e.numero_entrada }} (Entr #{{ e.numero_entrega || ($index + 1) }})
                          </td>
                          <td class="p-2 border-r border-slate-200 text-slate-600">{{ e.fecha_entrada }}</td>
                          <td class="p-2 border-r border-slate-200 text-slate-700">
                            {{ e.numero_remision_proveedor ? 'Rem: ' + e.numero_remision_proveedor : (e.numero_factura_proveedor ? 'Fac: ' + e.numero_factura_proveedor : 'Directa') }}
                          </td>
                          <td class="p-2 border-r border-slate-200 font-sans text-slate-800">
                            @for (l of e.lineas; track l.id) {
                              <div>{{ Number(l.cantidad).toLocaleString('es-CO') }}x {{ l.articulo?.nombre || 'Ítem' }}</div>
                            }
                          </td>
                          <td class="p-2 border-r border-slate-200 text-right font-bold">\${{ Number(e.subtotal || e.total_valorado || 0).toLocaleString('es-CO') }}</td>
                          <td class="p-2 border-r border-slate-200 text-right text-slate-600">\${{ Number(e.total_iva || 0).toLocaleString('es-CO') }}</td>
                          <td class="p-2 border-r border-slate-200 text-right font-bold text-indigo-700">\${{ Number(e.total_con_iva || e.total_valorado || 0).toLocaleString('es-CO') }}</td>
                          <td class="p-2 text-center">
                            @if (e.cxp_id || e.numero_factura_proveedor) {
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                💳 Factura: {{ e.numero_factura_proveedor || 'Causada' }}
                              </span>
                            } @else {
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                📦 Remisión (Pendiente CxP)
                              </span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Firmas y Aprobaciones Formales -->
              <div class="grid grid-cols-3 gap-6 pt-8 text-center text-xs text-slate-700">
                <div class="border-t border-slate-400 pt-2">
                  <div class="font-bold">Elaborado Por</div>
                  <div class="text-[11px] text-slate-500 font-mono">{{ usuario()?.nombres }} {{ usuario()?.apellidos }}</div>
                </div>
                <div class="border-t border-slate-400 pt-2">
                  <div class="font-bold">Aprobado / Gerencia</div>
                  <div class="text-[11px] text-slate-500">Firma Autorizada</div>
                </div>
                <div class="border-t border-slate-400 pt-2">
                  <div class="font-bold">Recibido por Proveedor</div>
                  <div class="text-[11px] text-slate-500">Firma y Sello</div>
                </div>
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
    </div>
  `,
})
export class ComprasAdminComponent implements OnInit {
  private readonly comprasService = inject(ComprasService);
  private readonly inventariosService = inject(InventariosService);
  private readonly parametrosService = inject(ParametrosService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly http = inject(HttpClient);

  readonly Number = Number;

  readonly ordenes = signal<OrdenCompraItem[]>([]);
  readonly articulos = signal<ArticuloItem[]>([]);
  readonly bodegas = signal<ParametroItem[]>([]);
  readonly proveedores = signal<any[]>([]);

  busquedaOrden = '';
  filtroEstado = '';

  // Paginación Reactiva
  readonly paginaOrdenes = signal(1);
  readonly tamanoOrdenes = signal(25);
  ordenesPaginadas(): OrdenCompraItem[] {
    const p = this.paginaOrdenes();
    const s = this.tamanoOrdenes();
    return this.ordenesFiltradas().slice((p - 1) * s, p * s);
  }

  readonly mostrarModal = signal(false);
  readonly mostrarModalCausar = signal(false);
  readonly mostrarModalImprimir = signal<OrdenCompraItem | null>(null);
  readonly guardando = signal(false);
  readonly ordenParaCausar = signal<OrdenCompraItem | null>(null);

  readonly empresaActiva = this.authService.empresaActiva;
  readonly usuario = this.authService.usuario;

  // Estados de Modales Lookup
  readonly mostrarLookupProveedor = signal(false);
  readonly mostrarLookupArticulo = signal(false);
  readonly lineaSeleccionandoArticulo = signal<number | null>(null);
  readonly modoLookupArticulo = signal<'INDIVIDUAL' | 'MULTIPLE'>('INDIVIDUAL');

  nuevaOrden: any = {
    proveedor_id: '',
    bodega_destino_id: '',
    fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_entrega_esperada: '',
    condicion_pago: 'CREDITO',
    dias_credito: 30,
    fecha_vencimiento: '',
    metodo_pago: 'TRANSFERENCIA',
    numero_factura_proveedor: '',
    observaciones: '',
    lineas: [{ articulo_id: '', cantidad_solicitada: 10, costo_unitario: 0, porcentaje_iva: 19 }],
  };

  datosCausacion = {
    numero_factura_proveedor: '',
    fecha_factura: new Date().toISOString().slice(0, 10),
    codigo_concepto: 'COMPRA_INVENTARIO',
    glosa: '',
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const emp = this.authService.empresaActiva();
    const provUrl = emp
      ? `http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`
      : 'http://localhost:3000/api/v1/terceros';

    this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
    this.inventariosService.listarArticulos().subscribe((arts) => this.articulos.set(arts));
    this.parametrosService.obtenerBodegas().subscribe((bods: ParametroItem[]) => this.bodegas.set(bods));
    this.http.get<any[]>(provUrl).subscribe({
      next: (ts) => this.proveedores.set(ts),
      error: (err) => console.error('Error cargando proveedores:', err),
    });
  }

  ordenesFiltradas(): OrdenCompraItem[] {
    const q = this.busquedaOrden.toLowerCase().trim();
    const est = this.filtroEstado;

    return this.ordenes().filter((o) => {
      const matchQ =
        !q ||
        o.numero_orden.toLowerCase().includes(q) ||
        (o.numero_factura_proveedor && o.numero_factura_proveedor.toLowerCase().includes(q)) ||
        (o.proveedor?.nombre_completo && o.proveedor.nombre_completo.toLowerCase().includes(q)) ||
        (o.proveedor?.numero_identificacion && o.proveedor.numero_identificacion.includes(q));
      const matchEst = !est || o.estado === est;
      return matchQ && matchEst;
    });
  }

  seleccionarCondicionPago(condicion: 'CREDITO' | 'CONTADO'): void {
    this.nuevaOrden.condicion_pago = condicion;
    this.recalcularVencimiento();
  }

  recalcularVencimiento(): void {
    if (this.nuevaOrden.condicion_pago === 'CONTADO') {
      this.nuevaOrden.dias_credito = 0;
      this.nuevaOrden.fecha_vencimiento = this.nuevaOrden.fecha_emision;
    } else {
      const dias = Number(this.nuevaOrden.dias_credito) || 30;
      const f = new Date(this.nuevaOrden.fecha_emision || Date.now());
      f.setDate(f.getDate() + dias);
      this.nuevaOrden.fecha_vencimiento = f.toISOString().slice(0, 10);
    }
  }

  proveedorSeleccionado(): any {
    return this.proveedores().find((p) => p.id === this.nuevaOrden.proveedor_id);
  }

  obtenerArticulo(id: string): any {
    return this.articulos().find((a) => a.id === id);
  }

  abrirLookupProveedor(): void {
    this.mostrarLookupProveedor.set(true);
  }

  alSeleccionarProveedorLookup(tercero: any): void {
    this.nuevaOrden.proveedor_id = tercero.id;
  }

  abrirLookupArticuloParaLinea(index: number): void {
    this.lineaSeleccionandoArticulo.set(index);
    this.modoLookupArticulo.set('INDIVIDUAL');
    this.mostrarLookupArticulo.set(true);
  }

  abrirCatalogoMultiple(): void {
    this.modoLookupArticulo.set('MULTIPLE');
    this.mostrarLookupArticulo.set(true);
  }

  alSeleccionarArticuloIndividual(art: any): void {
    const idx = this.lineaSeleccionandoArticulo();
    if (idx !== null && this.nuevaOrden.lineas[idx]) {
      this.nuevaOrden.lineas[idx].articulo_id = art.id;
      this.nuevaOrden.lineas[idx].costo_unitario = Number(art.costo_promedio || 0);
      this.nuevaOrden.lineas[idx].porcentaje_iva = Number(art.tarifa_iva ?? 19);
    }
  }

  alSeleccionarArticulosMultiples(articulosSeleccionados: any[]): void {
    if (!articulosSeleccionados || articulosSeleccionados.length === 0) return;

    if (
      this.nuevaOrden.lineas.length === 1 &&
      (!this.nuevaOrden.lineas[0].articulo_id || this.nuevaOrden.lineas[0].articulo_id === '')
    ) {
      this.nuevaOrden.lineas = [];
    }

    for (const art of articulosSeleccionados) {
      const yaExiste = this.nuevaOrden.lineas.some((l: any) => l.articulo_id === art.id);
      if (!yaExiste) {
        this.nuevaOrden.lineas.push({
          articulo_id: art.id,
          cantidad_solicitada: 1,
          costo_unitario: Number(art.costo_promedio || 0),
          porcentaje_iva: Number(art.tarifa_iva ?? 19),
        });
      }
    }

    if (this.nuevaOrden.lineas.length === 0) {
      this.agregarLinea();
    }
  }

  abrirModalNuevaOrden(): void {
    const hoy = new Date().toISOString().slice(0, 10);
    const venc = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const primerArticulo = this.articulos()[0];

    this.nuevaOrden = {
      proveedor_id: this.proveedores()[0]?.id || '',
      bodega_destino_id: this.bodegas()[0]?.id || '',
      fecha_emision: hoy,
      fecha_entrega_esperada: '',
      condicion_pago: 'CREDITO',
      dias_credito: 30,
      fecha_vencimiento: venc,
      metodo_pago: 'TRANSFERENCIA',
      numero_factura_proveedor: '',
      observaciones: '',
      lineas: [
        {
          articulo_id: primerArticulo?.id || '',
          cantidad_solicitada: 10,
          costo_unitario: Number(primerArticulo?.costo_promedio || 0),
          porcentaje_iva: Number(primerArticulo?.tarifa_iva ?? 19),
        },
      ],
    };
    this.mostrarModal.set(true);
  }

  alSeleccionarArticulo(lin: any): void {
    const art = this.articulos().find((a) => a.id === lin.articulo_id);
    if (art) {
      lin.costo_unitario = Number(art.costo_promedio || 0);
      lin.porcentaje_iva = Number(art.tarifa_iva ?? 19);
    }
  }

  agregarLinea(): void {
    const primerArticulo = this.articulos()[0];
    this.nuevaOrden.lineas.push({
      articulo_id: primerArticulo?.id || '',
      cantidad_solicitada: 1,
      costo_unitario: Number(primerArticulo?.costo_promedio || 0),
      porcentaje_iva: Number(primerArticulo?.tarifa_iva ?? 19),
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
    if (!this.nuevaOrden.proveedor_id) {
      this.notificationService.warning('Debe seleccionar un proveedor para la orden de compra.');
      return;
    }

    const lineasSanitizadas = (this.nuevaOrden.lineas || [])
      .filter((l: any) => l.articulo_id && String(l.articulo_id).trim() !== '')
      .map((l: any) => {
        const cant = Number(l.cantidad_solicitada);
        const costo = Number(l.costo_unitario);
        const iva = Number(l.porcentaje_iva);
        return {
          articulo_id: l.articulo_id,
          cantidad_solicitada: isNaN(cant) || cant <= 0 ? 1 : cant,
          costo_unitario: isNaN(costo) || costo < 0 ? 0 : costo,
          porcentaje_iva: isNaN(iva) || iva < 0 ? 19 : iva,
        };
      });

    if (lineasSanitizadas.length === 0) {
      this.notificationService.warning('Debe agregar al menos un artículo válido en las líneas de la orden.');
      return;
    }

    const payload: any = {
      proveedor_id: this.nuevaOrden.proveedor_id,
      fecha_emision: this.nuevaOrden.fecha_emision || new Date().toISOString().slice(0, 10),
      condicion_pago: this.nuevaOrden.condicion_pago || 'CREDITO',
      dias_credito: Number(this.nuevaOrden.dias_credito) || 0,
      metodo_pago: this.nuevaOrden.metodo_pago || 'TRANSFERENCIA',
      lineas: lineasSanitizadas,
    };

    if (this.nuevaOrden.bodega_destino_id) {
      payload.bodega_destino_id = this.nuevaOrden.bodega_destino_id;
    }
    if (this.nuevaOrden.fecha_entrega_esperada) {
      payload.fecha_entrega_esperada = this.nuevaOrden.fecha_entrega_esperada;
    }
    if (this.nuevaOrden.fecha_vencimiento) {
      payload.fecha_vencimiento = this.nuevaOrden.fecha_vencimiento;
    }
    if (this.nuevaOrden.numero_factura_proveedor?.trim()) {
      payload.numero_factura_proveedor = this.nuevaOrden.numero_factura_proveedor.trim();
    }
    if (this.nuevaOrden.observaciones?.trim()) {
      payload.observaciones = this.nuevaOrden.observaciones.trim();
    }

    this.guardando.set(true);
    this.comprasService.crearOrden(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.notificationService.success('Orden de compra registrada exitosamente.');
        this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
      },
      error: (err) => {
        this.guardando.set(false);
        const errorMsg = Array.isArray(err.error?.message)
          ? err.error.message.join(', ')
          : err.error?.message || 'Error al crear la orden de compra';
        this.notificationService.error(errorMsg, 'Error al Registrar Orden');
      },
    });
  }

  cambiarEstado(orden: OrdenCompraItem, nuevoEstado: string): void {
    this.comprasService.cambiarEstado(orden.id, nuevoEstado).subscribe({
      next: () => {
        this.notificationService.info(`Orden ${orden.numero_orden} cambiada a estado ${nuevoEstado}.`);
        this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Error al actualizar estado de la orden');
      },
    });
  }

  abrirModalImprimir(orden: OrdenCompraItem): void {
    this.comprasService.obtenerOrden(orden.id).subscribe({
      next: (full) => this.mostrarModalImprimir.set(full),
      error: () => this.mostrarModalImprimir.set(orden),
    });
  }

  imprimirDocumento(): void {
    window.print();
  }

  abrirModalCausar(orden: OrdenCompraItem): void {
    this.ordenParaCausar.set(orden);
    this.datosCausacion = {
      numero_factura_proveedor: orden.numero_factura_proveedor || `FAC-${orden.numero_orden.replace('OC-', '')}`,
      fecha_factura: orden.fecha_emision || new Date().toISOString().slice(0, 10),
      codigo_concepto: 'COMPRA_INVENTARIO',
      glosa: `Causación factura compra ${orden.numero_orden} - ${orden.proveedor?.nombre_completo || ''}`,
    };
    this.mostrarModalCausar.set(true);
  }

  confirmarCausacion(): void {
    const orden = this.ordenParaCausar();
    if (!orden) return;

    this.guardando.set(true);
    this.comprasService.causarOrden(orden.id, this.datosCausacion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCausar.set(false);
        this.notificationService.success(
          `Factura causada en Cuentas por Pagar con Comprobante CAU y partida doble generada.`,
          'Causación Exitosa',
        );
        this.comprasService.listarOrdenes().subscribe((ords) => this.ordenes.set(ords));
      },
      error: (err) => {
        this.guardando.set(false);
        this.notificationService.error(err.error?.message || 'Error al causar orden en CxP');
      },
    });
  }
}
