import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration: number;
}

export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  intent?: 'danger' | 'warning' | 'info' | 'success';
}

export interface PromptOptions extends DialogOptions {
  placeholder?: string;
  defaultValue?: string;
}

export interface ActiveDialog extends DialogOptions {
  id: string;
  isConfirm: boolean;
  isPrompt?: boolean;
  promptValue?: string;
  promptPlaceholder?: string;
  resolve: (value: any) => void;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // Toasts flotantes
  readonly toasts = signal<ToastItem[]>([]);

  // Diálogo modal activo (Confirm, Alert o Prompt)
  readonly activeDialog = signal<ActiveDialog | null>(null);

  // ==========================================
  // TOASTS
  // ==========================================

  success(message: string, title = 'Operación Exitosa', duration = 4000): void {
    this.addToast('success', message, title, duration);
  }

  error(message: string, title = 'Error', duration = 5000): void {
    this.addToast('error', message, title, duration);
  }

  warning(message: string, title = 'Advertencia', duration = 4500): void {
    this.addToast('warning', message, title, duration);
  }

  info(message: string, title = 'Información', duration = 4000): void {
    this.addToast('info', message, title, duration);
  }

  private addToast(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title: string,
    duration: number,
  ): void {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, title, message, duration };

    this.toasts.update((current) => [...current, item]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  removeToast(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  // ==========================================
  // DIÁLOGOS MODALES (CONFIRM / ALERT / PROMPT)
  // ==========================================

  confirm(options: DialogOptions | string): Promise<boolean> {
    const opts: DialogOptions =
      typeof options === 'string'
        ? { message: options, title: 'Confirmar Acción', confirmText: 'Confirmar', cancelText: 'Cancelar', intent: 'danger' }
        : {
            title: options.title || 'Confirmar Acción',
            message: options.message,
            confirmText: options.confirmText || 'Confirmar',
            cancelText: options.cancelText || 'Cancelar',
            intent: options.intent || 'danger',
          };

    return new Promise<boolean>((resolve) => {
      this.activeDialog.set({
        ...opts,
        id: Math.random().toString(36).substring(2, 9),
        isConfirm: true,
        resolve,
      });
    });
  }

  alert(options: DialogOptions | string): Promise<void> {
    const opts: DialogOptions =
      typeof options === 'string'
        ? { message: options, title: 'Aviso del Sistema', confirmText: 'Entendido', intent: 'info' }
        : {
            title: options.title || 'Aviso del Sistema',
            message: options.message,
            confirmText: options.confirmText || 'Entendido',
            intent: options.intent || 'info',
          };

    return new Promise<void>((resolve) => {
      this.activeDialog.set({
        ...opts,
        id: Math.random().toString(36).substring(2, 9),
        isConfirm: false,
        resolve: () => resolve(),
      });
    });
  }

  prompt(options: PromptOptions | string): Promise<string | null> {
    const opts: PromptOptions =
      typeof options === 'string'
        ? { message: options, title: 'Requerido', confirmText: 'Aceptar', cancelText: 'Cancelar', intent: 'warning' }
        : {
            title: options.title || 'Requerido',
            message: options.message,
            confirmText: options.confirmText || 'Aceptar',
            cancelText: options.cancelText || 'Cancelar',
            placeholder: options.placeholder || '',
            defaultValue: options.defaultValue || '',
            intent: options.intent || 'warning',
          };

    return new Promise<string | null>((resolve) => {
      this.activeDialog.set({
        ...opts,
        id: Math.random().toString(36).substring(2, 9),
        isConfirm: true,
        isPrompt: true,
        promptValue: opts.defaultValue || '',
        promptPlaceholder: opts.placeholder || 'Escriba aquí...',
        resolve,
      });
    });
  }

  setPromptValue(val: string): void {
    const dialog = this.activeDialog();
    if (dialog && dialog.isPrompt) {
      this.activeDialog.set({ ...dialog, promptValue: val });
    }
  }

  closeDialog(result: boolean): void {
    const dialog = this.activeDialog();
    if (dialog) {
      if (dialog.isPrompt) {
        dialog.resolve(result ? (dialog.promptValue || '') : null);
      } else {
        dialog.resolve(result);
      }
      this.activeDialog.set(null);
    }
  }
}
