import { Routes } from '@angular/router';

import { Login } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { authGuard } from './core/auth/auth.guard';
import { CustomerList } from './features/customers/pages/customer-list/customer-list';
import { CustomerForm } from './features/customers/pages/customer-form/customer-form';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },

  {
    path: 'customers/new',
    component: CustomerForm,
    canActivate: [authGuard],
  },

  {
    path: 'customers/:id/edit',
    component: CustomerForm,
    canActivate: [authGuard],
  },

  {
    path: 'customers',
    component: CustomerList,
    canActivate: [authGuard],
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
