import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { CreateProductDto, Product, UpdateProductDto } from '../../../core/types/product.types';

function intNonNegative(ctrl: AbstractControl): ValidationErrors | null {
  const v = Number(ctrl.value);
  if (!Number.isInteger(v) || v < 0) return { intNonNegative: true };
  return null;
}
function urlHttp(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').toString().trim();
  if (!v) return { required: true };
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { url: true };
    return null;
  } catch {
    return { url: true };
  }
}

@Component({
  standalone: true,
  selector: 'app-product-form-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<div class="px-4 sm:px-8 md:px-16 lg:px-40 flex flex-1 justify-center py-5">
  <div class="layout-content-container flex flex-col max-w-[960px] flex-1">

    <!-- Header -->
    <div class="flex flex-wrap justify-between gap-3 p-4">
      <div class="flex min-w-72 flex-col gap-3">
        <p class="text-black dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          {{ isEdit() ? 'Edit Product' : 'Create New Product' }}
        </p>
        <p class="text-gray-600 dark:text-[#9cabba] text-base">
          {{ isEdit() ? 'Update the product information' : 'Fill in the details to add a new product to the catalog.' }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <form class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4" [formGroup]="form" (ngSubmit)="save()">

      <!-- Columna izquierda -->
      <div class="flex flex-col gap-4">
        <label class="flex flex-col min-w-40 flex-1">
          <p class="text-black dark:text-white text-base font-medium pb-2">Product Name</p>
          <input formControlName="name"
                 class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                        focus:outline-0 focus:ring-0 focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#9cabba] px-4"
                 placeholder="Enter product name" />
          <span class="text-red-500 text-sm mt-1" *ngIf="err('name','required')">Required</span>
        </label>

        <label class="flex flex-col min-w-40 flex-1">
          <p class="text-black dark:text-white text-base font-medium pb-2">SKU</p>
          <input formControlName="sku"
                 class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                        focus:outline-0 focus:ring-0 focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#9cabba] px-4"
                 placeholder="Enter SKU" [readonly]="skuReadonly()" />
          <span class="text-red-500 text-sm mt-1" *ngIf="err('sku','required')">Required</span>
        </label>

        <label class="flex flex-col min-w-40 flex-1">
          <p class="text-black dark:text-white text-base font-medium pb-2">Price (in cents)</p>
          <input formControlName="priceCents" type="number" inputmode="numeric"
                 class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                        focus:outline-0 focus:ring-0 focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#9cabba] px-4"
                 placeholder="e.g., 1000 for $10.00" />
          <span class="text-red-500 text-sm mt-1" *ngIf="err('priceCents','required')">Required</span>
          <span class="text-red-500 text-sm mt-1" *ngIf="err('priceCents','intNonNegative')">Must be a non-negative integer</span>
        </label>

        <label class="flex flex-col min-w-40 flex-1">
          <p class="text-black dark:text-white text-base font-medium pb-2">Currency</p>
          <select formControlName="currency"
                  class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                         focus:outline-0 focus:ring-0 focus:border-primary h-14 px-4 appearance-none">
            <option *ngFor="let c of currencies" [value]="c">{{ c }}</option>
          </select>
          <span class="text-red-500 text-sm mt-1" *ngIf="err('currency','required')">Required</span>
        </label>
      </div>

      <!-- Columna derecha -->
      <div class="flex flex-col gap-4">
        <label class="flex flex-col min-w-40 flex-1">
          <p class="text-black dark:text-white text-base font-medium pb-2">Image URL</p>
          <input formControlName="image"
                 (input)="imagePreview.set(form.controls.image.value || '')"
                 class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                        focus:outline-0 focus:ring-0 focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#9cabba] px-4"
                 placeholder="Enter image URL" />
          <span class="text-red-500 text-sm mt-1" *ngIf="err('image','required')">Required</span>
          <span class="text-red-500 text-sm mt-1" *ngIf="err('image','url')">Invalid URL (http/https)</span>

          <div class="mt-3">
            <div class="bg-center bg-no-repeat bg-cover rounded-lg w-28 h-28 border border-gray-200 dark:border-gray-700"
                 [style.background-image]="'url(' + imagePreview() + ')'"></div>
          </div>
        </label>

        <label class="flex flex-col min-w-40 flex-1">
          <p class="text-black dark:text-white text-base font-medium pb-2">Stock</p>
          <input formControlName="stock" type="number" inputmode="numeric"
                 class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                        focus:outline-0 focus:ring-0 focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#9cabba] px-4"
                 placeholder="Enter stock quantity" />
          <span class="text-red-500 text-sm mt-1" *ngIf="err('stock','required')">Required</span>
          <span class="text-red-500 text-sm mt-1" *ngIf="err('stock','intNonNegative')">Must be a non-negative integer</span>
        </label>

        <div class="flex items-center justify-between min-w-40 flex-1 mt-4">
          <p class="text-black dark:text-white text-base font-medium">Active</p>
          <label class="flex items-center cursor-pointer">
            <input class="form-switch-checkbox sr-only" type="checkbox" formControlName="active" />
            <div class="form-switch">
              <span class="form-switch-knob"></span>
            </div>
          </label>
        </div>
      </div>

      <!-- Descripción -->
      <div class="md:col-span-2">
        <label class="flex flex-col w-full">
          <p class="text-black dark:text-white text-base font-medium pb-2">Description (optional)</p>
          <textarea formControlName="description" rows="4"
            class="form-input w-full rounded-lg text-black dark:text-white border border-gray-300 dark:border-[#3b4754] bg-white dark:bg-[#1b2127]
                   focus:outline-0 focus:ring-0 focus:border-primary placeholder:text-gray-500 dark:placeholder:text-[#9cabba] px-4 py-3"
            placeholder="Short product description..."></textarea>
        </label>
      </div>

      <!-- Acciones -->
      <div class="md:col-span-2 flex justify-end gap-4 p-2 mt-2">
        <a class="flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors"
           [routerLink]="['/admin/products']">
          Cancel
        </a>

        <button type="submit"
                class="flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors
                       disabled:bg-primary/50 disabled:cursor-not-allowed"
                [disabled]="form.invalid || saving()">
          <span class="material-symbols-outlined" *ngIf="saving()">cached</span>
          {{ isEdit() ? 'Save Changes' : 'Save Product' }}
        </button>
      </div>

      <div class="md:col-span-2" *ngIf="errorMsg()" >
        <p class="text-red-600 text-sm mt-2">{{ errorMsg() }}</p>
      </div>
      <div class="md:col-span-2" *ngIf="successMsg()" >
        <p class="text-green-600 text-sm mt-2">{{ successMsg() }}</p>
      </div>
    </form>
  </div>
</div>
  `
})
export class ProductFormPage {
  private fb = inject(FormBuilder);
  private products = inject(ProductsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currencies = ['CLP', 'USD', 'EUR', 'GBP', 'JPY'];

  form = this.fb.group({
    name: ['', [Validators.required]],
    sku: ['', [Validators.required]],
    priceCents: [0, [Validators.required, intNonNegative]],
    currency: ['CLP', [Validators.required]],
    image: ['', [urlHttp]],
    stock: [0, [Validators.required, intNonNegative]],
    active: [true, []],
    description: [''],
  });

  imagePreview = signal<string>('');
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  productId = signal<string | null>(null);
  isEdit = computed(() => !!this.productId());

  // por defecto no dejamos editar SKU en modo edición (opcional)
  skuReadonly = computed(() => this.isEdit());

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.load(id);
    }
  }

  private async load(id: string) {
    try {
      const p = await this.products.get(id);
      this.form.patchValue({
        name: p.name,
        sku: p.sku,
        priceCents: p.priceCents,
        currency: p.currency || 'CLP',
        image: p.image,
        stock: p.stock,
        active: p.active,
        description: p.description || '',
      });
      this.imagePreview.set(p.image || '');
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message || e?.message || 'Product not found');
    }
  }

  err(ctrl: keyof typeof this.form.controls, key: string) {
    const c = this.form.controls[ctrl];
    return (c.touched || c.dirty) && c.errors?.[key];
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const payloadBase = {
      name: this.form.value.name!,
      sku: this.form.value.sku!,
      priceCents: Number(this.form.value.priceCents),
      currency: this.form.value.currency!,
      image: this.form.value.image!,
      stock: Number(this.form.value.stock),
      active: !!this.form.value.active,
      description: (this.form.value.description || '').trim() || null,
    };

    try {
      if (this.isEdit()) {
        const id = this.productId()!;
        const payload: UpdateProductDto = payloadBase;
        await this.products.update(id, payload);
        this.successMsg.set('Changes saved ✅');
      } else {
        const payload: CreateProductDto = payloadBase;
        await this.products.create(payload);
        this.successMsg.set('Product created successfully ✅');
      }
      setTimeout(() => this.router.navigate(['/admin/products']), 600);
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Operation failed';
      this.errorMsg.set(msg);
    } finally {
      this.saving.set(false);
    }
  }
}
