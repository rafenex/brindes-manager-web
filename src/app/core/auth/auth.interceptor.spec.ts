import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('user-management permissions', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let auth: AuthService;

  const deny = { status: 403, statusText: 'Forbidden' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    signIn(1);
  });

  afterEach(() => {
    requests.verify();
    auth.logout();
  });

  function signIn(userId: number): void {
    const payload = btoa(JSON.stringify({ userId, role: 'ADMIN' }));
    auth.saveToken(`header.${payload}.signature`);
  }

  it('removes management access if the collection denies an authenticated session', () => {
    http.get('/api/users').subscribe({ error: () => undefined });
    requests.expectOne('/api/users').flush(null, deny);
    expect(auth.isAdmin()).toBeFalse();
    expect(auth.getToken()).toBeTruthy();
  });

  it('checks current access on a forbidden edit without dropping valid admin permissions', () => {
    http.put('/api/users/1', {}).subscribe({ error: error => expect(error.status).toBe(403) });
    requests.expectOne('/api/users/1').flush({ messages: ['Conta própria'] }, deny);
    requests.expectOne({ url: '/api/users', method: 'GET' }).flush([]);
    expect(auth.isAdmin()).toBeTrue();
  });

  it('revokes management access when a forbidden deletion is followed by a forbidden collection check', () => {
    http.delete('/api/users/2').subscribe({ error: error => expect(error.status).toBe(403) });
    requests.expectOne('/api/users/2').flush(null, deny);
    requests.expectOne({ url: '/api/users', method: 'GET' }).flush(null, deny);
    expect(auth.isAdmin()).toBeFalse();
  });

  it('does not revoke a new session when a permission check for the previous session finishes', () => {
    http.delete('/api/users/2').subscribe({ error: () => undefined });
    requests.expectOne('/api/users/2').flush(null, deny);
    const check = requests.expectOne({ url: '/api/users', method: 'GET' });
    signIn(3);
    check.flush(null, deny);
    expect(auth.isAdmin()).toBeTrue();
    expect(auth.getUserId()).toBe(3);
  });
});
