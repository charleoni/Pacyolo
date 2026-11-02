import { Component, computed, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { imprimirElementoAislado, ESTILOS_IMPRESION_CORPORATIVA } from '../../core/utils/print.util';
import { numeroALetras } from './comprobante-impresion-modal.component';
import { GastoCajaMenorItem, CajaMenorItem } from '../../core/services/tesoreria.service';

@Component({
  selector: 'app-vale-caja-menor-impresion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <!-- Barra Superior del Modal -->
          <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🧾</span>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <span>Recibo de Caja Menor {{ vale()?.consecutivo }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    [class]="vale()?.estado === 'REEMBOLSADO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'">
                    {{ vale()?.estado }}
                  </span>
                </h3>
                <p class="text-xs text-slate-400">Comprobante oficial de desembolso físico de efectivo bajo NIIF</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="imprimir()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span>
                <span>Imprimir Recibo</span>
              </button>
              <button
                type="button"
                (click)="visible.set(false)"
                class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>
          </div>

          <!-- Contenedor del Documento Oficial -->
          <div class="p-6 overflow-y-auto bg-slate-950/40 flex justify-center">
            <div id="documento-vale-caja-oficial" class="documento-corporativo-hoja bg-white text-slate-900 shadow-xl">
              <!-- Encabezado Membretado Oficial -->
              <div class="doc-header">
                <div>
                  <h1 class="doc-company-name">{{ empresa()?.razon_social || 'EMPRESA REGISTRADA' }}</h1>
                  <p class="doc-company-nit">NIT: {{ empresa()?.nit || 'N/A' }}</p>
                  <p class="doc-company-details">Sistema Contable & ERP PACYOLO — Fondo Fijo de Caja Menor</p>
                </div>
                <div class="doc-title-block">
                  <h2 class="doc-title">RECIBO DE CAJA MENOR</h2>
                  <div class="doc-number-badge">
                    <span class="doc-badge-label">NÚMERO OFICIAL</span>
                    <span class="doc-badge-value">{{ vale()?.consecutivo }}</span>
                  </div>
                </div>
              </div>

              <!-- Metadatos del Recibo -->
              <div class="doc-meta-grid">
                <div>
                  <span class="meta-item-label">Fecha de Desembolso</span>
                  <span class="meta-item-value mono">{{ vale()?.fecha_gasto }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Caja Menor / Fondo</span>
                  <span class="meta-item-value">{{ caja()?.codigo || 'CM' }} — {{ caja()?.nombre || 'Caja Menor' }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Custodio / Responsable</span>
                  <span class="meta-item-value">{{ caja()?.responsable?.nombre_completo || 'Custodio Asignado' }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Soporte Anexo / Factura</span>
                  <span class="meta-item-value mono">{{ vale()?.soporte_factura_ref || 'COMPROBANTE PROVISIONAL' }}</span>
                </div>
              </div>

              <!-- Información del Beneficiario -->
              <div class="doc-concept-card">
                <span class="meta-item-label">Pagado en Efectivo a</span>
                <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                  {{ vale()?.tercero?.razon_social || vale()?.tercero?.nombre_completo || 'Tercero Beneficiario' }}
                  <span style="font-weight: 500; color: #475569; margin-left: 8px;">
                    (Identificación / NIT: {{ vale()?.tercero?.numero_identificacion || 'S/D' }})
                  </span>
                </div>
              </div>

              <!-- Concepto / Objeto del Gasto -->
              <div class="doc-concept-card">
                <span class="meta-item-label">Por Concepto Detallado de</span>
                <p class="doc-concept-text" style="font-size: 11px; line-height: 1.5; color: #1e293b; margin-top: 3px;">
                  {{ vale()?.concepto }}
                </p>
              </div>

              <!-- Liquidación del Valor -->
              <div class="doc-table-card" style="margin-bottom: 15px;">
                <table class="doc-table">
                  <thead>
                    <tr>
                      <th style="width: 50%;">Descripción / Rubro</th>
                      <th style="width: 25%;" class="text-right">Tarifa / Detalle</th>
                      <th style="width: 25%;" class="text-right">Valor Pesos ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Subtotal Base del Gasto</strong>
                        <div style="font-size: 9px; color: #64748b;">Desembolso neto en efectivo</div>
                      </td>
                      <td class="text-right font-mono">-</td>
                      <td class="text-right font-mono" style="font-weight: 600;">
                        $ {{ (vale()?.subtotal || vale()?.total || 0) | number:'1.2-2' }}
                      </td>
                    </tr>
                    @if (vale()?.iva && Number(vale()?.iva) > 0) {
                      <tr>
                        <td>Impuesto sobre las Ventas (IVA)</td>
                        <td class="text-right font-mono">Discriminado</td>
                        <td class="text-right font-mono">$ {{ Number(vale()?.iva) | number:'1.2-2' }}</td>
                      </tr>
                    }
                    @if (vale()?.retefuente && Number(vale()?.retefuente) > 0) {
                      <tr>
                        <td>Retención en la Fuente Deducida</td>
                        <td class="text-right font-mono">Deducción</td>
                        <td class="text-right font-mono" style="color: #b91c1c;">- $ {{ Number(vale()?.retefuente) | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" class="text-right" style="font-size: 10px; font-weight: 800; text-transform: uppercase;">
                        TOTAL EFECTIVO DESEMBOLSADO:
                      </td>
                      <td class="text-right font-mono" style="font-size: 13px; font-weight: 900; color: #166534;">
                        $ {{ Number(vale()?.total || 0) | number:'1.2-2' }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Valor en Letras -->
              <div class="doc-concept-card" style="background-color: #f8fafc; border-left: 3px solid #166534;">
                <span class="meta-item-label">Valor en Letras</span>
                <p style="font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-top: 2px;">
                  SON: {{ valorEnLetras() }}
                </p>
              </div>

              <!-- Firmas de Responsabilidad Legal -->
              <div class="doc-signatures-grid" style="margin-top: 30px;">
                <div class="doc-signature-box">
                  <div class="doc-signature-line">
                    <span class="doc-sig-name">{{ caja()?.responsable?.nombre_completo || 'Custodio Caja Menor' }}</span>
                    <span class="doc-sig-role">AUTORIZÓ / ENTREGÓ EFECTIVO</span>
                    <span class="doc-sig-doc">Custodio Fondo Fijo</span>
                  </div>
                </div>

                <div class="doc-signature-box">
                  <div class="doc-signature-line">
                    <span class="doc-sig-name">{{ vale()?.tercero?.razon_social || vale()?.tercero?.nombre_completo || 'Beneficiario' }}</span>
                    <span class="doc-sig-role">RECIBÍ CONFORME</span>
                    <span class="doc-sig-doc">C.C. / NIT: {{ vale()?.tercero?.numero_identificacion || '___________________' }}</span>
                  </div>
                </div>
              </div>

              <!-- Pie de Auditoría del Documento -->
              <div class="doc-audit-footer" style="margin-top: 25px;">
                <span>PACYOLO ERP — Módulo de Tesorería & Caja Menor</span>
                <span>Impreso: {{ fechaImpresion }} — Documento Soporte Interno</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .documento-corporativo-hoja {
        width: 100%;
        max-width: 780px;
        padding: 24px 32px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        box-sizing: border-box;
      }
      .doc-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 12px;
        margin-bottom: 14px;
      }
      .doc-company-name {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -0.02em;
        text-transform: uppercase;
        margin: 0;
        color: #0f172a;
      }
      .doc-company-nit {
        font-size: 11px;
        font-weight: 600;
        color: #334155;
        margin: 2px 0 0 0;
      }
      .doc-company-details {
        font-size: 9px;
        color: #64748b;
        margin: 2px 0 0 0;
      }
      .doc-title-block {
        text-align: right;
      }
      .doc-title {
        font-size: 14px;
        font-weight: 900;
        color: #1e3a8a;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin: 0;
      }
      .doc-number-badge {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-end;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 3px 8px;
        border-radius: 6px;
        margin-top: 4px;
      }
      .doc-badge-label {
        font-size: 7.5px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
      }
      .doc-badge-value {
        font-size: 12px;
        font-weight: 800;
        color: #0f172a;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .doc-meta-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        border-radius: 6px;
        margin-bottom: 12px;
      }
      .meta-item-label {
        display: block;
        font-size: 8px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .meta-item-value {
        display: block;
        font-size: 10px;
        font-weight: 600;
        color: #0f172a;
        margin-top: 1px;
      }
      .meta-item-value.mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .doc-concept-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 12px;
      }
      .doc-table-card {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        overflow: hidden;
      }
      .doc-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5px;
      }
      .doc-table thead tr {
        background: #0f172a;
        color: #ffffff;
      }
      .doc-table th {
        padding: 6px 10px;
        font-weight: 700;
        font-size: 8.5px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .doc-table td {
        padding: 6px 10px;
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
      }
      .doc-table tfoot tr {
        background: #f8fafc;
        border-top: 2px solid #0f172a;
      }
      .doc-table tfoot td {
        padding: 6px 10px;
      }
      .doc-signatures-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
        margin-top: 25px;
      }
      .doc-signature-box {
        text-align: center;
      }
      .doc-signature-line {
        border-top: 1px solid #475569;
        padding-top: 6px;
      }
      .doc-sig-name {
        display: block;
        font-size: 9.5px;
        font-weight: 700;
        color: #0f172a;
      }
      .doc-sig-role {
        display: block;
        font-size: 8px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        margin-top: 1px;
      }
      .doc-sig-doc {
        display: block;
        font-size: 8px;
        color: #64748b;
        margin-top: 1px;
      }
      .doc-audit-footer {
        display: flex;
        justify-content: space-between;
        font-size: 7.5px;
        color: #94a3b8;
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        margin-top: 15px;
      }
    `,
  ],
})
export class ValeCajaMenorImpresionModalComponent {
  private readonly authService = inject(AuthService);

  readonly visible = model<boolean>(false);
  readonly vale = input<GastoCajaMenorItem | null>(null);
  readonly caja = input<CajaMenorItem | null>(null);

  readonly Number = Number;

  readonly empresa = computed(() => {
    const sesion = this.authService.empresaActiva();
    return {
      razon_social: sesion?.razon_social || 'EMPRESA REGISTRADA',
      nit: sesion?.nit || 'N/A',
    };
  });

  readonly valorEnLetras = computed(() => {
    const total = Number(this.vale()?.total || 0);
    return numeroALetras(total);
  });

  readonly fechaImpresion = new Date().toLocaleString('es-CO');

  imprimir(): void {
    const consecutivo = this.vale()?.consecutivo || 'VCM';
    imprimirElementoAislado('documento-vale-caja-oficial', `Recibo de Caja Menor No. ${consecutivo}`);
  }
}
