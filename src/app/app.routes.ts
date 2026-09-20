import { Routes } from '@angular/router';

import { Login } from './features/auth/pages/login/login';
import { Dashboard } from './features/dashboard/pages/dashboard/dashboard';
import { authGuard } from './core/auth/auth.guard';
import { CustomerList } from './features/customers/pages/customer-list/customer-list';

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
