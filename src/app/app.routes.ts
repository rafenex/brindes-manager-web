import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

import { MainLayout } from './layout/main-layout/main-layout';

import { Login } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { CustomerList } from './features/customers/pages/customer-list/customer-list';
import { CustomerForm } from './features/customers/pages/customer-form/customer-form';
import { CategoryList } from './features/categories/pages/category-list/category-list';
import { CategoryForm } from './features/categories/pages/category-form/category-form';
import { ProductList } from './features/products/pages/product-list/product-list';
import { ProductForm } from './features/products/pages/product-form/product-form';
import { OrderList } from './features/orders/pages/order-list/order-list';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'customers/new',
        component: CustomerForm,
      },
      {
        path: 'customers/:id/edit',
        component: CustomerForm,
      },
      {
        path: 'customers',
        component: CustomerList,
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'categories/new',
        component: CategoryForm,
      },
      {
        path: 'categories/:id/edit',
        component: CategoryForm,
      },
      {
        path: 'categories',
        component: CategoryList,
      },
      {
        path: 'products/new',
        component: ProductForm,
      },
      {
        path: 'products/:id/edit',
        component: ProductForm,
      },
      {
        path: 'products',
        component: ProductList,
      },
      {
        path: 'orders',
        component: OrderList,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
