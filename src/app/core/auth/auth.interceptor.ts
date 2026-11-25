import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, concatWith, EMPTY, ignoreElements, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthRequest =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register');

  if (isAuthRequest) {
    return next(req);
  }

  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  const expireCurrentSession = () => {
    if (authService.getToken() === token) {
      authService.logout();
      router.navigate(['/login']);
    }
  };

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        expireCurrentSession();
      }
      if (error.status === 403 && req.url === '/api/users') {
        authService.denyAdminForSession(token);
      }
      if (error.status === 403 && /^\/api\/users\/[^/]+$/.test(req.url)
          && authService.getToken() === token && authService.isAdmin()) {
        // A denial on one account can also mean the administrator targeted their own account.
        const permissionCheck = authenticatedRequest.clone({ method: 'GET', url: '/api/users', body: null });
        return next(permissionCheck).pipe(
          catchError((checkError: HttpErrorResponse) => {
            if (checkError.status === 403) {
              authService.denyAdminForSession(token);
            }
            if (checkError.status === 401) {
              expireCurrentSession();
            }
            return EMPTY;
          }),
          ignoreElements(),
          concatWith(throwError(() => error)),
        );
      }

      return throwError(() => error);
    })
  );
};