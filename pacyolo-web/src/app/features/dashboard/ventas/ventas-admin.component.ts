import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { VentasService, FacturaVentaItem } from '../../../core/services/ventas.service';
import { InventariosService } from '../../../core/services/inventarios.service';
import { ParametrosService } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TerceroLookupModalComponent, TerceroItem } from '../../../shared/components/tercero-lookup-modal.component';
import { ArticuloLookupModalComponent, ArticuloLookupItem } from '../../../shared/components/articulo-lookup-modal.component';
import { TablePaginationComponent } from '../../../shared/components/table-pagination.component';

interface LineaVentaForm {
  articulo_id: string;
  articulo_codigo: string;
  articulo_nombre: string;
  tipo_articulo: string;
  bodega_id?: string;
  cantidad: number;
  precio_unitario: number;
  porcentaje_descuento: number;
  tarifa_iva: number;
  tarifa_inc: number;
  stock_disponible?: number;
}

@Component({
  selector: 'app-ventas-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TerceroLookupModalComponent,
    ArticuloLookupModalComponent,
    TablePaginationComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div class="flex items-center gap-3">
            <span class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl shadow-inner">
              🛒
            </span>
            <div>
              <h1 class="text-xl font-bold text-white tracking-tight">Facturación de Ventas & Mostrador POS</h1>
              <p class="text-xs text-slate-400 mt-0.5">
                Emisión de Facturas Comerciales (FAC), Tiquetes POS, Costeo Automático en Kardex (NIC 2) y Generación de Cartera (CxC).
              </p>
            </div>
          </div>
        </div>

        <!-- Botones de Acción y Pestañas -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="cambiarPestana('FACTURAS')"
            [class]="pestanaActiva() === 'FACTURAS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
          >
            <span>📑</span>
            <span>Historial Facturas</span>
          </button>

          <button
            type="button"
            (click)="cambiarPestana('NUEVA_VENTA')"
            [class]="pestanaActiva() === 'NUEVA_VENTA' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
          >
            <span>⚡</span>
            <span>Nueva Venta / POS</span>
          </button>
        </div>
      </div>

      <!-- PESTAÑA 1: HISTORIAL DE FACTURAS -->
      @if (pestanaActiva() === 'FACTURAS') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <!-- Filtro y Búsqueda -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                [(ngModel)]="busquedaTexto"
                (ngModelChange)="filtrarFacturas()"
                placeholder="Buscar por consecutivo, cliente o identificación..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>

            <div class="text-xs text-slate-400">
              Total facturas registradas: <span class="font-bold text-white">{{ facturas().length }}</span>
            </div>
          </div>

          <!-- Tabla de Facturas -->
          <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3.5">Consecutivo</th>
                  <th class="p-3.5">Fecha</th>
                  <th class="p-3.5">Cliente</th>
                  <th class="p-3.5 text-center">Tipo / Pago</th>
                  <th class="p-3.5 text-right">Subtotal</th>
                  <th class="p-3.5 text-right">IVA / INC</th>
                  <th class="p-3.5 text-right">Total Factura</th>
                  <th class="p-3.5 text-center">Estado</th>
                  <th class="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-sans">
                @if (cargando()) {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-400">
                      <div class="inline-flex items-center gap-2">
                        <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                        Cargando facturas de venta...
                      </div>
                    </td>
                  </tr>
                } @else if (facturasPaginadas().length === 0) {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-500">
                      No se encontraron facturas registradas.
                    </td>
                  </tr>
                } @else {
                  @for (fac of facturasPaginadas(); track fac.id) {
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="p-3.5 font-mono font-bold text-indigo-400">
                        {{ fac.consecutivo }}
                      </td>
                      <td class="p-3.5 text-slate-300">
                        {{ fac.fecha_emision }}
                      </td>
                      <td class="p-3.5">
                        <div class="font-semibold text-white">{{ fac.cliente?.razon_social || fac.cliente?.nombre_completo || 'Cliente General' }}</div>
                        <div class="text-[11px] text-slate-400 font-mono">NIT: {{ fac.cliente?.numero_identificacion || 'N/A' }}</div>
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [class]="fac.tipo_documento === 'TIQUETE_POS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'">
                          {{ fac.tipo_documento === 'TIQUETE_POS' ? 'POS' : 'FACTURA' }}
                        </span>
                        <div class="text-[10px] text-slate-400 mt-0.5 font-medium">{{ fac.condicion_pago }} ({{ fac.medio_pago }})</div>
                      </td>
                      <td class="p-3.5 text-right font-mono text-slate-300">
                        \${{ Number(fac.subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-right font-mono text-slate-300">
                        \${{ (Number(fac.total_iva || 0) + Number(fac.total_inc || 0)).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-right font-mono font-bold text-emerald-400">
                        \${{ Number(fac.total_factura || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                          [class]="fac.estado === 'EMITIDA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'">
                          {{ fac.estado }}
                        </span>
                      </td>
                      <td class="p-3.5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            (click)="abrirDetalle(fac)"
                            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            title="Ver Detalle y Comprobantes Contables"
                          >
                            <span>👁️</span>
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            (click)="imprimirFactura(fac)"
                            class="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            title="Imprimir Membretada"
                          >
                            <span>🖨️</span>
                            <span>Imprimir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <app-table-pagination
            [totalItems]="facturasFiltradas().length"
            [pageSize]="10"
            (pageChange)="paginaActual.set($event)"
          />
        </div>
      }

      <!-- PESTAÑA 2: NUEVA VENTA / POS -->
      @if (pestanaActiva() === 'NUEVA_VENTA') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div class="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <span>⚡</span>
                <span>Registro de Venta & Punto de Venta (POS)</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                Al emitir la venta se genera automáticamente la partida doble NIIF, el descuento en Kardex valorado al costo promedio ponderado y la cuenta por cobrar.
              </p>
            </div>

            <!-- Selector de Modo de Venta -->
            <div class="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                (click)="tipoDocumento.set('FACTURA_VENTA')"
                [class]="tipoDocumento() === 'FACTURA_VENTA' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >
                🧾 Factura Estándar
              </button>
              <button
                type="button"
                (click)="tipoDocumento.set('TIQUETE_POS')"
                [class]="tipoDocumento() === 'TIQUETE_POS' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
                class="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
              >
                ⚡ Tiquete POS / Mostrador
              </button>
            </div>
          </div>

          <!-- Formulario Superior: Cliente y Parámetros -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <!-- Selector de Cliente (Lookup Enterprise) -->
            <div class="md:col-span-2 space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Cliente / Adquirente *</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 truncate">
                  @if (clienteSeleccionado()) {
                    <span class="font-bold text-emerald-400 font-mono">[{{ clienteSeleccionado()?.numero_identificacion }}]</span>
                    <span class="ml-1.5 font-semibold text-white">{{ clienteSeleccionado()?.razon_social || clienteSeleccionado()?.nombre_completo }}</span>
                  } @else {
                    <span class="text-slate-500 italic">Ningún cliente seleccionado...</span>
                  }
                </div>
                <button
                  type="button"
                  (click)="modalClienteVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <span>🔍</span>
                  <span>Buscar</span>
                </button>
              </div>
            </div>

            <!-- Condición de Pago -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Condición de Pago</label>
              <select
                [(ngModel)]="condicionPago"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="CONTADO">Contado (Cancela de Inmediato)</option>
                <option value="CREDITO">Crédito (Afecta Cartera CxC)</option>
              </select>
            </div>

            <!-- Medio de Pago -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Medio de Pago</label>
              <select
                [(ngModel)]="medioPago"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="TARJETA">Tarjeta Débito / Crédito</option>
              </select>
            </div>

            <!-- Fechas -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Fecha de Emisión</label>
              <input
                type="date"
                [(ngModel)]="fechaEmision"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Fecha de Vencimiento</label>
              <input
                type="date"
                [(ngModel)]="fechaVencimiento"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <!-- Bodega Global Predeterminada -->
            <div class="md:col-span-2 space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Bodega de Despacho Predeterminada</label>
              <select
                [(ngModel)]="bodegaPredeterminadaId"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                @for (b of bodegas(); track b.id) {
                  <option [value]="b.id">{{ b.codigo }} - {{ b.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Tabla de Artículos a Facturar -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Ítems de Venta ({{ lineasVenta().length }})
              </h3>
              <button
                type="button"
                (click)="abrirLookupArticulos()"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span>➕</span>
                <span>Agregar Artículos</span>
              </button>
            </div>

            <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th class="p-3">Artículo / Servicio</th>
                    <th class="p-3 w-28 text-center">Cantidad</th>
                    <th class="p-3 w-32 text-right">Precio Unitario</th>
                    <th class="p-3 w-24 text-center">Desc (%)</th>
                    <th class="p-3 w-24 text-center">IVA (%)</th>
                    <th class="p-3 w-24 text-center">INC (%)</th>
                    <th class="p-3 w-32 text-right">Subtotal</th>
                    <th class="p-3 w-12 text-center">✕</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @if (lineasVenta().length === 0) {
                    <tr>
                      <td colspan="8" class="p-8 text-center text-slate-500">
                        No has agregado artículos a la venta. Haz clic en "Agregar Artículos".
                      </td>
                    </tr>
                  } @else {
                    @for (item of lineasVenta(); track item.articulo_id; let i = $index) {
                      <tr class="hover:bg-slate-800/30">
                        <td class="p-3">
                          <div class="font-bold text-white">{{ item.articulo_nombre }}</div>
                          <div class="text-[11px] text-slate-400 font-mono">
                            SKU: {{ item.articulo_codigo }}
                            @if (item.tipo_articulo === 'INVENTARIABLE') {
                              <span class="text-emerald-400 ml-1.5">• Stock Disp: {{ item.stock_disponible || 0 }}</span>
                            } @else {
                              <span class="text-indigo-400 ml-1.5">• Servicio</span>
                            }
                          </div>
                        </td>
                        <td class="p-3">
                          <input
                            type="number"
                            min="0.01"
                            [(ngModel)]="item.cantidad"
                            (ngModelChange)="recalcularTotales()"
                            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </td>
                        <td class="p-3">
                          <input
                            type="number"
                            min="0"
                            [(ngModel)]="item.precio_unitario"
                            (ngModelChange)="recalcularTotales()"
                            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-right text-white focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </td>
                        <td class="p-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            [(ngModel)]="item.porcentaje_descuento"
                            (ngModelChange)="recalcularTotales()"
                            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </td>
                        <td class="p-3 text-center font-mono text-slate-300">
                          {{ item.tarifa_iva }}%
                        </td>
                        <td class="p-3 text-center font-mono text-slate-300">
                          {{ item.tarifa_inc }}%
                        </td>
                        <td class="p-3 text-right font-mono font-bold text-slate-200">
                          \${{ calcularTotalLinea(item).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                        </td>
                        <td class="p-3 text-center">
                          <button
                            type="button"
                            (click)="eliminarLinea(i)"
                            class="text-red-400 hover:text-red-300 font-bold text-sm cursor-pointer"
                            title="Eliminar línea"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Liquidación y Totales -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <!-- Observaciones y Propinas -->
            <div class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-300">Observaciones de la Factura</label>
                <textarea
                  [(ngModel)]="observaciones"
                  rows="3"
                  placeholder="Instrucciones de entrega, notas de garantía, etc..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition resize-none"
                ></textarea>
              </div>

              <!-- Retenciones practicadas por cliente & Propina -->
              <div class="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div class="space-y-1">
                  <label class="text-[11px] text-slate-400">Propina Voluntaria</label>
                  <input
                    type="number"
                    min="0"
                    [(ngModel)]="propina"
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] text-slate-400">Anticipo Retefuente</label>
                  <input
                    type="number"
                    min="0"
                    [(ngModel)]="retefuente"
                    class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- Resumen de Totales y Botón de Emisión -->
            <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div class="flex justify-between text-xs text-slate-400">
                <span>Subtotal Bruto:</span>
                <span class="font-mono font-semibold text-slate-200">\${{ subtotalGeneral().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="flex justify-between text-xs text-slate-400">
                <span>Descuentos:</span>
                <span class="font-mono font-semibold text-amber-400">-\${{ totalDescuentosGeneral().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="flex justify-between text-xs text-slate-400">
                <span>IVA Generado (19% / 5%):</span>
                <span class="font-mono font-semibold text-slate-200">\${{ totalIvaGeneral().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>
              @if (totalIncGeneral() > 0) {
                <div class="flex justify-between text-xs text-slate-400">
                  <span>Impuesto al Consumo (8%):</span>
                  <span class="font-mono font-semibold text-slate-200">\${{ totalIncGeneral().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              }
              @if (propina() > 0) {
                <div class="flex justify-between text-xs text-slate-400">
                  <span>Propina Voluntaria:</span>
                  <span class="font-mono font-semibold text-emerald-400">+\${{ Number(propina()).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              }
              @if (retefuente() > 0) {
                <div class="flex justify-between text-xs text-slate-400">
                  <span>Retefuente Practicada:</span>
                  <span class="font-mono font-semibold text-amber-400">-\${{ Number(retefuente()).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              }
              <div class="border-t border-slate-800 pt-3 flex justify-between items-center text-sm">
                <span class="font-bold text-white uppercase tracking-wider">Total a Pagar:</span>
                <span class="font-mono font-black text-xl text-emerald-400">\${{ totalFacturaGeneral().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>

              <button
                type="button"
                (click)="emitirFactura()"
                [disabled]="guardando() || lineasVenta().length === 0 || !clienteSeleccionado()"
                class="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                @if (guardando()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Emitiendo y Contabilizando...</span>
                } @else {
                  <span>✓</span>
                  <span>Emitir Venta & Contabilizar NIIF</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- MODAL DE DETALLE / IMPRESIÓN DOCUMENTAL (4 PILARES) -->
    @if (modalDetalleVisible() && facturaSeleccionada()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-150">
          <!-- Cabecera del Visor -->
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div class="flex items-center gap-3">
              <span class="text-xl">🧾</span>
              <div>
                <h3 class="text-sm font-bold text-white font-mono">
                  {{ facturaSeleccionada()?.consecutivo }} • Detalle Formal NIIF
                </h3>
                <p class="text-[11px] text-slate-400">
                  Emitida el {{ facturaSeleccionada()?.fecha_emision }} | Creado por: {{ facturaSeleccionada()?.creado_por || 'Sistema' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="ejecutarPrint()"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <span>🖨️</span>
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                (click)="modalDetalleVisible.set(false)"
                class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Contenedor Imprimible Membretado -->
          <div id="area-impresion-factura" class="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
            <!-- Membrete de la Empresa -->
            <div class="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div class="text-base font-black text-white">{{ authService.empresaActiva()?.razon_social }}</div>
                <div class="text-xs text-slate-400 font-mono">NIT: {{ authService.empresaActiva()?.nit }}</div>
                <div class="text-xs text-slate-400">Régimen Común / Responsable de IVA</div>
              </div>
              <div class="text-right">
                <span class="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs font-mono font-bold">
                  {{ facturaSeleccionada()?.consecutivo }}
                </span>
                <div class="text-xs text-slate-400 mt-1">Estado: <span class="font-bold text-emerald-400">{{ facturaSeleccionada()?.estado }}</span></div>
              </div>
            </div>

            <!-- Datos del Cliente -->
            <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-slate-400">Cliente / Razón Social:</span>
                <div class="font-bold text-white">{{ facturaSeleccionada()?.cliente?.razon_social || facturaSeleccionada()?.cliente?.nombre_completo }}</div>
                <div class="text-slate-400 font-mono">NIT / CC: {{ facturaSeleccionada()?.cliente?.numero_identificacion }}</div>
              </div>
              <div>
                <span class="text-slate-400">Condición & Medio de Pago:</span>
                <div class="font-semibold text-white">{{ facturaSeleccionada()?.condicion_pago }} ({{ facturaSeleccionada()?.medio_pago }})</div>
                <div class="text-slate-400">Vencimiento: {{ facturaSeleccionada()?.fecha_vencimiento }}</div>
              </div>
            </div>

            <!-- Tabla de Ítems -->
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                <tr>
                  <th class="p-2.5">Ítem / Artículo</th>
                  <th class="p-2.5 text-center">Cant</th>
                  <th class="p-2.5 text-right">Precio Unit</th>
                  <th class="p-2.5 text-center">IVA</th>
                  <th class="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-sans">
                @for (l of facturaSeleccionada()?.lineas || []; track l.id) {
                  <tr>
                    <td class="p-2.5">
                      <div class="font-semibold text-white">{{ l.articulo?.nombre }}</div>
                      <div class="text-[11px] text-slate-400 font-mono">SKU: {{ l.articulo?.codigo }}</div>
                    </td>
                    <td class="p-2.5 text-center font-mono">{{ l.cantidad }}</td>
                    <td class="p-2.5 text-right font-mono">\${{ Number(l.precio_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                    <td class="p-2.5 text-center font-mono">{{ l.tarifa_iva }}%</td>
                    <td class="p-2.5 text-right font-mono font-bold text-slate-200">\${{ Number(l.total).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Resumen Total -->
            <div class="flex justify-end">
              <div class="w-72 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div class="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span class="font-mono text-slate-200">\${{ Number(facturaSeleccionada()?.subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>IVA:</span>
                  <span class="font-mono text-slate-200">\${{ Number(facturaSeleccionada()?.total_iva || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>INC:</span>
                  <span class="font-mono text-slate-200">\${{ Number(facturaSeleccionada()?.total_inc || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-emerald-400">
                  <span>TOTAL:</span>
                  <span class="font-mono">\${{ Number(facturaSeleccionada()?.total_factura || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

            <!-- Asiento Contable Asociado (Pilar 1: Contabilización Obligatoria) -->
            @if (facturaSeleccionada()?.asiento) {
              <div class="border-t border-slate-800 pt-4 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>📖 Asiento Contable Oficial (CAU-{{ facturaSeleccionada()?.asiento?.consecutivo }})</span>
                  <span class="font-mono text-[11px] text-slate-400">Partida Doble NIIF</span>
                </div>
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                  <table class="w-full text-left font-mono">
                    <thead class="text-slate-500 border-b border-slate-800">
                      <tr>
                        <th class="py-1">Cuenta</th>
                        <th class="py-1">Tercero</th>
                        <th class="py-1 text-right">Débito</th>
                        <th class="py-1 text-right">Crédito</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/40">
                      @for (al of facturaSeleccionada()?.asiento?.lineas || []; track al.id) {
                        <tr>
                          <td class="py-1 text-slate-300">{{ al.cuenta?.codigo }} - {{ al.cuenta?.nombre }}</td>
                          <td class="py-1 text-slate-400">{{ al.tercero?.numero_identificacion || 'N/A' }}</td>
                          <td class="py-1 text-right text-emerald-400">\${{ Number(al.debito || 0).toLocaleString('es-CO') }}</td>
                          <td class="py-1 text-right text-indigo-400">\${{ Number(al.credito || 0).toLocaleString('es-CO') }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Botón Anulación (Pilar 3: Edición o Control de Anulación) -->
            @if (facturaSeleccionada()?.estado === 'EMITIDA') {
              <div class="border-t border-slate-800 pt-4 flex justify-between items-center">
                <span class="text-xs text-slate-500">¿Requiere corrección o devolución de venta?</span>
                <button
                  type="button"
                  (click)="modalAnularVisible.set(true)"
                  class="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  ✕ Anular Factura de Venta
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- MODAL DE ANULACIÓN AUDITADA -->
    @if (modalAnularVisible()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>⚠️</span>
            <span>Anulación Formal de Factura</span>
          </h3>
          <p class="text-xs text-slate-400">
            Esta acción reversará el asiento contable de venta y costo, y reingresará la mercancía al inventario en Kardex.
          </p>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-slate-300">Motivo de Anulación *</label>
            <input
              type="text"
              [(ngModel)]="motivoAnulacion"
              placeholder="Ej: Error en cantidad facturada / Devolución inmediata"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="modalAnularVisible.set(false)"
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="confirmarAnulacion()"
              [disabled]="!motivoAnulacion().trim()"
              class="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-40"
            >
              Confirmar Anulación
            </button>
          </div>
        </div>
      </div>
    }

    <!-- LOOKUP MODALS ENTERPRISE -->
    <app-tercero-lookup-modal
      [(visible)]="modalClienteVisible"
      titulo="Seleccionar Cliente / Adquirente"
      [terceros]="tercerosDisponibles()"
      (seleccionado)="onClienteSeleccionado($event)"
    />

    <app-articulo-lookup-modal
      [(visible)]="modalArticuloVisible"
      titulo="Seleccionar Artículos para la Venta"
      [articulos]="articulosDisponibles()"
      modoSeleccion="MULTIPLE"
      (articulosSeleccionados)="onArticulosSeleccionados($event)"
    />
  `,
})
export class VentasAdminComponent implements OnInit {
  private readonly ventasService = inject(VentasService);
  private readonly inventariosService = inject(InventariosService);
  private readonly http = inject(HttpClient);
  public readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly Number = Number;

  pestanaActiva = signal<'FACTURAS' | 'NUEVA_VENTA'>('FACTURAS');
  facturas = signal<FacturaVentaItem[]>([]);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  busquedaTexto = '';
  facturasFiltradas = signal<FacturaVentaItem[]>([]);
  paginaActual = signal<number>(1);

  // Formulario Venta
  tipoDocumento = signal<'FACTURA_VENTA' | 'TIQUETE_POS'>('FACTURA_VENTA');
  clienteSeleccionado = signal<TerceroItem | null>(null);
  condicionPago = 'CONTADO';
  medioPago = 'EFECTIVO';
  fechaEmision = new Date().toISOString().split('T')[0];
  fechaVencimiento = new Date().toISOString().split('T')[0];
  bodegaPredeterminadaId = '';
  lineasVenta = signal<LineaVentaForm[]>([]);
  propina = signal<number>(0);
  retefuente = signal<number>(0);
  reteica = signal<number>(0);
  reteiva = signal<number>(0);
  observaciones = '';

  // Modales
  facturaSeleccionada = signal<FacturaVentaItem | null>(null);
  modalDetalleVisible = signal<boolean>(false);
  modalAnularVisible = signal<boolean>(false);
  motivoAnulacion = signal<string>('');
  modalClienteVisible = signal<boolean>(false);
  modalArticuloVisible = signal<boolean>(false);

  // Catálogos
  tercerosDisponibles = signal<TerceroItem[]>([]);
  articulosDisponibles = signal<ArticuloLookupItem[]>([]);
  bodegas = signal<any[]>([]);

  readonly facturasPaginadas = computed(() => {
    const list = this.facturasFiltradas();
    const page = this.paginaActual();
    const size = 10;
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly subtotalGeneral = computed(() => {
    return this.lineasVenta().reduce((acc, l) => acc + (Number(l.cantidad || 0) * Number(l.precio_unitario || 0)), 0);
  });

  readonly totalDescuentosGeneral = computed(() => {
    return this.lineasVenta().reduce((acc, l) => {
      const sub = Number(l.cantidad || 0) * Number(l.precio_unitario || 0);
      const desc = Number(l.porcentaje_descuento || 0);
      return acc + ((sub * desc) / 100);
    }, 0);
  });

  readonly totalIvaGeneral = computed(() => {
    return this.lineasVenta().reduce((acc, l) => {
      const sub = Number(l.cantidad || 0) * Number(l.precio_unitario || 0);
      const desc = Number(l.porcentaje_descuento || 0);
      const base = sub - ((sub * desc) / 100);
      const iva = Number(l.tarifa_iva || 0);
      return acc + ((base * iva) / 100);
    }, 0);
  });

  readonly totalIncGeneral = computed(() => {
    return this.lineasVenta().reduce((acc, l) => {
      const sub = Number(l.cantidad || 0) * Number(l.precio_unitario || 0);
      const desc = Number(l.porcentaje_descuento || 0);
      const base = sub - ((sub * desc) / 100);
      const inc = Number(l.tarifa_inc || 0);
      return acc + ((base * inc) / 100);
    }, 0);
  });

  readonly totalFacturaGeneral = computed(() => {
    const neto = this.subtotalGeneral() - this.totalDescuentosGeneral();
    const tributos = this.totalIvaGeneral() + this.totalIncGeneral() + Number(this.propina() || 0);
    const retenciones = Number(this.retefuente() || 0) + Number(this.reteica() || 0) + Number(this.reteiva() || 0);
    return Math.max(0, neto + tributos - retenciones);
  });

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarCatalogos();
  }

  cambiarPestana(pestana: 'FACTURAS' | 'NUEVA_VENTA'): void {
    this.pestanaActiva.set(pestana);
    if (pestana === 'FACTURAS') {
      this.cargarFacturas();
    }
  }

  cargarFacturas(): void {
    this.cargando.set(true);
    this.ventasService.listarFacturas().subscribe({
      next: (data) => {
        this.facturas.set(data || []);
        this.filtrarFacturas();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  filtrarFacturas(): void {
    const q = this.busquedaTexto.toLowerCase().trim();
    if (!q) {
      this.facturasFiltradas.set(this.facturas());
      return;
    }
    const filtrados = this.facturas().filter((f) => {
      return (
        f.consecutivo.toLowerCase().includes(q) ||
        (f.cliente?.razon_social && f.cliente.razon_social.toLowerCase().includes(q)) ||
        (f.cliente?.numero_identificacion && f.cliente.numero_identificacion.toLowerCase().includes(q))
      );
    });
    this.facturasFiltradas.set(filtrados);
    this.paginaActual.set(1);
  }

  cargarCatalogos(): void {
    const emp = this.authService.empresaActiva();
    if (emp) {
      this.http.get<TerceroItem[]>(`http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`).subscribe({
        next: (t) => this.tercerosDisponibles.set(t || []),
      });
    }

    this.inventariosService.listarArticulos().subscribe({
      next: (a: any) => this.articulosDisponibles.set(a || []),
    });

    this.http.get<any[]>('http://localhost:3000/api/v1/parametros/bodegas').subscribe({
      next: (b) => {
        this.bodegas.set(b || []);
        if (b && b.length > 0 && !this.bodegaPredeterminadaId) {
          this.bodegaPredeterminadaId = b[0].id;
        }
      },
    });
  }

  onClienteSeleccionado(cliente: TerceroItem): void {
    this.clienteSeleccionado.set(cliente);
  }

  abrirLookupArticulos(): void {
    this.modalArticuloVisible.set(true);
  }

  onArticulosSeleccionados(articulos: ArticuloLookupItem[]): void {
    const actuales = [...this.lineasVenta()];
    for (const art of articulos) {
      const yaExiste = actuales.some((l) => l.articulo_id === art.id);
      if (!yaExiste) {
        actuales.push({
          articulo_id: art.id,
          articulo_codigo: art.codigo,
          articulo_nombre: art.nombre,
          tipo_articulo: art.tipo_articulo,
          bodega_id: this.bodegaPredeterminadaId,
          cantidad: 1,
          precio_unitario: Number(art.precio_venta_sugerido || 0),
          porcentaje_descuento: 0,
          tarifa_iva: Number(art.tarifa_iva || 0),
          tarifa_inc: Number(art.tarifa_inc || 0),
          stock_disponible: Number(art.stock_actual || 0),
        });
      }
    }
    this.lineasVenta.set(actuales);
  }

  eliminarLinea(index: number): void {
    const actuales = [...this.lineasVenta()];
    actuales.splice(index, 1);
    this.lineasVenta.set(actuales);
  }

  recalcularTotales(): void {
    // Trigger signal updates
    this.lineasVenta.set([...this.lineasVenta()]);
  }

  calcularTotalLinea(item: LineaVentaForm): number {
    const sub = Number(item.cantidad || 0) * Number(item.precio_unitario || 0);
    const desc = Number(item.porcentaje_descuento || 0);
    const base = sub - ((sub * desc) / 100);
    const iva = Number(item.tarifa_iva || 0);
    const inc = Number(item.tarifa_inc || 0);
    return base + ((base * iva) / 100) + ((base * inc) / 100);
  }

  emitirFactura(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) {
      this.notification.warning('Atención', 'Debe seleccionar un cliente para emitir la venta.');
      return;
    }

    if (this.lineasVenta().length === 0) {
      this.notification.warning('Atención', 'Debe agregar al menos un artículo a la venta.');
      return;
    }

    // Validar existencias
    for (const l of this.lineasVenta()) {
      if (l.tipo_articulo === 'INVENTARIABLE' && (l.stock_disponible || 0) < l.cantidad) {
        this.notification.error(
          'Stock Insuficiente',
          `El artículo [${l.articulo_codigo} - ${l.articulo_nombre}] no cuenta con stock suficiente (${l.stock_disponible || 0} disponibles vs ${l.cantidad} requeridos).`
        );
        return;
      }
    }

    const payload = {
      cliente_id: cliente.id,
      tipo_documento: this.tipoDocumento(),
      fecha_emision: this.fechaEmision,
      fecha_vencimiento: this.fechaVencimiento,
      condicion_pago: this.condicionPago,
      medio_pago: this.medioPago,
      propina: Number(this.propina() || 0),
      retefuente: Number(this.retefuente() || 0),
      reteica: Number(this.reteica() || 0),
      reteiva: Number(this.reteiva() || 0),
      observaciones: this.observaciones,
      lineas: this.lineasVenta().map((l) => ({
        articulo_id: l.articulo_id,
        bodega_id: l.bodega_id || this.bodegaPredeterminadaId,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
        porcentaje_descuento: Number(l.porcentaje_descuento || 0),
        tarifa_iva: Number(l.tarifa_iva || 0),
        tarifa_inc: Number(l.tarifa_inc || 0),
      })),
    };

    this.guardando.set(true);
    this.ventasService.emitirFactura(payload).subscribe({
      next: (fac) => {
        this.guardando.set(false);
        this.notification.success(
          'Venta Emitida Exitosamente',
          `Factura ${fac.consecutivo} generada y contabilizada con éxito bajo norma NIIF.`
        );
        // Limpiar formulario y cambiar de pestaña
        this.lineasVenta.set([]);
        this.clienteSeleccionado.set(null);
        this.observaciones = '';
        this.propina.set(0);
        this.retefuente.set(0);
        this.cambiarPestana('FACTURAS');
        this.abrirDetalle(fac);
      },
      error: (err) => {
        this.guardando.set(false);
        this.notification.error('Error al emitir factura', err.error?.message || 'Ocurrió un error inesperado');
      },
    });
  }

  abrirDetalle(fac: FacturaVentaItem): void {
    this.ventasService.obtenerFactura(fac.id).subscribe({
      next: (completa) => {
        this.facturaSeleccionada.set(completa);
        this.modalDetalleVisible.set(true);
      },
      error: () => {
        this.facturaSeleccionada.set(fac);
        this.modalDetalleVisible.set(true);
      },
    });
  }

  imprimirFactura(fac: FacturaVentaItem): void {
    this.abrirDetalle(fac);
    setTimeout(() => {
      this.ejecutarPrint();
    }, 300);
  }

  ejecutarPrint(): void {
    window.print();
  }

  confirmarAnulacion(): void {
    const fac = this.facturaSeleccionada();
    if (!fac) return;

    this.ventasService.anularFactura(fac.id, this.motivoAnulacion()).subscribe({
      next: () => {
        this.notification.success('Factura Anulada', `La factura ${fac.consecutivo} ha sido anulada y el inventario reingresado.`);
        this.modalAnularVisible.set(false);
        this.modalDetalleVisible.set(false);
        this.cargarFacturas();
      },
      error: (err) => {
        this.notification.error('Error al anular', err.error?.message || 'No se pudo anular la factura.');
      },
    });
  }
}
