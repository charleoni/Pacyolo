import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
      <!-- Indicador Informativo -->
      <div class="flex items-center gap-1.5">
        <span>Mostrando</span>
        <span class="font-bold font-mono text-white">{{ inicio() }}</span>
        <span>-</span>
        <span class="font-bold font-mono text-white">{{ fin() }}</span>
        <span>de</span>
        <span class="font-bold font-mono text-indigo-400">{{ totalItems() }}</span>
        <span>registros</span>
      </div>

      <!-- Controles de Página y Tamaño -->
      <div class="flex items-center gap-3">
        <!-- Selector Filas por Página -->
        <div class="flex items-center gap-1.5">
          <span class="text-slate-500">Filas:</span>
          <select
            [ngModel]="pageSize()"
            (ngModelChange)="onPageSizeChange($event)"
            class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            @for (opt of pageSizeOptions(); track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
        </div>

        <!-- Botones de Navegación -->
        <div class="flex items-center gap-1 font-mono">
          <button
            type="button"
            (click)="cambiarPagina(1)"
            [disabled]="currentPage() <= 1"
            class="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="Primera página"
          >
            «
          </button>
          <button
            type="button"
            (click)="cambiarPagina(currentPage() - 1)"
            [disabled]="currentPage() <= 1"
            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="Página anterior"
          >
            ‹
          </button>

          <span class="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            Pág. <b class="text-white">{{ currentPage() }}</b> de <b class="text-slate-400">{{ totalPages() }}</b>
          </span>

          <button
            type="button"
            (click)="cambiarPagina(currentPage() + 1)"
            [disabled]="currentPage() >= totalPages()"
            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="Página siguiente"
          >
            ›
          </button>
          <button
            type="button"
            (click)="cambiarPagina(totalPages())"
            [disabled]="currentPage() >= totalPages()"
            class="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer"
            title="Última página"
          >
            »
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TablePaginationComponent {
  readonly totalItems = input<number>(0);
  readonly pageSize = input<number>(25);
  readonly currentPage = input<number>(1);
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / (size || 25)));
  });

  readonly inicio = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly fin = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages() && nuevaPagina !== this.currentPage()) {
      this.pageChange.emit(nuevaPagina);
    }
  }

  onPageSizeChange(nuevoTamano: any): void {
    const size = Number(nuevoTamano);
    if (size > 0 && size !== this.pageSize()) {
      this.pageSizeChange.emit(size);
    }
  }
}
