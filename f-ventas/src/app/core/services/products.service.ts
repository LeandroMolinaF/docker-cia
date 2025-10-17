import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../http/api-config.token';
import { CreateProductDto, Product, UpdateProductDto } from '../types/product.types';

export interface ListProductsParams {
  q?: string;
  category?: string;
  inStock?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  includeInactive?: boolean;
}

export interface PaginatedProducts {
  page: number; size: number; total: number; pages: number; items: Product[];
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  async list(params: ListProductsParams = {}): Promise<PaginatedProducts> {
    let p = new HttpParams();
    Object.entries({
      q: params.q ?? '',
      category: params.category ?? '',
      inStock: params.inStock ?? true,
      page: params.page ?? 1,
      size: params.size ?? 12,
      sort: params.sort ?? 'createdAt:desc',
      includeInactive: params.includeInactive ?? false,
    }).forEach(([k, v]) => (v !== '' && v !== undefined ? (p = p.set(k, String(v))) : null));

    return firstValueFrom(this.http.get<PaginatedProducts>(`${this.base}/products`, { params: p }));
  }

  async get(id: string): Promise<Product> {
    return firstValueFrom(this.http.get<Product>(`${this.base}/products/${id}`));
  }

    async adminList(params: ListProductsParams = {}): Promise<PaginatedProducts> {
        console.log('entre a la funcion list')
        return this.list({
        ...params,
        includeInactive: true,
        inStock: params.inStock ?? undefined,
        size: params.size ?? 10,
        sort: params.sort ?? 'createdAt:desc',
        });
    }

    async create(payload: CreateProductDto): Promise<Product> {
        return firstValueFrom(this.http.post<Product>(`${this.base}/products`, payload));
    }

    async update(id: string, payload: UpdateProductDto): Promise<Product> {
        return firstValueFrom(this.http.put<Product>(`${this.base}/products/${id}`, payload));
    }
}
