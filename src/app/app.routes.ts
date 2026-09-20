import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

import { MainLayout } from './layout/main-layout/main-layout';

import { Login } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { CustomerList } from './features/customers/pages/customer-list/customer-list';
import { CustomerForm } from './features/customers/pages/customer-form/customer-form';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'customers/new',
        component: CustomerForm
      },
      {
        path: 'customers/:id/edit',
        component: CustomerForm
      },
      {
        path: 'customers',
        component: CustomerList
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];