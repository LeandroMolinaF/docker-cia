import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { OrderSummary } from '../../core/types/order.types';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { DateLongPipe } from '../../shared/pipes/date-long.pipe';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  standalone: true,
  selector: 'app-my-orders-page',
  imports: [CommonModule, MoneyPipe, DateLongPipe, RouterLink, StatusBadgeComponent],
  template: `
<main class="flex-1 px-10 py-8">
  <div class="max-w-7xl mx-auto">

    <div class="flex flex-wrap justify-between gap-3 mb-6">
      <h1 class="text-gray-800 dark:text-white text-4xl font-black tracking-[-0.033em] min-w-72">My Orders</h1>
    </div>

    <!-- Tabla -->
    <div class="px-4 py-3 @container" *ngIf="orders().length; else emptyTpl">
      <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr *ngFor="let o of orders()" class="hover:bg-blue-50 dark:hover:bg-gray-700/50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary hover:underline">
              <!-- No tenemos ruta /orders/:id, así que mantenemos texto simple -->
              <span>#{{ o.id }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
              {{ o.createdAt | dateLong }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <app-status-badge [status]="o.status"></app-status-badge>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100">
              {{ o.totalCents | money:o.currency }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-center p-4" *ngIf="pages()>1">
      <button class="flex size-10 items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              (click)="prev()" [disabled]="page()<=1">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>

      <span class="mx-2 text-sm text-gray-600 dark:text-gray-300">
        Page {{ page() }} / {{ pages() }}
      </span>

      <button class="flex size-10 items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              (click)="next()" [disabled]="page()>=pages()">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <div *ngIf="errorMsg()" class="mt-4 text-sm text-red-600">{{ errorMsg() }}</div>

    <ng-template #emptyTpl>
      <div class="max-w-7xl mx-auto mt-12">
        <div class="flex flex-col px-4 py-6 items-center gap-6">
          <div class="bg-center bg-no-repeat aspect-video bg-contain w-full max-w-[320px]"
               style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkUrSKXsUrD-7UVEMU6MXYh5JHgkpGWm8GUf5_EBwA6LpEmEusuZCBbxLmUQ7DDwr94z01THfQsOiJIw-KLvegZPuUJC4AKiK8yk3LN-suihqfWRj5P5-706PgX_EitwNO5Q9f3fiqiv9dzC3UvJwLRmB9MmZmrZFrupKbtMJLFY8EljcEI76_zQrPiXTOlwOEx3lHBao2LN3yAxLZOE3T-NwIqdzY5uhWgQfJvPdpbOEe9kAc6CcW_sPx4XV36GEgzyee9wv6Jg");'></div>
          <div class="flex max-w-[480px] flex-col items-center gap-2">
            <p class="text-gray-800 dark:text-white text-lg font-bold text-center">You have no orders yet.</p>
            <p class="text-gray-600 dark:text-gray-300 text-sm text-center">Start shopping to see your orders here.</p>
          </div>
          <a routerLink="/" class="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90">
            Shop Now
          </a>
        </div>
      </div>
    </ng-template>

  </div>
</main>
  `
})
export class MyOrdersPage {
  private ordersSvc = inject(OrdersService);

  orders = signal<OrderSummary[]>([]);
  page   = signal(1);
  size   = signal(10);
  total  = signal(0);
  pages  = signal(1);
  errorMsg = signal<string | null>(null);

  constructor() {
    this.load();
  }

  async load() {
    try {
      this.errorMsg.set(null);
      const res = await this.ordersSvc.listMyOrders({ page: this.page(), size: this.size() });
      this.orders.set(res.items);
      this.total.set(res.total);
      this.pages.set(res.pages);
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'No se pudieron cargar tus órdenes';
      this.errorMsg.set(msg);
    }
  }

  next() { if (this.page() < this.pages()) { this.page.set(this.page() + 1); this.load(); } }
  prev() { if (this.page() > 1) { this.page.set(this.page() - 1); this.load(); } }
}
