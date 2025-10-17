import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-status-badge',
  imports: [CommonModule],
  template: `
  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
        [ngClass]="cls()">{{ status }}</span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: 'PENDING'|'PAID'|'CANCELED' = 'PENDING';

  cls() {
    switch (this.status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
}
