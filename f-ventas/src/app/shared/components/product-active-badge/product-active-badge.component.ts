import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-product-active-badge',
  imports: [CommonModule],
  template: `
    <span class="inline-block px-2 py-1 text-xs font-semibold leading-none rounded-full"
          [ngClass]="active ? 'bg-status-active text-white' : 'bg-status-inactive text-white'">
      {{ active ? 'Active' : 'Inactive' }}
    </span>
  `,
})
export class ProductActiveBadgeComponent {
  @Input() active = false;
}
