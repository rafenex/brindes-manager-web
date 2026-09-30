import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  companyName: string;
  email: string;
  password: string;
}

interface JwtPayload {
  exp: number;
  role: string;
  name: string;
  companyName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly tokenKey = 'brindes_token';

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const payload = this.getTokenPayload();

    if (!payload) {
      return false;
    }

    const expired = payload.exp * 1000 <= Date.now();

    if (expired) {
      this.logout();
      return false;
    }

    return true;
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
  }

  isAdmin(): boolean {
    const payload = this.getTokenPayload();

    return payload?.role === 'ADMIN';
  }

  private getTokenPayload(): JwtPayload | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');

      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  getUserName(): string {
    return this.getTokenPayload()?.name ?? '';
  }

  getCompanyName(): string {
    return this.getTokenPayload()?.companyName ?? '';
  }

  getRoleLabel(): string {
    const role = this.getTokenPayload()?.role;

    return role === 'ADMIN' ? 'Administrador' : 'Usuário';
  }
}
