export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED';

export interface OrderItem {
  productId: string;
  qty: number;
  unitPriceCents: number;
  currency: string;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface PaginatedOrders {
  page: number; size: number; total: number; pages: number;
  items: OrderSummary[];
}
