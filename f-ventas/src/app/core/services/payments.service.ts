import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../http/api-config.token';
import { uuidv4 } from '../utils/uuid.util';

export interface PaymentTx {
  id: string; orderId: string; status: 'REQUIRES_CONFIRMATION'|'SUCCEEDED'|'FAILED';
  amountCents: number; currency: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  async createIntent(orderId: string): Promise<PaymentTx> {
    const headers = new HttpHeaders().set('Idempotency-Key', uuidv4());
    return firstValueFrom(this.http.post<PaymentTx>(`${this.base}/payments/intent`, { orderId, method: 'simulator' }, { headers }));
  }

  async confirm(paymentId: string): Promise<PaymentTx> {
    const headers = new HttpHeaders().set('Idempotency-Key', uuidv4());
    return firstValueFrom(this.http.post<PaymentTx>(`${this.base}/payments/${paymentId}/confirm`, { confirmationToken: 'demo-123' }, { headers }));
  }
}
