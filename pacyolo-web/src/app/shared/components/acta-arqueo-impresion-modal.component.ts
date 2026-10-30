import { Component, computed, inject, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ArqueoCajaMenorItem, CajaMenorItem } from '../../core/services/tesoreria.service';

@Component({
  selector: 'app-acta-arqueo-impresion-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible() && arqueo()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
        <!-- Contenedor del documento -->
        <div class="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col my-auto border border-slate-300 print:border-none">
          
          <!-- BARRA DE HERRAMIENTAS (SE OCULTA AL IMPRIMIR) -->
          <div class="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 print:hidden">
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
          <div class="p-8 sm:p-10 font-sans text-xs space-y-6 print:p-4">
            
            <!-- 1. ENCABEZADO MEMBRETADO -->
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

              <!-- CAJA DEL CONSECUTIVO Y FECHA -->
              <div class="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-center min-w-[240px] print:bg-white">
                <span class="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">ACTA DE AUDITORÍA FÍSICA</span>
                <span class="text-sm font-black text-slate-900 block leading-tight mt-0.5">
                  ARQUEO DE CAJA MENOR
                </span>
                <span class="text-base font-mono font-bold text-indigo-700 block mt-1 print:text-black">
                  No. {{ arqueo()?.consecutivo || 'ARQ-0001' }}
                </span>
                <span class="text-[10px] text-slate-600 block mt-0.5">
                  Fecha: {{ arqueo()?.fecha_arqueo | date:'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
            </div>

            <!-- 2. DATOS DE IDENTIFICACIÓN DE LA CAJA Y CUSTODIO -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded-xl p-3 print:bg-white print:border-slate-400">
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500 block">Caja Menor / Fondo</span>
                <span class="font-bold text-slate-800 text-[11px] block">{{ caja()?.codigo }} - {{ caja()?.nombre }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500 block">Custodio / Responsable</span>
                <span class="font-bold text-slate-800 text-[11px] block">{{ caja()?.responsable?.nombre_completo || arqueo()?.custodio?.nombre_completo || 'Custodio Asignado' }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500 block">Auditor / Revisor</span>
                <span class="font-bold text-slate-800 text-[11px] block">{{ nombreAuditor() }}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-slate-500 block">Fondo Fijo Asignado</span>
                <span class="font-mono font-bold text-slate-900 text-xs block">\${{ (arqueo()?.monto_fondo_fijo || caja()?.monto_fondo_fijo || 0) | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- 3. DESGLOSE FÍSICO DE MONEDAS Y BILLETES -->
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>💵</span> Desglose del Conteo de Papel Moneda y Monedas
              </h3>
              <div class="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-slate-100 text-slate-700 uppercase text-[10px] border-b border-slate-300 print:bg-slate-50">
                    <tr>
                      <th class="py-1.5 px-3">Denominación</th>
                      <th class="py-1.5 px-3 text-center">Tipo</th>
                      <th class="py-1.5 px-3 text-center">Cantidad Física Recontada</th>
                      <th class="py-1.5 px-3 text-right">Subtotal Pesos</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    @for (den of denominacionesBilletes; track den.valor) {
                      <tr>
                        <td class="py-1.5 px-3 font-mono font-bold text-slate-800">\${{ den.valor | number:'1.0-0' }}</td>
                        <td class="py-1.5 px-3 text-center text-slate-600">Billete</td>
                        <td class="py-1.5 px-3 text-center font-mono font-bold text-slate-900">{{ obtenerCantidad(den.clave) }}</td>
                        <td class="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          \${{ (obtenerCantidad(den.clave) * den.valor) | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                    <tr>
                      <td class="py-1.5 px-3 font-mono font-bold text-slate-800">Monedas y Fracciones</td>
                      <td class="py-1.5 px-3 text-center text-slate-600">Monedas</td>
                      <td class="py-1.5 px-3 text-center text-slate-400">-</td>
                      <td class="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                        \${{ obtenerMonedas() | number:'1.2-2' }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-100 font-bold border-t-2 border-slate-300 print:bg-slate-50">
                    <tr>
                      <td colspan="3" class="py-2 px-3 text-right uppercase text-slate-700">Total Efectivo Físico Arqueado:</td>
                      <td class="py-2 px-3 text-right font-mono text-emerald-700 text-sm">
                        \${{ (arqueo()?.total_efectivo_fisico || 0) | number:'1.2-2' }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- 4. BALANCE GENERAL DE ARQUEO Y DIAGNÓSTICO -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Cuadro de Balance -->
              <div class="border border-slate-300 rounded-xl p-3 bg-slate-50 print:bg-white print:border-slate-400 space-y-2">
                <h4 class="text-[11px] font-bold uppercase text-slate-700 border-b border-slate-300 pb-1">Cuadratura del Fondo</h4>
                <div class="space-y-1 font-mono text-xs">
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-600">(+) Total Efectivo Físico:</span>
                    <span class="font-bold">\${{ (arqueo()?.total_efectivo_fisico || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between py-0.5">
                    <span class="text-slate-600">(+) Total Vales / Soportes Pendientes:</span>
                    <span class="font-bold">\${{ (arqueo()?.total_vales_comprobantes || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between py-1 border-t border-slate-300 font-bold">
                    <span class="text-slate-800">(=) Total Fondo Recontado:</span>
                    <span class="text-indigo-700">\${{ (arqueo()?.total_fondo_contado || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between py-0.5 text-slate-600">
                    <span>(-) Monto Fondo Fijo Autorizado:</span>
                    <span>\${{ (arqueo()?.monto_fondo_fijo || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between py-1 border-t-2 border-slate-800 font-black text-sm">
                    <span [class]="arqueo()?.resultado === 'FALTANTE' ? 'text-rose-700' : arqueo()?.resultado === 'SOBRANTE' ? 'text-amber-700' : 'text-emerald-700'">
                      Diferencia Resultante:
                    </span>
                    <span [class]="arqueo()?.resultado === 'FALTANTE' ? 'text-rose-700' : arqueo()?.resultado === 'SOBRANTE' ? 'text-amber-700' : 'text-emerald-700'">
                      \${{ (arqueo()?.diferencia || 0) | number:'1.2-2' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Diagnóstico y Observaciones -->
              <div class="border border-slate-300 rounded-xl p-3 bg-slate-50 print:bg-white print:border-slate-400 flex flex-col justify-between">
                <div>
                  <h4 class="text-[11px] font-bold uppercase text-slate-700 border-b border-slate-300 pb-1 mb-2">Dictamen de Auditoría</h4>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-bold">Resultado:</span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800 border border-emerald-300': arqueo()?.resultado === 'CUADRADO',
                        'bg-rose-100 text-rose-800 border border-rose-300': arqueo()?.resultado === 'FALTANTE',
                        'bg-amber-100 text-amber-800 border border-amber-300': arqueo()?.resultado === 'SOBRANTE'
                      }">
                      {{ arqueo()?.resultado }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-700">
                    <p class="font-bold">Observaciones:</p>
                    <p class="italic mt-0.5">{{ arqueo()?.observaciones || 'Sin observaciones registradas durante la práctica del arqueo.' }}</p>
                  </div>
                </div>

                <div class="text-[10px] text-slate-500 pt-2 border-t border-slate-300">
                  <p><b>Nota de Control Interno:</b> El custodio manifiesta haber recibido a entera satisfacción el total de los fondos recontados y soportes relacionados.</p>
                </div>
              </div>
            </div>

            <!-- 5. FIRMAS REGLAMENTARIAS DE AUDITORÍA -->
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-600 block mb-2">Legalización y Suscripción del Acta:</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div class="border border-slate-300 rounded-xl p-3 text-center flex flex-col justify-between min-h-[105px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">1. Custodio del Fondo</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block truncate">{{ caja()?.responsable?.nombre_completo || arqueo()?.custodio?.nombre_completo || 'Custodio Responsable' }}</span>
                    <span class="text-[9px] text-slate-500 font-mono block">C.C. {{ caja()?.responsable?.numero_identificacion || '________________' }}</span>
                  </div>
                </div>

                <div class="border border-slate-300 rounded-xl p-3 text-center flex flex-col justify-between min-h-[105px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">2. Auditor / Revisor</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block truncate">{{ nombreAuditor() }}</span>
                    <span class="text-[9px] text-slate-500 font-mono block">T.P. No. / C.C. ________________</span>
                  </div>
                </div>

                <div class="border border-slate-300 rounded-xl p-3 text-center flex flex-col justify-between min-h-[105px] print:border-slate-400">
                  <span class="text-[9px] font-bold uppercase text-slate-500">3. Aprobó (Gerencia / Control Interno)</span>
                  <div class="border-b border-dashed border-slate-400 my-4"></div>
                  <div>
                    <span class="font-bold text-[10px] text-slate-800 block truncate">Representante Legal / Gerencia</span>
                    <span class="text-[9px] text-slate-500 font-mono block">Firma y Sello</span>
                  </div>
                </div>

              </div>
            </div>

            <!-- PIE DE PÁGINA -->
            <div class="border-t border-slate-200 pt-3 flex items-center justify-between text-[9px] text-slate-500 print:pt-2">
              <span>PACYOLO ERP Tesorería & Auditoría — Acta Inmutable Sometida a Pistas de Auditoría</span>
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
    window.print();
  }

  cerrar(): void {
    this.visible.set(false);
  }
}
