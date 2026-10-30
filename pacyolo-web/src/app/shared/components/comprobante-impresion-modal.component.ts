import { Component, computed, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { imprimirElementoAislado, ESTILOS_IMPRESION_CORPORATIVA } from '../../core/utils/print.util';

export function numeroALetras(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) return 'CERO PESOS M/CTE';
  const enteros = Math.floor(Math.abs(valor));

  function unidades(num: number): string {
    switch (num) {
      case 1: return 'UN';
      case 2: return 'DOS';
      case 3: return 'TRES';
      case 4: return 'CUATRO';
      case 5: return 'CINCO';
      case 6: return 'SEIS';
      case 7: return 'SIETE';
      case 8: return 'OCHO';
      case 9: return 'NUEVE';
      default: return '';
    }
  }

  function decenas(num: number): string {
    const decena = Math.floor(num / 10);
    const unidad = num - decena * 10;
    switch (decena) {
      case 1:
        switch (unidad) {
          case 0: return 'DIEZ';
          case 1: return 'ONCE';
          case 2: return 'DOCE';
          case 3: return 'TRECE';
          case 4: return 'CATORCE';
          case 5: return 'QUINCE';
          default: return 'DIECI' + unidades(unidad);
        }
      case 2:
        if (unidad === 0) return 'VEINTE';
        return 'VEINTI' + unidades(unidad);
      case 3: return 'TREINTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 4: return 'CUARENTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 5: return 'CINCUENTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 6: return 'SESENTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 7: return 'SETENTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 8: return 'OCHENTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 9: return 'NOVENTA' + (unidad > 0 ? ' Y ' + unidades(unidad) : '');
      case 0: return unidades(unidad);
      default: return '';
    }
  }

  function centenas(num: number): string {
    const centena = Math.floor(num / 100);
    const resto = num - centena * 100;
    switch (centena) {
      case 1:
        if (resto === 0) return 'CIEN';
        return 'CIENTO ' + decenas(resto);
      case 2: return 'DOSCIENTOS ' + decenas(resto);
      case 3: return 'TRESCIENTOS ' + decenas(resto);
      case 4: return 'CUATROCIENTOS ' + decenas(resto);
      case 5: return 'QUINIENTOS ' + decenas(resto);
      case 6: return 'SEISCIENTOS ' + decenas(resto);
      case 7: return 'SETECIENTOS ' + decenas(resto);
      case 8: return 'OCHOCIENTOS ' + decenas(resto);
      case 9: return 'NOVECIENTOS ' + decenas(resto);
      case 0: return decenas(resto);
      default: return '';
    }
  }

  if (enteros === 0) return 'CERO PESOS M/CTE';
  if (enteros === 1) return 'UN PESO M/CTE';

  const millones = Math.floor(enteros / 1000000);
  const miles = Math.floor((enteros - millones * 1000000) / 1000);
  const resto = enteros - millones * 1000000 - miles * 1000;

  let resultado = '';
  if (millones > 0) {
    if (millones === 1) {
      resultado += 'UN MILLÓN';
    } else {
      resultado += centenas(millones) + ' MILLONES';
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      resultado += (resultado ? ' ' : '') + 'MIL';
    } else {
      resultado += (resultado ? ' ' : '') + centenas(miles) + ' MIL';
    }
  }

  if (resto > 0) {
    resultado += (resultado ? ' ' : '') + centenas(resto);
  }

  return resultado.trim() + ' PESOS M/CTE';
}

@Component({
  selector: 'app-comprobante-impresion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible() && asiento()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <!-- Contenedor del documento -->
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col my-auto border border-slate-300">
          
          <!-- BARRA DE HERRAMIENTAS SUPERIOR (VISTA PREVIA EN PANTALLA) -->
          <div class="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-xl">🖨️</span>
              <span class="font-bold text-sm">Vista Previa de Impresión Oficial (Pilar 2 de Gobernanza)</span>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="imprimir()"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer">
                <span>Imprimir / Guardar PDF</span>
              </button>
              <button
                type="button"
                (click)="cerrar()"
                class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                ✕ Cerrar
              </button>
            </div>
          </div>

          <!-- DOCUMENTO FORMAL MEMBRETADO CORPORATIVO -->
          <div class="p-6 sm:p-8 overflow-y-auto max-h-[85vh] bg-white">
            <div id="documento-comprobante-oficial" class="doc-wrapper">
              
              <!-- 1. ENCABEZADO MEMBRETADO CON DATOS FISCALES -->
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

                <!-- CAJA DEL TIPO Y CONSECUTIVO DEL DOCUMENTO -->
                <div class="doc-consecutive-box">
                  <span class="doc-consecutive-badge">DOCUMENTO CONTABLE OFICIAL</span>
                  <span class="doc-consecutive-title">{{ nombreDocumento() }}</span>
                  <span class="doc-consecutive-number">No. {{ asiento()?.numero_comprobante }}</span>
                </div>
              </div>

              <!-- 2. DATOS DE IDENTIFICACIÓN DE LA TRANSACCIÓN -->
              <div class="doc-meta-grid">
                <div>
                  <span class="meta-item-label">Fecha Contable</span>
                  <span class="meta-item-value mono">{{ asiento()?.fecha_contable }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Tipo Comprobante</span>
                  <span class="meta-item-value mono">{{ asiento()?.tipo_comprobante }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Valor Total</span>
                  <span class="meta-item-value mono">$ {{ montoTotal() | number:'1.2-2' }}</span>
                </div>
                <div>
                  <span class="meta-item-label">Estado</span>
                  <span class="meta-status-badge">{{ asiento()?.estado || 'CONTABILIZADO' }}</span>
                </div>
              </div>

              <!-- BENEFICIARIO / TERCERO Y VALOR EN LETRAS -->
              <div class="doc-concept-card">
                <div class="concept-row">
                  <div>
                    <span class="concept-label">Beneficiario / Tercero:</span>
                    <span class="concept-text">{{ nombreTerceroPrincipal() }}</span>
                  </div>
                  <div>
                    <span class="concept-label">Identificación / NIT:</span>
                    <span class="concept-text font-mono">{{ nitTerceroPrincipal() }}</span>
                  </div>
                </div>
                <div>
                  <span class="concept-label">Por Concepto De (Glosa):</span>
                  <span class="concept-text" style="font-weight: 500; font-style: italic;">{{ asiento()?.glosa_general }}</span>
                </div>
                <div class="amount-words-box">
                  <span style="color: #64748b; font-weight: 500;">SON: </span>
                  {{ valorEnLetras() }}
                </div>
              </div>

              <!-- 3. TABLA DE PARTIDA DOBLE Y DESGLOSE NIIF -->
              <div class="doc-table-card">
                <table class="doc-table">
                  <thead>
                    <tr>
                      <th style="width: 14%;" class="font-mono">Código PUC</th>
                      <th style="width: 36%;">Nombre de Cuenta Contable</th>
                      <th style="width: 26%;">Tercero / Referencia</th>
                      <th style="width: 12%;" class="text-right font-mono">Débito</th>
                      <th style="width: 12%;" class="text-right font-mono">Crédito</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (linea of asiento()?.lineas || []; track linea.id || $index) {
                      <tr>
                        <td class="font-mono" style="font-weight: 700; color: #0f172a;">{{ linea.cuenta?.codigo }}</td>
                        <td>
                          <div style="font-weight: 600; color: #0f172a;">{{ linea.cuenta?.nombre }}</div>
                          @if (linea.glosa_detalle && linea.glosa_detalle !== asiento()?.glosa_general) {
                            <div style="font-size: 8px; color: #64748b; font-style: italic;">{{ linea.glosa_detalle }}</div>
                          }
                        </td>
                        <td style="font-size: 9px;">
                          {{ linea.tercero?.numero_identificacion || linea.tercero?.numero_documento || '' }}
                          {{ linea.documento_referencia ? ' (' + linea.documento_referencia + ')' : '' }}
                        </td>
                        <td class="text-right font-mono" style="font-weight: 600;">
                          {{ Number(linea.debito) > 0 ? ('$' + (Number(linea.debito) | number:'1.2-2')) : '-' }}
                        </td>
                        <td class="text-right font-mono" style="font-weight: 600;">
                          {{ Number(linea.credito) > 0 ? ('$' + (Number(linea.credito) | number:'1.2-2')) : '-' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-right" style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Sumas Iguales (Partida Doble NIIF):
                      </td>
                      <td class="text-right font-mono" style="font-size: 11px; color: #166534;">
                        $ {{ Number(asiento()?.total_debito || montoTotal()) | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono" style="font-size: 11px; color: #166534;">
                        $ {{ Number(asiento()?.total_credito || montoTotal()) | number:'1.2-2' }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- 4. PISTAS DE AUDITORÍA & CUADRO DE FIRMAS REGLAMENTARIAS -->
              <div class="doc-signatures-section">
                <span class="signatures-title">
                  Pistas de Auditoría & Cuadro Reglamentario de Firmas (Control Interno NIIF)
                </span>
                <div class="signatures-grid">
                  
                  <div class="signature-box">
                    <span class="signature-role">1. Elaboró</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">{{ usuarioActual()?.nombres || 'Operador Contable' }}</span>
                      <span class="signature-meta">{{ asiento()?.fecha_contable }}</span>
                    </div>
                  </div>

                  <div class="signature-box">
                    <span class="signature-role">2. Revisó</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">Contador Público</span>
                      <span class="signature-meta">T.P. No. ____________</span>
                    </div>
                  </div>

                  <div class="signature-box">
                    <span class="signature-role">3. Aprobó</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">Gerencia / Tesorería</span>
                      <span class="signature-meta">Firma Autorizada</span>
                    </div>
                  </div>

                  <div class="signature-box">
                    <span class="signature-role">4. Recibí Conforme</span>
                    <div class="signature-line"></div>
                    <div>
                      <span class="signature-name">{{ nombreTerceroPrincipal() || 'Beneficiario' }}</span>
                      <span class="signature-meta">C.C. / Fecha: _________</span>
                    </div>
                  </div>

                </div>
              </div>

              <!-- PIE DE PÁGINA DOCUMENTAL -->
              <div class="doc-footer">
                <span>PACYOLO ERP Ledger NIIF — Documento Contable Inmutable Auditado</span>
                <span>Generado: {{ fechaActual() }}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    }
  `,
  
})
export class ComprobanteImpresionModalComponent {
  private readonly authService = inject(AuthService);

  readonly visible = model<boolean>(false);
  readonly asiento = input<any | null>(null);
  readonly tituloPersonalizado = input<string>('');

  readonly Number = Number;

  readonly empresa = computed(() => this.authService.empresaActiva());
  readonly usuarioActual = computed(() => this.authService.usuario());

  readonly nombreDocumento = computed(() => {
    if (this.tituloPersonalizado()) return this.tituloPersonalizado();
    const tipo = this.asiento()?.tipo_comprobante;
    switch (tipo) {
      case 'EGR': return 'COMPROBANTE DE EGRESO';
      case 'ING': return 'RECIBO DE CAJA / COMPROBANTE DE INGRESO';
      case 'FAC': return 'COMPROBANTE DE FACTURACIÓN DE VENTA';
      case 'NC': return 'NOTA CRÉDITO COMERCIAL Y CONTABLE';
      case 'ND': return 'NOTA DÉBITO BANCARIA / COMERCIAL';
      case 'CAU': return 'COMPROBANTE DE CAUSACIÓN CONTABLE';
      case 'CIE': return 'COMPROBANTE DE CIERRE CONTABLE NIIF';
      case 'CD': return 'COMPROBANTE DE DIARIO';
      default: return 'COMPROBANTE CONTABLE OFICIAL';
    }
  });

  readonly montoTotal = computed(() => {
    const a = this.asiento();
    if (!a) return 0;
    const deb = Number(a.total_debito || 0);
    const cred = Number(a.total_credito || 0);
    if (deb > 0) return deb;
    if (cred > 0) return cred;
    if (a.lineas && Array.isArray(a.lineas)) {
      return a.lineas.reduce((acc: number, l: any) => acc + Number(l.debito || 0), 0);
    }
    return 0;
  });

  readonly valorEnLetras = computed(() => numeroALetras(this.montoTotal()));

  readonly nombreTerceroPrincipal = computed(() => {
    const a = this.asiento();
    if (!a?.lineas || a.lineas.length === 0) return 'Varios / General';
    for (const l of a.lineas) {
      if (l.tercero) {
        return l.tercero.nombre_completo || l.tercero.razon_social || l.tercero.nombres || 'Beneficiario';
      }
    }
    return 'Varios / General';
  });

  readonly nitTerceroPrincipal = computed(() => {
    const a = this.asiento();
    if (!a?.lineas || a.lineas.length === 0) return 'N/A';
    for (const l of a.lineas) {
      if (l.tercero) {
        return l.tercero.numero_identificacion || l.tercero.numero_documento || 'N/A';
      }
    }
    return 'N/A';
  });

  readonly fechaActual = computed(() => new Date().toLocaleString('es-CO'));

  imprimir(): void {
    const num = this.asiento()?.numero_comprobante || '';
    imprimirElementoAislado('documento-comprobante-oficial', `${this.nombreDocumento()} No. ${num}`);
  }

  cerrar(): void {
    this.visible.set(false);
  }
}
