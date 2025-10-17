import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { OrdersService } from '../../core/services/orders.service';
import { PaymentsService } from '../../core/services/payments.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Product } from '../../core/types/product.types';
import { QtyStepperComponent } from '../../shared/components/qty-stepper/qty-stepper.component';

@Component({
  standalone: true,
  selector: 'app-product-detail-page',
  imports: [CommonModule, RouterLink, MoneyPipe, QtyStepperComponent],
  template: `
<main class="flex-1 px-4 sm:px-10 py-5">
  <div class="layout-content-container flex flex-col max-w-6xl mx-auto">

    <!-- Breadcrumb -->
    <div class="flex flex-wrap gap-2 p-4">
      <a class="text-gray-500 dark:text-[#9cabba] text-sm font-medium leading-normal" [routerLink]="['/']">Home</a>
      <span class="text-gray-500 dark:text-[#9cabba] text-sm font-medium">/</span>
      <a class="text-gray-500 dark:text-[#9cabba] text-sm font-medium leading-normal" [routerLink]="['/']">Products</a>
      <span class="text-gray-500 dark:text-[#9cabba] text-sm font-medium">/</span>
      <span class="text-gray-800 dark:text-white text-sm font-medium leading-normal">{{ product()?.name || '...' }}</span>
    </div>

    <!-- Contenido -->
    <div *ngIf="product(); else loadingTpl" class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
      <!-- Galería -->
      <div class="flex flex-col gap-4">
        <div class="w-full bg-center bg-no-repeat bg-contain aspect-[4/3] rounded-xl flex-1 bg-white dark:bg-background-dark p-4"
             [attr.data-alt]="product()?.name"
             [style.background-image]="'url(' + product()?.image + ')'"></div>

        <div class="grid grid-cols-4 gap-4">
          <!-- Thumbnails “simuladas” (reutiliza image) -->
          <div *ngFor="let t of thumbs" class="w-full bg-center bg-no-repeat bg-cover aspect-square rounded-lg bg-white dark:bg-background-dark p-2"
               [style.background-image]="'url(' + product()?.image + ')'"></div>
        </div>
      </div>

      <!-- Info -->
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap justify-between gap-3 p-0">
          <h1 class="text-gray-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
            {{ product()?.name }}
          </h1>
        </div>

        <h2 class="text-gray-900 dark:text-white tracking-light text-4xl font-bold leading-tight">
          {{ (product()?.priceCents || 0) | money: (product()?.currency || 'CLP') }}
        </h2>

        <div>
          <h3 class="text-gray-800 dark:text-gray-200 text-lg font-semibold mb-2">Description</h3>
          <p class="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            {{ product()?.description || 'No description available.' }}
          </p>
          <p class="mt-2 text-sm"
             [class.text-green-500]="(product()?.stock||0)>5"
             [class.text-yellow-500]="(product()?.stock||0)>0 && (product()?.stock||0)<=5"
             [class.text-red-500]="(product()?.stock||0)===0">
            {{ stockLabel(product()?.stock || 0) }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <h3 class="text-gray-800 dark:text-gray-200 text-lg font-semibold">Quantity</h3>
          <app-qty-stepper [min]="1" [max]="Math.max(1, product()?.stock || 1)" [qty]="qty()" (qtyChange)="qty.set($event)"></app-qty-stepper>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 mt-4">
          <!-- Add to Cart (placeholder, no carrito) -->
          <button type="button"
                  class="flex-1 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold tracking-[0.015em] hover:bg-primary/90 transition-colors"
                  [disabled]="(product()?.stock||0)===0"
                  (click)="notifyCart()">
            <span class="truncate">Add to Cart</span>
          </button>

          <button type="button"
                  class="flex-1 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-base font-bold tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  [disabled]="(product()?.stock||0)===0 || loading()"
                  (click)="buyNow()">
            <span class="truncate">{{ loading() ? 'Processing…' : 'Buy Now' }}</span>
          </button>
        </div>

        <div *ngIf="errorMsg()" class="text-sm text-red-600">{{ errorMsg() }}</div>
        <div *ngIf="successMsg()" class="text-sm text-green-600">{{ successMsg() }}</div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="p-6 text-gray-500 dark:text-gray-400">Cargando producto…</div>
    </ng-template>
  </div>
</main>
  `,
})
export class ProductDetailPage {
  private route = inject(ActivatedRoute);
  private productsSvc = inject(ProductsService);
  private ordersSvc = inject(OrdersService);
  private paymentsSvc = inject(PaymentsService);

  product = signal<Product | null>(null);
  qty = signal(1);
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  thumbs = Array.from({ length: 4 });

  public Math = Math;

  constructor() {
    this.route.paramMap.subscribe(async (map) => {
      const id = map.get('id');
      if (!id) return;

      this.errorMsg.set(null);
      this.successMsg.set(null);
      this.qty.set(1);

      try {
        const p = await this.productsSvc.get(id);
        this.product.set(p);
        
        if ((p.stock || 0) <= 0) {
            this.qty.set(1);
        }

      } catch (e: any) {
        this.errorMsg.set(e?.error?.message || 'No se pudo cargar el producto');
      }
    });
  }

  stockLabel(stock: number) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
    }

  async buyNow() {
    const p = this.product();
    if (!p) return;
    if (this.qty() < 1) this.qty.set(1);
    if (this.qty() > p.stock) this.qty.set(p.stock);

    this.loading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    try {
      const order = await this.ordersSvc.quickBuy(p.id, this.qty());
      const intent = await this.paymentsSvc.createIntent(order.id);
      const final = await this.paymentsSvc.confirm(intent.id);
      if (final.status === 'SUCCEEDED') {
        this.successMsg.set('Compra realizada con éxito ✅');
      } else {
        this.errorMsg.set('El pago no fue aprobado');
      }
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message || e?.message || 'No se pudo completar la compra');
    } finally {
      this.loading.set(false);
    }
  }

  notifyCart() {
    this.successMsg.set('Carrito no implementado en este demo.');
    setTimeout(() => this.successMsg.set(null), 2000);
  }
}
