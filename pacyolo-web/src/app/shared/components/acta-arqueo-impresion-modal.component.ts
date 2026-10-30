import { Component, computed, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ArqueoCajaMenorItem, CajaMenorItem } from '../../core/services/tesoreria.service';
import { imprimirElementoAislado, ESTILOS_IMPRESION_CORPORATIVA } from '../../core/utils/print.util';

@Component({
  selector: 'app-acta-arqueo-impresion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible() && arqueo()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <!-- Contenedor del documento -->
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col my-auto border border-slate-300">
          
          <!-- BARRA DE HERRAMIENTAS (SE OCULTA AL IMPRIMIR) -->
          <div class="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-xl">⚖️</span>
              <span class="font-bold text-sm">Acta Oficial de Arqueo Físico (Pilar 2 de Gobernanza)</span>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="imprimir()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
                <span>🖨️ Imprimir / Guardar PDF</span>
              </button>
              <button
                type="button"
                (click)="cerrar()"
                class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                ✕ Cerrar
              </button>
            </div>
          </div>

          <!-- DOCUMENTO FORMAL MEMBRETADO -->
          <div class="p-6 sm:p-8 overflow-y-auto max-h-[85vh] bg-white">
            <div id="documento-acta-arqueo-oficial" class="doc-wrapper">
              
              <!-- 1. ENCABEZADO MEMBRETADO -->
              <div class="doc-header">
                <div>
                  <div class="company-brand">
                    <div class="company-logo">PY</div>
                    <h1 class="company-title">
                      {{ empresa()?.razon_social || 'EMPRESA CONTABLE DEMO S.A.S.' }}
                    </h1>
                  </div>
                  <div class="company-tax-info">
                    <p><b>NIT:</b> {{ empresa()?.nit || '900.123.456-7' }} — Régimen Ordinario</p>
                    <p><b>Dirección:</b> Carrera 10 # 72-15, Oficina 402 | Bogotá D.C., Colombia</p>
                    <p><b>Teléfono:</b> (601) 345-6789 | <b>Email:</b> contabilidad&#64;pacyolo.com</p>
                  </div>
                </div>

                <!-- CAJA DEL CONSECUTIVO Y FECHA -->
                <div class="doc-consecutive-box">
                  <span class="doc-consecutive-badge">ACTA DE AUDITORÍA FÍSICA</span>
                  <span class="doc-consecutive-title">ARQUEO DE CAJA MENOR</span>
                  <span class="doc-consecutive-number">No. {{ arqueo()?.consecutivo || 'ARQ-0001' }}</span>
                </div>
              </div>

              <!-- 2. DATOS DE IDENTIFICACIÓN DE LA CAJA Y CUSTODIO -->
              <div class="doc-meta-grid">
                <div>
                  <span class="meta-item-label">Caja Menor / Fondo</span>
                  <span class="meta-item-value">{{ caja()?.codigo }} - {{ caja()?.nombre }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Custodio / Responsable</span>
                  <span class="meta-item-value">{{ caja()?.responsable?.nombre_completo || arqueo()?.custodio?.nombre_completo || 'Custodio Asignado' }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Auditor / Revisor</span>
                  <span class="meta-item-value">{{ nombreAuditor() }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Fondo Fijo Asignado</span>
                  <span class="meta-item-value mono">$ {{ (arqueo()?.monto_fondo_fijo || caja()?.monto_fondo_fijo || 0) | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- 3. DESGLOSE FÍSICO DE MONEDAS Y BILLETES -->
              <div class="doc-table-card">
                <table class="doc-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Denominación</th>
                      <th style="width: 25%;" class="text-center">Tipo de Especie</th>
                      <th style="width: 25%;" class="text-center">Cantidad Física Recontada</th>
                      <th style="width: 25%;" class="text-right">Subtotal Pesos</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (den of denominacionesBilletes; track den.valor) {
                      <tr>
                        <td class="font-mono" style="font-weight: 700; color: #0f172a;">$ {{ den.valor | number:'1.0-0' }}</td>
                        <td class="text-center" style="color: #475569;">Papel Moneda (Billete)</td>
                        <td class="text-center font-mono" style="font-weight: 700; color: #0f172a;">{{ obtenerCantidad(den.clave) }}</td>
                        <td class="text-right font-mono" style="font-weight: 700; color: #0f172a;">
                          $ {{ (obtenerCantidad(den.clave) * den.valor) | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                    <tr>
                      <td class="font-mono" style="font-weight: 700; color: #0f172a;">Monedas y Fracciones</td>
                      <td class="text-center" style="color: #475569;">Moneda Metálica</td>
                      <td class="text-center" style="color: #94a3b8;">-</td>
                      <td class="text-right font-mono" style="font-weight: 700; color: #0f172a;">
                        $ {{ obtenerMonedas() | number:'1.2-2' }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-right" style="font-size: 9px; text-transform: uppercase;">Total Efectivo Físico Arqueado:</td>
                      <td class="text-right font-mono" style="font-size: 11px; color: #166534;">
                        $ {{ (arqueo()?.total_efectivo_fisico || 0) | number:'1.2-2' }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- 4. BALANCE GENERAL DE ARQUEO Y DIAGNÓSTICO -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <!-- Cuadro de Balance -->
                <div class="doc-concept-card" style="margin-bottom: 0;">
                  <span class="meta-item-label" style="border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">Cuadratura del Fondo</span>
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; line-height: 1.6;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #64748b;">(+) Total Efectivo Físico:</span>
                      <span style="font-weight: 700;">$ {{ (arqueo()?.total_efectivo_fisico || 0) | number:'1.2-2' }}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #64748b;">(+) Total Vales / Soportes:</span>
                      <span style="font-weight: 700;">$ {{ (arqueo()?.total_vales_comprobantes || 0) | number:'1.2-2' }}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 2px; font-weight: 800; color: #1e3a8a;">
                      <span>(=) Total Fondo Recontado:</span>
                      <span>$ {{ (arqueo()?.total_fondo_contado || 0) | number:'1.2-2' }}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: #64748b;">
                      <span>(-) Monto Fondo Fijo:</span>
                      <span>$ {{ (arqueo()?.monto_fondo_fijo || 0) | number:'1.2-2' }}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 2px solid #0f172a; padding-top: 3px; font-weight: 900; font-size: 11px;">
                      <span>Diferencia Resultante:</span>
                      <span [style.color]="arqueo()?.resultado === 'FALTANTE' ? '#b91c1c' : arqueo()?.resultado === 'SOBRANTE' ? '#b45309' : '#15803d'">
                        $ {{ (arqueo()?.diferencia || 0) | number:'1.2-2' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Dictamen de Auditoría -->
                <div class="doc-concept-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <span class="meta-item-label" style="border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">Dictamen de Auditoría</span>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                      <span style="font-size: 10px; font-weight: 700;">Resultado:</span>
                      <span
                        class="meta-status-badge"
                        [style.background]="arqueo()?.resultado === 'CUADRADO' ? '#dcfce7' : arqueo()?.resultado === 'FALTANTE' ? '#fee2e2' : '#fef3c7'"
                        [style.color]="arqueo()?.resultado === 'CUADRADO' ? '#166534' : arqueo()?.resultado === 'FALTANTE' ? '#991b1b' : '#92400e'"
                        [style.borderColor]="arqueo()?.resultado === 'CUADRADO' ? '#bbf7d0' : arqueo()?.resultado === 'FALTANTE' ? '#fecaca' : '#fde68a'">
                        {{ arqueo()?.resultado }}
                      </span>
                    </div>
                    <div style="font-size: 9.5px; color: #334155;">
                      <p style="font-weight: 700;">Observaciones:</p>
                      <p style="font-style: italic; margin-top: 2px;">{{ arqueo()?.observaciones || 'Sin observaciones registradas durante la práctica del arqueo.' }}</p>
                    </div>
                  </div>

                  <div style="font-size: 8px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 6px;">
                    <b>Control Interno:</b> El custodio manifiesta haber recibido a entera satisfacción el total de los fondos y comprobantes recontados.
                  </div>
                </div>
              </div>

              <!-- 5. FIRMAS REGLAMENTARIAS DE AUDITORÍA -->
              <div class="doc-signatures-section">
                <span class="signatures-title">Legalización y Suscripción del Acta (3 Firmas Reglamentarias):</span>
                <div class="signatures-grid cols-3">
                  
                  <div class="signature-box">
                    <span class="signature-role">1. Custodio del Fondo</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">{{ caja()?.responsable?.nombre_completo || arqueo()?.custodio?.nombre_completo || 'Custodio Responsable' }}</span>
                      <span class="signature-meta">C.C. {{ caja()?.responsable?.numero_identificacion || '________________' }}</span>
                    </div>
                  </div>

                  <div class="signature-box">
                    <span class="signature-role">2. Auditor / Revisor</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">{{ nombreAuditor() }}</span>
                      <span class="signature-meta">T.P. No. / C.C. ________________</span>
                    </div>
                  </div>

                  <div class="signature-box">
                    <span class="signature-role">3. Aprobó (Gerencia)</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">Representante Legal / Gerencia</span>
                      <span class="signature-meta">Firma y Sello</span>
                    </div>
                  </div>

                </div>
              </div>

              <!-- PIE DE PÁGINA -->
              <div class="doc-footer">
                <span>PACYOLO ERP Tesorería & Auditoría — Acta Inmutable Sometida a Pistas de Auditoría</span>
                <span>Generado: {{ fechaActual() }}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    }
  `,
  
})
export class ActaArqueoImpresionModalComponent {
  private readonly authService = inject(AuthService);

  readonly visible = model<boolean>(false);
  readonly arqueo = input<ArqueoCajaMenorItem | null>(null);
  readonly caja = input<CajaMenorItem | null>(null);

  readonly empresa = computed(() => this.authService.empresaActiva());
  readonly usuarioActual = computed(() => this.authService.usuario());
  readonly fechaActual = computed(() => new Date().toLocaleString('es-CO'));

  readonly nombreAuditor = computed(() => {
    const u = this.usuarioActual();
    if (!u) return 'Auditor General';
    const fullName = (u.nombres || '') + ' ' + (u.apellidos || '');
    return fullName.trim() || u.email || 'Auditor General';
  });

  readonly denominacionesBilletes = [
    { valor: 100000, clave: '100000' },
    { valor: 50000, clave: '50000' },
    { valor: 20000, clave: '20000' },
    { valor: 10000, clave: '10000' },
    { valor: 5000, clave: '5000' },
    { valor: 2000, clave: '2000' },
  ];

  obtenerCantidad(clave: string): number {
    const desglose = this.arqueo()?.desglose_efectivo;
    if (!desglose) return 0;
    return Number(desglose[clave] || 0);
  }

  obtenerMonedas(): number {
    const desglose = this.arqueo()?.desglose_efectivo;
    if (!desglose) return 0;
    return Number(desglose['monedas'] || 0);
  }

  imprimir(): void {
    const consecutivo = this.arqueo()?.consecutivo || 'ARQ';
    imprimirElementoAislado('documento-acta-arqueo-oficial', `Acta Oficial de Arqueo No. ${consecutivo}`);
  }

  cerrar(): void {
    this.visible.set(false);
  }
}
