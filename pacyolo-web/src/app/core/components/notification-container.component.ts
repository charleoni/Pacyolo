import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ======================================================== -->
    <!-- CONTENEDOR FLOTANTE DE TOASTS (TOP-RIGHT) -->
    <!-- ======================================================== -->
    <div
      class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
    >
      @for (toast of notificationService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto transform transition-all duration-300 ease-out flex items-start gap-3.5 p-4 rounded-xl border shadow-xl backdrop-blur-md"
          [ngClass]="{
            'bg-slate-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10': toast.type === 'success',
            'bg-slate-900/95 border-rose-500/40 text-rose-300 shadow-rose-500/10': toast.type === 'error',
            'bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-amber-500/10': toast.type === 'warning',
            'bg-slate-900/95 border-indigo-500/40 text-indigo-300 shadow-indigo-500/10': toast.type === 'info'
          }"
        >
          <!-- Ícono según el tipo -->
          <div class="shrink-0 mt-0.5">
            @if (toast.type === 'success') {
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            } @else if (toast.type === 'error') {
              <div class="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            } @else if (toast.type === 'warning') {
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            } @else {
              <div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }
          </div>

          <!-- Contenido del Mensaje -->
          <div class="flex-1 min-w-0 pr-1">
            @if (toast.title) {
              <h5 class="text-xs font-bold text-white tracking-wide mb-0.5">{{ toast.title }}</h5>
            }
            <p class="text-xs text-slate-300 leading-relaxed break-words">{{ toast.message }}</p>
          </div>

          <!-- Botón Cerrar -->
          <button
            type="button"
            (click)="notificationService.removeToast(toast.id)"
            class="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
            title="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>

    <!-- ======================================================== -->
    <!-- DIÁLOGO MODAL PERSONALIZADO (CONFIRM / ALERT / PROMPT) -->
    <!-- ======================================================== -->
    @if (notificationService.activeDialog(); as dialog) {
      <div
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        (keydown.escape)="notificationService.closeDialog(false)"
      >
        <div
          class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 transform transition-all duration-200 ease-out"
        >
          <!-- Encabezado con Icono -->
          <div class="flex items-start gap-4 mb-4">
            @if (dialog.intent === 'danger') {
              <div class="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            } @else if (dialog.intent === 'warning') {
              <div class="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            } @else if (dialog.intent === 'success') {
              <div class="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            } @else {
              <div class="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            }

            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-white tracking-tight">
                {{ dialog.title }}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Mensaje del sistema PACYOLO</p>
            </div>
          </div>

          <!-- Mensaje Principal -->
          <div class="py-2 mb-4">
            <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {{ dialog.message }}
            </p>
          </div>

          <!-- Campo Input para Prompt (si aplica) -->
          @if (dialog.isPrompt) {
            <div class="mb-5">
              <textarea
                rows="3"
                [placeholder]="dialog.promptPlaceholder || 'Escriba aquí...'"
                [ngModel]="dialog.promptValue"
                (ngModelChange)="notificationService.setPromptValue($event)"
                class="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                autofocus
              ></textarea>
            </div>
          }

          <!-- Botones de Acción -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            @if (dialog.isConfirm) {
              <button
                type="button"
                (click)="notificationService.closeDialog(false)"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 transition cursor-pointer"
              >
                {{ dialog.cancelText || 'Cancelar' }}
              </button>
            }

            <button
              type="button"
              (click)="notificationService.closeDialog(true)"
              class="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition cursor-pointer"
              [ngClass]="{
                'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30': dialog.intent === 'danger',
                'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30': dialog.intent === 'warning',
                'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30': dialog.intent === 'success',
                'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30': !dialog.intent || dialog.intent === 'info'
              }"
            >
              {{ dialog.confirmText || 'Aceptar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class NotificationContainerComponent {
  readonly notificationService = inject(NotificationService);
}
