import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { GuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canMatch: [GuestGuard],
    loadComponent: () =>
      import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./features/catalog/product-detail.page').then(
        (m) => m.ProductDetailPage
      ),
  },

  {
    path: 'me/orders',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/orders/my-orders.page').then((m) => m.MyOrdersPage),
  },

  {
    path: 'admin/products',
    canMatch: [AuthGuard, RoleGuard.withRoles(['ADMIN', 'STAFF'])],
    loadComponent: () =>
      import('./features/admin/products/admin-products.page').then(
        (m) => m.AdminProductsPage
      ),
  },

  {
    path: 'admin/products/new',
    canMatch: [AuthGuard, RoleGuard.withRoles(['ADMIN', 'STAFF'])],
    loadComponent: () =>
      import('./features/admin/products/product-form.page').then(
        (m) => m.ProductFormPage
      ),
  },

  {
    path: 'admin/products/:id/edit',
    canMatch: [AuthGuard, RoleGuard.withRoles(['ADMIN', 'STAFF'])],
    loadComponent: () =>
      import('./features/admin/products/product-form.page').then(
        (m) => m.ProductFormPage
      ),
  },
];
