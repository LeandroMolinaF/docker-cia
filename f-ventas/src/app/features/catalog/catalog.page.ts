import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ProductsService, PaginatedProducts } from '../../core/services/products.service';
import { OrdersService } from '../../core/services/orders.service';
import { PaymentsService } from '../../core/services/payments.service';
import { Product } from '../../core/types/product.types';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
<main class="flex-1">
  <div class="px-4 md:px-10 lg:px-20 xl:px-40">
    <div class="flex flex-wrap justify-between gap-3 p-4 md:p-6">
      <p class="text-black dark:text-white text-3xl md:text-4xl font-black tracking-[-0.033em] min-w-72">Catalogo de Productos</p>
    </div>

    <div class="flex gap-3 p-4 md:p-6 overflow-x-auto">
      <button class="flex h-8 items-center gap-x-2 rounded-lg bg-gray-200 dark:bg-[#283039] px-4 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              [class.!bg-primary]="category() === ''"
              [class.!text-white]="category() === ''"
              (click)="setCategory('')">
        <p class="text-sm font-medium leading-normal">Todo</p>
      </button>

      <button *ngFor="let c of categories" class="flex h-8 items-center gap-x-2 rounded-lg bg-gray-200 dark:bg-[#283039] px-4 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              [class.!bg-primary]="category() === c"
              [class.!text-white]="category() === c"
              (click)="setCategory(c)">
        <p class="text-sm font-medium leading-normal">{{ c }}</p>
      </button>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 p-4 md:p-6">
      <div *ngFor="let p of products()" class="flex flex-col gap-3 rounded-lg bg-white dark:bg-gray-800/50 p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div class="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-lg"
             [attr.data-alt]="p.name"
             [style.background-image]="'url(' + p.image + ')'"></div>

        <div class="flex-grow">
          <p class="text-black dark:text-white text-lg font-bold leading-normal truncate" title="{{p.name}}">{{ p.name }}</p>
          <p class="text-gray-700 dark:text-gray-300 text-base">{{ p.priceCents | money:p.currency }}</p>
          <p class="text-sm font-medium"
             [class.text-green-500]="p.stock>5"
             [class.text-yellow-500]="p.stock>0 && p.stock<=5"
             [class.text-red-500]="p.stock===0">
            {{ stockLabel(p.stock) }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <a class="flex-1 h-10 grid place-items-center rounded-lg bg-gray-200 dark:bg-[#283039] text-black dark:text-white text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
             [routerLink]="['/product', p.id]">View</a>

          <button class="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  (click)="buyNow(p)" [disabled]="p.stock===0 || loadingBuyId()===p.id">
            <span class="truncate">{{ loadingBuyId()===p.id ? 'Processing…' : 'Buy Now' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center gap-2 pb-10" *ngIf="pages()>1">
      <button class="px-3 py-1 rounded bg-gray-200 dark:bg-[#283039]" (click)="prevPage()" [disabled]="page()<=1">Prev</button>
      <span class="text-sm text-gray-500 dark:text-gray-400">Page {{ page() }} / {{ pages() }}</span>
      <button class="px-3 py-1 rounded bg-gray-200 dark:bg-[#283039]" (click)="nextPage()" [disabled]="page()>=pages()">Next</button>
    </div>

    <div *ngIf="errorMsg()" class="px-6 pb-6">
      <p class="text-red-600 text-sm">{{ errorMsg() }}</p>
    </div>
  </div>
</main>
  `,
})
export class CatalogPage {
  private productsSvc = inject(ProductsService);
  private ordersSvc = inject(OrdersService);
  private paymentsSvc = inject(PaymentsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<Product[]>([]);
  page = signal(1);
  size = signal(12);
  total = signal(0);
  pages = signal(1);
  q = signal<string>('');
  category = signal<string>('');
  loadingBuyId = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  categories = ['Electrónico','Ropa','Libros','Artículos de hogar','Accesorios'];

  constructor() {
    
      this.route.queryParamMap.subscribe(params => {
        this.q.set(params.get('q') ?? '');
        this.page.set(Number(params.get('page') ?? 1));
        this.category.set(params.get('category') ?? '');
        this.load();
      });
  }

  async load() {
    try {
      this.errorMsg.set(null);
      const res = await this.productsSvc.list({
        q: this.q() || undefined,
        category: this.category() || undefined,
        inStock: true,
        page: this.page(),
        size: this.size(),
        sort: 'createdAt:desc',
      });
      this.products.set(res.items);
      this.total.set(res.total);
      this.pages.set(res.pages);
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'No se pudo cargar el catálogo';
      this.errorMsg.set(msg);
    }
  }

  setCategory(cat: string) {
    this.router.navigate(['/'], {
      queryParams: { category: cat || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  stockLabel(stock: number) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
  }

  async buyNow(p: Product) {
    if (p.stock === 0) return;
    this.loadingBuyId.set(p.id);
    this.errorMsg.set(null);
    try {
      const order = await this.ordersSvc.quickBuy(p.id);
      const intent = await this.paymentsSvc.createIntent(order.id);
      const final = await this.paymentsSvc.confirm(intent.id);
      if (final.status === 'SUCCEEDED') {
        this.router.navigate(['/me/orders']);
        alert('Compra realizada con éxito ');
        this.load();
      } else {
        this.errorMsg.set('El pago no fue aprobado');
      }
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'No se pudo completar la compra';
      this.errorMsg.set(msg);
    } finally {
      this.loadingBuyId.set(null);
    }
  }

  nextPage() {
    if (this.page() < this.pages()) {
      this.router.navigate(['/'], { queryParams: { page: this.page() + 1 }, queryParamsHandling: 'merge' });
    }
  }
  prevPage() {
    if (this.page() > 1) {
      this.router.navigate(['/'], { queryParams: { page: this.page() - 1 }, queryParamsHandling: 'merge' });
    }
  }
}
