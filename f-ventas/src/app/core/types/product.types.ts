export interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  currency: string;
  description?: string | null;
  category?: string | null;
  image: string; 
  stock: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  priceCents: number;
  currency: string;  
  image: string;
  stock: number;
  active: boolean;
  description?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  priceCents?: number;
  currency?: string;
  image?: string;
  stock?: number;
  active?: boolean;
  description?: string | null;
}