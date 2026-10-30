import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { VentasService, FacturaVentaItem, NotaCreditoVentaItem, CreateNotaCreditoDto } from '../../../core/services/ventas.service';
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

interface LineaNotaCreditoForm {
  articulo_id: string;
  articulo_codigo: string;
  articulo_nombre: string;
  bodega_id?: string;
  cantidad_facturada: number;
  cantidad_devolver: number;
  precio_unitario: number;
  tarifa_iva: number;
  tarifa_inc: number;
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
                Facturas Oficiales (FAC), Mostrador POS, Reversión NIIF con Notas Crédito (NC) y Costeo Automático (NIC 2).
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
            (click)="cambiarPestana('NOTAS_CREDITO')"
            [class]="pestanaActiva() === 'NOTAS_CREDITO' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
          >
            <span>📄</span>
            <span>Notas Crédito (NIIF)</span>
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
              <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th class="p-3.5">Consecutivo</th>
                  <th class="p-3.5">Fecha</th>
                  <th class="p-3.5">Cliente / Adquirente</th>
                  <th class="p-3.5">Tipo / Medio</th>
                  <th class="p-3.5 text-right">Subtotal</th>
                  <th class="p-3.5 text-right">Impuestos</th>
                  <th class="p-3.5 text-right">Total Factura</th>
                  <th class="p-3.5 text-center">Estado</th>
                  <th class="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-sans">
                @if (cargando()) {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-400">
                      <div class="flex items-center justify-center gap-2">
                        <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                        <span>Cargando facturas de venta...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (facturasPaginadas().length === 0) {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-500">
                      No se encontraron facturas registradas con el criterio de búsqueda.
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
                        <div class="font-semibold text-white">{{ fac.cliente?.razon_social || fac.cliente?.nombre_completo }}</div>
                        <div class="text-[11px] text-slate-400 font-mono">NIT: {{ fac.cliente?.numero_identificacion }}</div>
                      </td>
                      <td class="p-3.5">
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
                          [class]="fac.estado === 'EMITIDA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (fac.estado === 'REVERSADA_PARCIAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : (fac.estado === 'REVERSADA_TOTAL' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'))">
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
                          @if (fac.estado === 'EMITIDA' || fac.estado === 'REVERSADA_PARCIAL') {
                            <button
                              type="button"
                              (click)="abrirModalNotaCredito(fac)"
                              class="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                              title="Emitir Nota Crédito (Reversión NIIF)"
                            >
                              <span>📄</span>
                              <span>NC</span>
                            </button>
                          }
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

      <!-- PESTAÑA 2: HISTORIAL DE NOTAS CRÉDITO (REVERSIÓN NIIF 15 & NIC 2) -->
      @if (pestanaActiva() === 'NOTAS_CREDITO') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                [(ngModel)]="busquedaNcTexto"
                (ngModelChange)="filtrarNotasCredito()"
                placeholder="Buscar por NC, factura, cliente o NIT..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>

            <div class="text-xs text-slate-400">
              Total notas crédito emitidas: <span class="font-bold text-white">{{ notasCredito().length }}</span>
            </div>
          </div>

          <!-- Tabla de Notas Crédito -->
          <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th class="p-3.5">Consecutivo</th>
                  <th class="p-3.5">Factura Afectada</th>
                  <th class="p-3.5">Fecha</th>
                  <th class="p-3.5">Cliente / Adquirente</th>
                  <th class="p-3.5">Motivo DIAN</th>
                  <th class="p-3.5">Reembolso</th>
                  <th class="p-3.5 text-right">Subtotal</th>
                  <th class="p-3.5 text-right">Total NC</th>
                  <th class="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-sans">
                @if (cargandoNc()) {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-400">
                      <div class="flex items-center justify-center gap-2">
                        <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                        <span>Cargando notas crédito...</span>
                      </div>
                    </td>
                  </tr>
                } @else if (notasCreditoFiltradas().length === 0) {
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-500">
                      No se han emitido notas crédito hasta el momento.
                    </td>
                  </tr>
                } @else {
                  @for (nc of notasCreditoFiltradas(); track nc.id) {
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="p-3.5 font-mono font-bold text-amber-400">
                        {{ nc.consecutivo }}
                      </td>
                      <td class="p-3.5 font-mono text-indigo-400">
                        {{ nc.factura?.consecutivo }}
                      </td>
                      <td class="p-3.5 text-slate-300">
                        {{ nc.fecha_emision }}
                      </td>
                      <td class="p-3.5">
                        <div class="font-semibold text-white">{{ nc.cliente?.razon_social }}</div>
                        <div class="text-[11px] text-slate-400 font-mono">NIT: {{ nc.cliente?.numero_identificacion }}</div>
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {{ nc.motivo_dian }}
                        </span>
                      </td>
                      <td class="p-3.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [class]="nc.tipo_reembolso === 'CARTERA' ? 'bg-blue-500/10 text-blue-400' : (nc.tipo_reembolso === 'DEVOLUCION_DINERO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400')">
                          {{ nc.tipo_reembolso }}
                        </span>
                      </td>
                      <td class="p-3.5 text-right font-mono text-slate-300">
                        \${{ Number(nc.subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-right font-mono font-bold text-amber-400">
                        \${{ Number(nc.total_nota || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            (click)="abrirDetalleNc(nc)"
                            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            title="Ver Detalle y Asiento"
                          >
                            <span>👁️</span>
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            (click)="imprimirNc(nc)"
                            class="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            title="Imprimir NC Membretada"
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
        </div>
      }

      <!-- PESTAÑA 3: NUEVA VENTA / POS -->
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
                    <span class="font-bold text-indigo-400 font-mono">[{{ clienteSeleccionado()?.numero_identificacion }}]</span>
                    <span class="ml-1.5 font-medium">{{ clienteSeleccionado()?.razon_social || clienteSeleccionado()?.nombre_completo }}</span>
                  } @else {
                    <span class="text-slate-500 italic">Haga clic en 'Buscar' para seleccionar cliente...</span>
                  }
                </div>
                <button
                  type="button"
                  (click)="modalClienteVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>🔍</span>
                  <span>Buscar</span>
                </button>
              </div>
            </div>

            <!-- Condición de Pago -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Condición de Pago *</label>
              <select
                [(ngModel)]="condicionPago"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="CONTADO">Contado (Inmediato)</option>
                <option value="CREDITO">Crédito (A Plazos)</option>
              </select>
            </div>

            <!-- Medio de Pago -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Medio de Pago *</label>
              <select
                [(ngModel)]="medioPago"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="EFECTIVO">Efectivo en Caja</option>
                <option value="TRANSFERENCIA">Transferencia / QR</option>
                <option value="TARJETA">Tarjeta Débito / Crédito</option>
              </select>
            </div>

            <!-- Fechas -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Fecha de Emisión *</label>
              <input
                type="date"
                [(ngModel)]="fechaEmision"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Fecha de Vencimiento *</label>
              <input
                type="date"
                [(ngModel)]="fechaVencimiento"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Bodega Predeterminada -->
            <div class="md:col-span-2 space-y-1.5">
              <label class="text-xs font-semibold text-slate-300">Bodega de Despacho de Inventario</label>
              <select
                [(ngModel)]="bodegaPredeterminadaId"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <span>📦</span>
                <span>Artículos & Servicios a Facturar</span>
              </h3>
              <button
                type="button"
                (click)="abrirLookupArticulos()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <span>➕</span>
                <span>Agregar Artículos</span>
              </button>
            </div>

            <div class="overflow-x-auto border border-slate-800 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th class="p-3">Artículo</th>
                    <th class="p-3 text-center">Stock</th>
                    <th class="p-3 text-center w-24">Cantidad</th>
                    <th class="p-3 text-right w-32">Precio Unit</th>
                    <th class="p-3 text-center w-24">% Desc</th>
                    <th class="p-3 text-center">IVA</th>
                    <th class="p-3 text-center">INC</th>
                    <th class="p-3 text-right">Total</th>
                    <th class="p-3 text-center w-12">✕</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @if (lineasVenta().length === 0) {
                    <tr>
                      <td colspan="9" class="p-8 text-center text-slate-500">
                        No hay artículos agregados. Haga clic en "+ Agregar Artículos" para comenzar la factura.
                      </td>
                    </tr>
                  } @else {
                    @for (item of lineasVenta(); track item.articulo_id; let i = $index) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="p-3">
                          <div class="font-semibold text-white">{{ item.articulo_nombre }}</div>
                          <div class="text-[11px] text-slate-400 font-mono">SKU: {{ item.articulo_codigo }} ({{ item.tipo_articulo }})</div>
                        </td>
                        <td class="p-3 text-center font-mono" [class.text-rose-400]="item.tipo_articulo === 'INVENTARIABLE' && (item.stock_disponible || 0) < item.cantidad">
                          {{ item.tipo_articulo === 'INVENTARIABLE' ? item.stock_disponible : 'N/A' }}
                        </td>
                        <td class="p-3">
                          <input
                            type="number"
                            min="0.0001"
                            [(ngModel)]="item.cantidad"
                            (ngModelChange)="recalcularTotales()"
                            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
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
              <div class="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span class="text-sm font-bold text-white">TOTAL A FACTURAR:</span>
                <span class="text-2xl font-black font-mono text-emerald-400">\${{ totalFacturaGeneral().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>

              <div class="pt-2">
                <button
                  type="button"
                  (click)="emitirFactura()"
                  [disabled]="guardando() || lineasVenta().length === 0"
                  class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  @if (guardando()) {
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Contabilizando y Emitiendo Factura...</span>
                  } @else {
                    <span>🚀</span>
                    <span>Emitir & Contabilizar Factura NIIF</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- MODAL DE DETALLE DE FACTURA & COMPROBANTES CONTABLES -->
    @if (modalDetalleVisible() && facturaSeleccionada()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                🧾
              </span>
              <div>
                <h3 class="text-base font-bold text-white">
                  Factura de Venta {{ facturaSeleccionada()?.consecutivo }}
                </h3>
                <span class="text-xs text-slate-400">Emisión: {{ facturaSeleccionada()?.fecha_emision }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="imprimirFactura(facturaSeleccionada()!)"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span>
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                (click)="modalDetalleVisible.set(false)"
                class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Datos de la Factura -->
          <div class="space-y-4">
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
                <div class="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-emerald-400">
                  <span>TOTAL:</span>
                  <span class="font-mono">\${{ Number(facturaSeleccionada()?.total_factura || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

            <!-- Asiento Comercial (Pilar 1: Contabilización Obligatoria) -->
            @if (facturaSeleccionada()?.asiento) {
              <div class="border-t border-slate-800 pt-4 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>📖 Asiento Comercial Oficial (CAU-{{ facturaSeleccionada()?.asiento?.consecutivo }})</span>
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

            <!-- Asiento de Costo (NIC 2: Costeo en Kardex) -->
            @if (facturaSeleccionada()?.asiento_costo) {
              <div class="border-t border-slate-800 pt-3 space-y-2">
                <div class="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>⚙️ Asiento de Costo de Ventas NIC 2 (DIA-{{ facturaSeleccionada()?.asiento_costo?.consecutivo }})</span>
                  <span class="font-mono text-[11px] text-slate-400">Débito 61 <-> Crédito 14</span>
                </div>
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                  <table class="w-full text-left font-mono">
                    <tbody class="divide-y divide-slate-800/40">
                      @for (cl of facturaSeleccionada()?.asiento_costo?.lineas || []; track cl.id) {
                        <tr>
                          <td class="py-1 text-slate-300">{{ cl.cuenta?.codigo }} - {{ cl.cuenta?.nombre }}</td>
                          <td class="py-1 text-slate-400">{{ cl.tercero?.numero_identificacion || 'N/A' }}</td>
                          <td class="py-1 text-right text-emerald-400">\${{ Number(cl.debito || 0).toLocaleString('es-CO') }}</td>
                          <td class="py-1 text-right text-indigo-400">\${{ Number(cl.credito || 0).toLocaleString('es-CO') }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Botón Nota Crédito (Pilar 3: Gobernanza y Reversión No Destructiva) -->
            @if (facturaSeleccionada()?.estado === 'EMITIDA' || facturaSeleccionada()?.estado === 'REVERSADA_PARCIAL') {
              <div class="border-t border-slate-800 pt-4 flex justify-between items-center">
                <span class="text-xs text-slate-400">Reversión contable / devolución de mercancía:</span>
                <button
                  type="button"
                  (click)="abrirModalNotaCredito(facturaSeleccionada()!)"
                  class="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <span>📄</span>
                  <span>Emitir Nota Crédito NIIF (NC)</span>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- MODAL DE EMISIÓN DE NOTA CRÉDITO (REVERSIÓN NIIF 15 & NIC 2) -->
    @if (modalNotaCreditoVisible() && facturaParaNc()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>📄</span>
              <span>Emisión de Nota Crédito NIIF sobre {{ facturaParaNc()?.consecutivo }}</span>
            </h3>
            <button
              type="button"
              (click)="modalNotaCreditoVisible.set(false)"
              class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs grid grid-cols-2 gap-3">
            <div>
              <span class="text-slate-400">Cliente:</span>
              <div class="font-bold text-white">{{ facturaParaNc()?.cliente?.razon_social }}</div>
              <div class="text-slate-500 font-mono">NIT: {{ facturaParaNc()?.cliente?.numero_identificacion }}</div>
            </div>
            <div>
              <span class="text-slate-400">Total Factura Original:</span>
              <div class="font-bold text-emerald-400 font-mono">\${{ Number(facturaParaNc()?.total_factura || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</div>
            </div>
          </div>

          <!-- Parámetros de la Nota Crédito -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Motivo DIAN / Operativo *</label>
              <select
                [(ngModel)]="ncMotivo"
                (ngModelChange)="onCambioMotivoNc()"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
              >
                <option value="DEVOLUCION_TOTAL">Devolución Física Total de Mercancía</option>
                <option value="DEVOLUCION_PARCIAL">Devolución Física Parcial de Mercancía</option>
                <option value="AJUSTE_PRECIO_DESCUENTO">Ajuste de Precio / Rebaja Comercial (Sin movimiento físico)</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Destino del Reembolso Financiero *</label>
              <select
                [(ngModel)]="ncTipoReembolso"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
              >
                <option value="CARTERA">Abonar a la Cartera (CxC - Crédito 1305)</option>
                <option value="DEVOLUCION_DINERO">Reembolso de Dinero (Egreso Caja/Banco)</option>
                <option value="ANTICIPO_SALDO_FAVOR">Saldo a Favor del Cliente (Anticipo 2805)</option>
              </select>
            </div>
          </div>

          <!-- Tabla de Ítems a Devolver -->
          <div class="space-y-2 text-xs">
            <label class="font-semibold text-slate-300">Ítems a Devolver y Cantidades *</label>
            <div class="overflow-x-auto border border-slate-800 rounded-xl">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th class="p-2.5">Artículo</th>
                    <th class="p-2.5 text-center">Facturado</th>
                    <th class="p-2.5 text-center w-28">Cant Devolver</th>
                    <th class="p-2.5 text-right">Precio Unit</th>
                    <th class="p-2.5 text-center">IVA</th>
                    <th class="p-2.5 text-right">Total Revertido</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @for (l of lineasNc(); track l.articulo_id) {
                    <tr>
                      <td class="p-2.5">
                        <div class="font-semibold text-white">{{ l.articulo_nombre }}</div>
                        <div class="text-[10px] text-slate-400 font-mono">SKU: {{ l.articulo_codigo }}</div>
                      </td>
                      <td class="p-2.5 text-center font-mono">{{ l.cantidad_facturada }}</td>
                      <td class="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          [max]="l.cantidad_facturada"
                          [(ngModel)]="l.cantidad_devolver"
                          (ngModelChange)="recalcularTotalesNc()"
                          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td class="p-2.5 text-right font-mono">\${{ Number(l.precio_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                      <td class="p-2.5 text-center font-mono">{{ l.tarifa_iva }}%</td>
                      <td class="p-2.5 text-right font-mono font-bold text-amber-400">
                        \${{ calcularTotalLineaNc(l).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Observaciones y Resumen -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Observaciones / Motivo de la NC</label>
              <textarea
                [(ngModel)]="ncObservaciones"
                rows="3"
                placeholder="Explicación detallada del motivo de la devolución o ajuste..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 resize-none"
              ></textarea>
            </div>

            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div class="flex justify-between text-slate-400">
                <span>Subtotal Revertido (4175):</span>
                <span class="font-mono text-slate-200">\${{ ncSubtotal().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>IVA Revertido (240805):</span>
                <span class="font-mono text-slate-200">\${{ ncIva().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="border-t border-slate-800 pt-2 flex justify-between font-bold text-base text-amber-400">
                <span>TOTAL NOTA CRÉDITO:</span>
                <span class="font-mono">\${{ ncTotal().toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              (click)="modalNotaCreditoVisible.set(false)"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="confirmarEmisionNotaCredito()"
              [disabled]="guardandoNc() || ncTotal() <= 0"
              class="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/30"
            >
              @if (guardandoNc()) {
                <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Contabilizando Nota Crédito NIIF...</span>
              } @else {
                <span>✓</span>
                <span>Emitir y Contabilizar Nota Crédito</span>
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL DE DETALLE DE NOTA CRÉDITO -->
    @if (modalDetalleNcVisible() && ncSeleccionada()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                📄
              </span>
              <div>
                <h3 class="text-base font-bold text-white">
                  Nota Crédito {{ ncSeleccionada()?.consecutivo }}
                </h3>
                <span class="text-xs text-slate-400">Sobre Factura {{ ncSeleccionada()?.factura?.consecutivo }} | Emisión: {{ ncSeleccionada()?.fecha_emision }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="imprimirNc(ncSeleccionada()!)"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span>
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                (click)="modalDetalleNcVisible.set(false)"
                class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-slate-400">Cliente / Razón Social:</span>
              <div class="font-bold text-white">{{ ncSeleccionada()?.cliente?.razon_social }}</div>
              <div class="text-slate-400 font-mono">NIT: {{ ncSeleccionada()?.cliente?.numero_identificacion }}</div>
            </div>
            <div>
              <span class="text-slate-400">Motivo & Destino de Reembolso:</span>
              <div class="font-semibold text-amber-400">{{ ncSeleccionada()?.motivo_dian }}</div>
              <div class="text-slate-300">Reembolso: {{ ncSeleccionada()?.tipo_reembolso }}</div>
            </div>
          </div>

          <!-- Tabla de Ítems Devueltos -->
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
              <tr>
                <th class="p-2.5">Ítem / Artículo</th>
                <th class="p-2.5 text-center">Cant Devuelta</th>
                <th class="p-2.5 text-right">Precio Unit</th>
                <th class="p-2.5 text-center">IVA</th>
                <th class="p-2.5 text-right">Total Revertido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              @for (l of ncSeleccionada()?.lineas || []; track l.id) {
                <tr>
                  <td class="p-2.5">
                    <div class="font-semibold text-white">{{ l.articulo?.nombre }}</div>
                    <div class="text-[11px] text-slate-400 font-mono">SKU: {{ l.articulo?.codigo }}</div>
                  </td>
                  <td class="p-2.5 text-center font-mono font-bold text-amber-400">{{ l.cantidad }}</td>
                  <td class="p-2.5 text-right font-mono">\${{ Number(l.precio_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                  <td class="p-2.5 text-center font-mono">{{ l.tarifa_iva }}%</td>
                  <td class="p-2.5 text-right font-mono font-bold text-slate-200">\${{ Number(l.total).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Asiento Comercial de NC -->
          @if (ncSeleccionada()?.asiento) {
            <div class="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <div class="flex items-center justify-between font-bold text-indigo-400">
                <span>📖 Asiento Comercial Oficial (DIA-{{ ncSeleccionada()?.asiento?.consecutivo }})</span>
                <span class="font-mono text-[11px] text-slate-400">Reversión de Ingresos (4175)</span>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                <table class="w-full text-left font-mono">
                  <tbody class="divide-y divide-slate-800/40">
                    @for (al of ncSeleccionada()?.asiento?.lineas || []; track al.id) {
                      <tr>
                        <td class="py-1 text-slate-300">{{ al.cuenta?.codigo }} - {{ al.cuenta?.nombre }}</td>
                        <td class="py-1 text-right text-emerald-400">\${{ Number(al.debito || 0).toLocaleString('es-CO') }}</td>
                        <td class="py-1 text-right text-indigo-400">\${{ Number(al.credito || 0).toLocaleString('es-CO') }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Asiento de Reversión de Costo -->
          @if (ncSeleccionada()?.asiento_costo) {
            <div class="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <div class="flex items-center justify-between font-bold text-emerald-400">
                <span>⚙️ Asiento de Reingreso a Inventario NIC 2 (DIA-{{ ncSeleccionada()?.asiento_costo?.consecutivo }})</span>
                <span class="font-mono text-[11px] text-slate-400">Débito 14 <-> Crédito 61</span>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                <table class="w-full text-left font-mono">
                  <tbody class="divide-y divide-slate-800/40">
                    @for (cl of ncSeleccionada()?.asiento_costo?.lineas || []; track cl.id) {
                      <tr>
                        <td class="py-1 text-slate-300">{{ cl.cuenta?.codigo }} - {{ cl.cuenta?.nombre }}</td>
                        <td class="py-1 text-right text-emerald-400">\${{ Number(cl.debito || 0).toLocaleString('es-CO') }}</td>
                        <td class="py-1 text-right text-indigo-400">\${{ Number(cl.credito || 0).toLocaleString('es-CO') }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
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

  pestanaActiva = signal<'FACTURAS' | 'NOTAS_CREDITO' | 'NUEVA_VENTA'>('FACTURAS');
  facturas = signal<FacturaVentaItem[]>([]);
  cargando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  busquedaTexto = '';
  facturasFiltradas = signal<FacturaVentaItem[]>([]);
  paginaActual = signal<number>(1);

  // Notas Crédito
  notasCredito = signal<NotaCreditoVentaItem[]>([]);
  cargandoNc = signal<boolean>(false);
  busquedaNcTexto = '';
  notasCreditoFiltradas = signal<NotaCreditoVentaItem[]>([]);
  modalNotaCreditoVisible = signal<boolean>(false);
  facturaParaNc = signal<FacturaVentaItem | null>(null);
  ncMotivo = 'DEVOLUCION_TOTAL';
  ncTipoReembolso = 'CARTERA';
  ncObservaciones = '';
  lineasNc = signal<LineaNotaCreditoForm[]>([]);
  guardandoNc = signal<boolean>(false);
  modalDetalleNcVisible = signal<boolean>(false);
  ncSeleccionada = signal<NotaCreditoVentaItem | null>(null);

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

  // Totales de la Nota Crédito
  readonly ncSubtotal = computed(() => {
    return this.lineasNc().reduce((acc, l) => acc + (Number(l.cantidad_devolver || 0) * Number(l.precio_unitario || 0)), 0);
  });

  readonly ncIva = computed(() => {
    return this.lineasNc().reduce((acc, l) => {
      const sub = Number(l.cantidad_devolver || 0) * Number(l.precio_unitario || 0);
      return acc + ((sub * Number(l.tarifa_iva || 0)) / 100);
    }, 0);
  });

  readonly ncTotal = computed(() => {
    return Number((this.ncSubtotal() + this.ncIva()).toFixed(2));
  });

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarCatalogos();
  }

  cambiarPestana(pestana: 'FACTURAS' | 'NOTAS_CREDITO' | 'NUEVA_VENTA'): void {
    this.pestanaActiva.set(pestana);
    if (pestana === 'FACTURAS') {
      this.cargarFacturas();
    } else if (pestana === 'NOTAS_CREDITO') {
      this.cargarNotasCredito();
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

  cargarNotasCredito(): void {
    this.cargandoNc.set(true);
    this.ventasService.listarNotasCredito().subscribe({
      next: (data) => {
        this.notasCredito.set(data || []);
        this.filtrarNotasCredito();
        this.cargandoNc.set(false);
      },
      error: () => {
        this.cargandoNc.set(false);
      },
    });
  }

  filtrarNotasCredito(): void {
    const q = this.busquedaNcTexto.toLowerCase().trim();
    if (!q) {
      this.notasCreditoFiltradas.set(this.notasCredito());
      return;
    }
    const filtrados = this.notasCredito().filter((nc) => {
      return (
        nc.consecutivo.toLowerCase().includes(q) ||
        (nc.factura?.consecutivo && nc.factura.consecutivo.toLowerCase().includes(q)) ||
        (nc.cliente?.razon_social && nc.cliente.razon_social.toLowerCase().includes(q)) ||
        (nc.cliente?.numero_identificacion && nc.cliente.numero_identificacion.toLowerCase().includes(q))
      );
    });
    this.notasCreditoFiltradas.set(filtrados);
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

  abrirModalNotaCredito(fac: FacturaVentaItem): void {
    this.modalDetalleVisible.set(false);
    this.facturaParaNc.set(fac);
    this.ncMotivo = 'DEVOLUCION_TOTAL';
    this.ncTipoReembolso = fac.condicion_pago === 'CREDITO' ? 'CARTERA' : 'DEVOLUCION_DINERO';
    this.ncObservaciones = `Devolución / Ajuste sobre factura ${fac.consecutivo}`;

    const lineas = (fac.lineas || []).map((fl) => ({
      articulo_id: fl.articulo_id,
      articulo_codigo: fl.articulo?.codigo || '',
      articulo_nombre: fl.articulo?.nombre || '',
      bodega_id: fl.bodega_id,
      cantidad_facturada: Number(fl.cantidad),
      cantidad_devolver: Number(fl.cantidad),
      precio_unitario: Number(fl.precio_unitario),
      tarifa_iva: Number(fl.tarifa_iva || 0),
      tarifa_inc: Number(fl.tarifa_inc || 0),
    }));
    this.lineasNc.set(lineas);
    this.modalNotaCreditoVisible.set(true);
  }

  onCambioMotivoNc(): void {
    if (this.ncMotivo === 'AJUSTE_PRECIO_DESCUENTO') {
      const lineas = this.lineasNc().map((l) => ({ ...l, cantidad_devolver: 0 }));
      this.lineasNc.set(lineas);
    } else {
      const lineas = this.lineasNc().map((l) => ({ ...l, cantidad_devolver: l.cantidad_facturada }));
      this.lineasNc.set(lineas);
    }
  }

  recalcularTotalesNc(): void {
    this.lineasNc.set([...this.lineasNc()]);
  }

  calcularTotalLineaNc(l: LineaNotaCreditoForm): number {
    const sub = Number(l.cantidad_devolver || 0) * Number(l.precio_unitario || 0);
    const iva = (sub * Number(l.tarifa_iva || 0)) / 100;
    return sub + iva;
  }

  confirmarEmisionNotaCredito(): void {
    const fac = this.facturaParaNc();
    if (!fac) return;

    const lineasValidas = this.lineasNc().filter((l) => Number(l.cantidad_devolver) > 0);
    if (lineasValidas.length === 0 && this.ncMotivo !== 'AJUSTE_PRECIO_DESCUENTO') {
      this.notification.warning('Atención', 'Debe indicar al menos una cantidad mayor a cero para devolver.');
      return;
    }

    const payload: CreateNotaCreditoDto = {
      factura_id: fac.id,
      fecha_emision: new Date().toISOString().split('T')[0],
      motivo_dian: this.ncMotivo as any,
      tipo_reembolso: this.ncTipoReembolso as any,
      observaciones: this.ncObservaciones,
      lineas: this.lineasNc().map((l) => ({
        articulo_id: l.articulo_id,
        bodega_id: l.bodega_id,
        cantidad: Number(l.cantidad_devolver),
        precio_unitario: Number(l.precio_unitario),
        tarifa_iva: Number(l.tarifa_iva),
        tarifa_inc: Number(l.tarifa_inc),
      })),
    };

    this.guardandoNc.set(true);
    this.ventasService.emitirNotaCredito(payload).subscribe({
      next: (nc) => {
        this.guardandoNc.set(false);
        this.modalNotaCreditoVisible.set(false);
        this.notification.success(
          'Nota Crédito Emitida',
          `Nota Crédito ${nc.consecutivo} emitida y contabilizada exitosamente bajo norma NIIF.`
        );
        this.cargarFacturas();
        this.abrirDetalleNc(nc);
      },
      error: (err) => {
        this.guardandoNc.set(false);
        this.notification.error('Error al emitir Nota Crédito', err.error?.message || 'Error inesperado');
      },
    });
  }

  abrirDetalleNc(nc: NotaCreditoVentaItem): void {
    this.ventasService.obtenerNotaCredito(nc.id).subscribe({
      next: (completa) => {
        this.ncSeleccionada.set(completa);
        this.modalDetalleNcVisible.set(true);
      },
      error: () => {
        this.ncSeleccionada.set(nc);
        this.modalDetalleNcVisible.set(true);
      },
    });
  }

  imprimirFactura(fac: FacturaVentaItem): void {
    this.abrirDetalle(fac);
    setTimeout(() => {
      window.print();
    }, 350);
  }

  imprimirNc(nc: NotaCreditoVentaItem): void {
    this.abrirDetalleNc(nc);
    setTimeout(() => {
      window.print();
    }, 350);
  }
}
