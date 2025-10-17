import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/types/product.types';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { ProductActiveBadgeComponent } from '../../../shared/components/product-active-badge/product-active-badge.component';

type SortKey = 'name' | 'priceCents' | 'stock' | 'createdAt';
type SortDir = 'asc' | 'desc';

@Component({
  standalone: true,
  selector: 'app-admin-products-page',
  imports: [CommonModule, RouterLink, MoneyPipe, ProductActiveBadgeComponent],
  template: `
<div class="px-10 py-5 flex flex-1 justify-center">
  <div class="layout-content-container flex flex-col max-w-7xl flex-1">

    <!-- Título + botón -->
    <div class="flex flex-wrap justify-between gap-4 p-4 items-center">
      <p class="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
        Product Management
      </p>
      <button (click)="goNew()"
              class="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold tracking-[0.015em] hover:bg-accent transition-colors">
        <span class="material-symbols-outlined mr-2">add</span>
        <span class="truncate">Add New Product</span>
      </button>
    </div>

    <!-- Buscador -->
    <div class="px-4 py-3">
      <label class="flex flex-col min-w-40 h-12 w-full">
        <div class="flex w-full items-stretch rounded-lg h-full">
          <div class="text-gray-400 dark:text-[#9cabba] flex border border-r-0 border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#283039] items-center justify-center pl-4 rounded-l-lg">
            <span class="material-symbols-outlined">search</span>
          </div>
          <input class="form-input flex w-full flex-1 rounded-lg text-text-light dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary
                        border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#283039] h-full placeholder:text-gray-400 dark:placeholder:text-[#9cabba]
                        px-4 rounded-l-none border-l-0 pl-2 text-base"
                 type="text" [value]="q()" (input)="onSearch($event)" placeholder="Search by product name or SKU" />
        </div>
      </label>
    </div>

    <!-- Tabla -->
    <div class="px-4 py-3 @container">
      <div class="flex overflow-hidden rounded-lg border border-gray-300 dark:border-[#3b4754] bg-background-light dark:bg-background-dark">
        <table class="flex-1">
          <thead>
          <tr class="bg-gray-100 dark:bg-[#1b2127]">
            <th class="px-4 py-3 text-left text-text-light dark:text-white w-20 text-sm font-medium">Image</th>
            <th class="px-4 py-3 text-left text-text-light dark:text-white w-1/4 text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                (click)="toggleSort('name')">
              Name <span class="material-symbols-outlined text-xs align-middle">unfold_more</span>
            </th>
            <th class="px-4 py-3 text-left text-text-light dark:text-white w-1/5 text-sm font-medium">SKU</th>
            <th class="px-4 py-3 text-left text-text-light dark:text-white w-1/6 text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                (click)="toggleSort('priceCents')">
              Price <span class="material-symbols-outlined text-xs align-middle">unfold_more</span>
            </th>
            <th class="px-4 py-3 text-left text-text-light dark:text-white w-1/6 text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                (click)="toggleSort('stock')">
              Stock <span class="material-symbols-outlined text-xs align-middle">unfold_more</span>
            </th>
            <th class="px-4 py-3 text-center text-text-light dark:text-white w-28 text-sm font-medium">Active</th>
            <th class="px-4 py-3 text-left text-text-light dark:text-white w-24 text-sm font-medium">Actions</th>
          </tr>
          </thead>

          <tbody>
          <tr *ngFor="let p of items()"
              class="border-t border-t-gray-200 dark:border-t-[#3b4754] hover:bg-gray-50 dark:hover:bg-[#1f2937]"
              [class.bg-gray-50]="rowAlt(p)">
            <td class="h-[72px] px-4 py-2 w-20">
              <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-md w-12 h-12"
                   [style.background-image]="'url(' + p.image + ')'"
                   [attr.data-alt]="p.name"></div>
            </td>
            <td class="h-[72px] px-4 py-2 w-1/4 text-text-light dark:text-white text-sm">{{ p.name }}</td>
            <td class="h-[72px] px-4 py-2 w-1/5 text-gray-500 dark:text-[#9cabba] text-sm">{{ p.sku }}</td>
            <td class="h-[72px] px-4 py-2 w-1/6 text-gray-500 dark:text-[#9cabba] text-sm">
              {{ p.priceCents | money:(p.currency || 'CLP') }}
            </td>
            <td class="h-[72px] px-4 py-2 w-1/6 text-gray-500 dark:text-[#9cabba] text-sm">{{ p.stock }}</td>
            <td class="h-[72px] px-4 py-2 w-28 text-center">
              <app-product-active-badge [active]="p.active"></app-product-active-badge>
            </td>
            <td class="h-[72px] px-4 py-2 w-24">
              <button class="flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                      (click)="edit(p.id)">
                <span class="material-symbols-outlined">edit</span>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-center p-4" *ngIf="pages()>1">
      <button class="flex size-10 items-center justify-center text-text-light dark:text-white hover:bg-gray-200 dark:hover:bg-[#283039] rounded-full"
              (click)="prev()" [disabled]="page()<=1">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <span class="mx-2 text-sm text-text-light dark:text-text-dark">Page {{ page() }} / {{ pages() }}</span>
      <button class="flex size-10 items-center justify-center text-text-light dark:text-white hover:bg-gray-200 dark:hover:bg-[#283039] rounded-full"
              (click)="next()" [disabled]="page()>=pages()">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <div *ngIf="errorMsg()" class="px-4 pb-6 text-sm text-red-600">{{ errorMsg() }}</div>
  </div>
</div>
  `
})
export class AdminProductsPage {
  private productsSvc = inject(ProductsService);
  private router = inject(Router);

  items = signal<Product[]>([]);
  total = signal(0);
  pages = signal(1);
  page  = signal(1);
  size  = signal(10);
  q     = signal('');
  sortKey = signal<SortKey>('createdAt');
  sortDir = signal<SortDir>('desc');
  errorMsg = signal<string | null>(null);

  constructor() { this.load(); }

  private sortParam() {
    return `${this.sortKey()}:${this.sortDir()}`;
  }

  async load() {
    try {
      this.errorMsg.set(null);
      console.log(await this.productsSvc.adminList({
        q: this.q() || undefined,
        page: this.page(),
        size: this.size(),
        sort: this.sortParam(),
      }));

      const res = await this.productsSvc.adminList({
        q: this.q() || undefined,
        page: this.page(),
        size: this.size(),
        sort: this.sortParam(),
      });
      this.items.set(res.items);
      this.total.set(res.total);
      this.pages.set(res.pages);
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'No se pudo cargar la lista de productos';
      this.errorMsg.set(msg);
    }
  }

  onSearch(ev: Event) {
    const val = (ev.target as HTMLInputElement).value ?? '';
    this.q.set(val.trim());
    this.page.set(1);
    this.load();
  }

  toggleSort(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.load();
  }

  rowAlt(p: Product) {
    return (p.id?.charCodeAt(0) || 0) % 2 === 0;
  }

  next() { if (this.page() < this.pages()) { this.page.set(this.page() + 1); this.load(); } }
  prev() { if (this.page() > 1) { this.page.set(this.page() - 1); this.load(); } }

  edit(id: string) { this.router.navigate(['/admin/products', id, 'edit']); }
  goNew() { this.router.navigate(['/admin/products/new']); }
}
