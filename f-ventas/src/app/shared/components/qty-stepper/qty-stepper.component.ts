import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-qty-stepper',
  imports: [CommonModule],
  template: `
<div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
  <button type="button" class="px-3 py-2 text-gray-600 dark:text-gray-300 focus:outline-none"
          (click)="decrement()" [disabled]="value() <= min">
    <span class="material-symbols-outlined text-base">remove</span>
  </button>

  <input class="w-12 text-center bg-transparent border-0 text-gray-800 dark:text-white focus:ring-0"
         type="text" [value]="value()" (input)="onInput($event)"/>

  <button type="button" class="px-3 py-2 text-gray-600 dark:text-gray-300 focus:outline-none"
          (click)="increment()" [disabled]="value() >= max">
    <span class="material-symbols-outlined text-base">add</span>
  </button>
</div>
  `,
})
export class QtyStepperComponent {
  @Input() min = 1;
  @Input() max = 99;
  @Input() set qty(v: number) { this.value.set(this.clamp(v)); }
  @Output() qtyChange = new EventEmitter<number>();

  value = signal(1);

  private clamp(v: number) {
    return Math.max(this.min, Math.min(this.max, isNaN(v as any) ? this.min : v));
  }

  increment() { this.setQty(this.value() + 1); }
  decrement() { this.setQty(this.value() - 1); }

  onInput(ev: Event) {
    const t = ev.target as HTMLInputElement;
    const n = Number((t.value || '').replace(/[^\d]/g, ''));
    this.setQty(n || this.min);
  }

  private setQty(n: number) {
    const clamped = this.clamp(n);
    this.value.set(clamped);
    this.qtyChange.emit(clamped);
  }
}
