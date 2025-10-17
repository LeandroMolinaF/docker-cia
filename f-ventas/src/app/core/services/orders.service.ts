import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../http/api-config.token';
import { uuidv4 } from '../utils/uuid.util';
import { PaginatedOrders } from '../types/order.types';

export interface OrderResponse {
  id: string; status: 'PENDING'|'PAID'|'CANCELED';
  totalCents: number; currency: string;
  items: Array<{ productId: string; qty: number; unitPriceCents: number; currency: string }>;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  async quickBuy(productId: string, qty: number = 1): Promise<OrderResponse> {
    const headers = new HttpHeaders().set('Idempotency-Key', uuidv4());
    const body = { items: [{ productId, qty}], notes: 'Compra rápida desde catálogo' };
    return firstValueFrom(this.http.post<OrderResponse>(`${this.base}/orders`, body, { headers }));
  }

  async listMyOrders(params: { page?: number; size?: number; status?: string } = {}): Promise<PaginatedOrders> {
    let p = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('size', String(params.size ?? 10));
    if (params.status) p = p.set('status', params.status);
    return firstValueFrom(this.http.get<PaginatedOrders>(`${this.base}/v1/orders`, { params: p }));
  }
}
