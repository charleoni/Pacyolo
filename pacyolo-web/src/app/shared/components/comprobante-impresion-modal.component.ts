import { Component, computed, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
        <!-- Contenedor del documento -->
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col my-auto border border-slate-300 print:border-none">
          
          <!-- BARRA DE HERRAMIENTAS SUPERIOR (SE OCULTA AL IMPRIMIR) -->
          <div class="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 print:hidden">
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

          <!-- DOCUMENTO FORMAL MEMBRETADO (A4 / CARTA) -->
          <div class="p-8 sm:p-10 font-sans text-xs space-y-6 print:p-4">
            
            <!-- 1. ENCABEZADO MEMBRETADO CON DATOS FISCALES -->
            <div class="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded bg-slate-900 text-white font-black flex items-center justify-center text-sm print:border print:border-black">
                    PY
                  </div>
                  <h1 class="text-lg font-black tracking-tight text-slate-900 uppercase">
                    {{ empresa()?.razon_social || 'EMPRESA CONTABLE DEMO S.A.S.' }}
                  </h1>
                </div>
                <div class="text-[11px] text-slate-600 space-y-0.5">
                  <p><b>NIT:</b> {{ empresa()?.nit || '900.123.456-7' }} — Régimen Ordinario</p>
                  <p><b>Dirección:</b> Carrera 10 # 72-15, Oficina 402 | Bogotá D.C., Colombia</p>
                  <p><b>Teléfono:</b> (601) 345-6789 | <b>Email:</b> contabilidad&#64;pacyolo.com</p>
                </div>
              </div>

              <!-- CAJA DEL TIPO Y CONSECUTIVO DEL DOCUMENTO -->
              <div class="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-center min-w-[220px] print:bg-white">
                <span class="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">DOCUMENTO OFICIAL</span>
                <span class="text-sm font-black text-slate-900 block leading-tight mt-0.5">
                  {{ nombreDocumento() }}
                </span>
                <span class="text-base font-mono font-bold text-indigo-700 block mt-1 print:text-black">
                  No. {{ asiento()?.numero_comprobante }}
                </span>
              </div>
            </div>

            <!-- 2. DATOS DE IDENTIFICACIÓN DE LA TRANSACCIÓN -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 print:bg-white print:border-slate-400">
              <div>
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Fecha Contable</span>
                <span class="font-mono font-bold text-slate-800">{{ asiento()?.fecha_contable }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Tipo Comprobante</span>
                <span class="font-bold text-slate-800">{{ asiento()?.tipo_comprobante }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Valor Total</span>
                <span class="font-mono font-black text-slate-900">\${{ montoTotal() | number:'1.2-2' }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Estado</span>
                <span class="font-bold text-emerald-700 print:text-black">{{ asiento()?.estado || 'ASENTADO' }}</span>
              </div>
            </div>

            <!-- BENEFICIARIO / TERCERO Y VALOR EN LETRAS -->
            <div class="border border-slate-300 rounded-xl p-3.5 space-y-2 print:border-slate-400">
              <div class="flex flex-col sm:flex-row justify-between gap-1">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-500">Beneficiario / Tercero:</span>
                  <span class="font-bold text-slate-900 ml-1.5">{{ nombreTerceroPrincipal() }}</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-500">Identificación / NIT:</span>
                  <span class="font-mono font-bold text-slate-900 ml-1.5">{{ nitTerceroPrincipal() }}</span>
                </div>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-500">Por Concepto De (Glosa):</span>
                <span class="text-slate-800 ml-1.5 italic">{{ asiento()?.glosa_general }}</span>
              </div>
              <div class="bg-slate-100 p-2 rounded-lg font-mono text-[11px] font-bold text-slate-800 print:bg-slate-100/50">
                <span class="text-slate-500 font-sans font-normal">SON: </span>
                {{ valorEnLetras() }}
              </div>
            </div>

            <!-- 3. TABLA DE PARTIDA DOBLE Y DESGLOSE NIIF -->
            <div class="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
              <table class="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr class="bg-slate-900 text-white print:bg-slate-200 print:text-slate-900 border-b border-slate-300 font-bold text-[10px] uppercase">
                    <th class="p-2.5 font-mono">Código PUC</th>
                    <th class="p-2.5">Nombre de Cuenta Contable</th>
                    <th class="p-2.5">Tercero / Ref</th>
                    <th class="p-2.5 text-right font-mono">Débito</th>
                    <th class="p-2.5 text-right font-mono">Crédito</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 text-slate-700">
                  @for (linea of asiento()?.lineas || []; track linea.id || $index) {
                    <tr class="hover:bg-slate-50">
                      <td class="p-2.5 font-mono font-bold text-slate-900">{{ linea.cuenta?.codigo }}</td>
                      <td class="p-2.5">
                        <div class="font-medium text-slate-900">{{ linea.cuenta?.nombre }}</div>
                        @if (linea.glosa_detalle && linea.glosa_detalle !== asiento()?.glosa_general) {
                          <div class="text-[10px] text-slate-500 italic">{{ linea.glosa_detalle }}</div>
                        }
                      </td>
                      <td class="p-2.5 text-[10px]">
                        {{ linea.tercero?.numero_identificacion || linea.tercero?.numero_documento || '' }}
                        {{ linea.documento_referencia ? ' (' + linea.documento_referencia + ')' : '' }}
                      </td>
                      <td class="p-2.5 text-right font-mono font-medium">
                        {{ Number(linea.debito) > 0 ? ('$' + (Number(linea.debito) | number:'1.2-2')) : '-' }}
                      </td>
                      <td class="p-2.5 text-right font-mono font-medium">
                        {{ Number(linea.credito) > 0 ? ('$' + (Number(linea.credito) | number:'1.2-2')) : '-' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-900 print:bg-slate-100">
                    <td colspan="3" class="p-2.5 text-right uppercase tracking-wider text-[10px]">
                      Sumas Iguales (Partida Doble NIIF):
                    </td>
                    <td class="p-2.5 text-right font-mono font-black text-emerald-800 print:text-black">
                      \${{ Number(asiento()?.total_debito || montoTotal()) | number:'1.2-2' }}
                    </td>
                    <td class="p-2.5 text-right font-mono font-black text-emerald-800 print:text-black">
                      \${{ Number(asiento()?.total_credito || montoTotal()) | number:'1.2-2' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- 4. LOS 4 BLOQUES DE FIRMAS REGLAMENTARIAS DE GOBERNANZA -->
            <div class="pt-6">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 block text-center">
                Pistas de Auditoría & Cuadro Reglamentario de Firmas (Control Interno NIIF)
              </span>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <!-- Caja 1: Elaboró -->
                <div class="border border-slate-300 rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[95px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">1. Elaboró</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block truncate">{{ usuarioActual()?.nombres || 'Operador Contable' }}</span>
                    <span class="text-[9px] text-slate-500 font-mono block">{{ asiento()?.fecha_contable }}</span>
                  </div>
                </div>

                <!-- Caja 2: Revisó -->
                <div class="border border-slate-300 rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[95px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">2. Revisó</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block">Contador Público</span>
                    <span class="text-[9px] text-slate-500 font-mono block">T.P. No. ____________</span>
                  </div>
                </div>

                <!-- Caja 3: Aprobó -->
                <div class="border border-slate-300 rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[95px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">3. Aprobó</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block">Gerencia / Tesorería</span>
                    <span class="text-[9px] text-slate-500 font-mono block">Firma Autorizada</span>
                  </div>
                </div>

                <!-- Caja 4: Recibió Conforme -->
                <div class="border border-slate-300 rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[95px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">4. Recibí Conforme</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block truncate">{{ nombreTerceroPrincipal() || 'Beneficiario' }}</span>
                    <span class="text-[9px] text-slate-500 font-mono block">C.C. / Fecha: _________</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- PIE DE PÁGINA DOCUMENTAL -->
            <div class="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-500 print:pt-2">
              <span>PACYOLO ERP Ledger NIIF — Documento Contable Inmutable Auditado</span>
              <span>Generado: {{ fechaActual() }}</span>
            </div>

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @media print {
      body * {
        visibility: hidden;
      }
      .print\\:fixed, .print\\:fixed * {
        visibility: visible;
      }
      .print\\:fixed {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
    }
  `],
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
    // Si no tiene totales calculados, sumar lineas
    if (a.lineas && Array.isArray(a.lineas)) {
      const sum = a.lineas.reduce((acc: number, l: any) => acc + Number(l.debito || 0), 0);
      return sum;
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
    window.print();
  }

  cerrar(): void {
    this.visible.set(false);
  }
}
