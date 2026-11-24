import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError, timeout } from 'rxjs';

export interface Customer {
  id: number;
  name: string | null;
  companyName: string;
  postalCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  companyName: string;
  postalCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  document: string;
  email: string;
  phone: string;
}
export interface CustomerDropdown {
  id: number;
  name: string | null;
  companyName: string;
  postalCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
}

export interface PostalCodeResponse {
  postalCode: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly apiUrl = '/api/customers';

  constructor(private readonly http: HttpClient) {}

  lookupPostalCode(postalCode: string): Observable<PostalCodeResponse> {
    if (!/^[0-9]{8}$/.test(postalCode)) {
      return throwError(() => new Error('CEP inválido para consulta'));
    }
    return this.http.get<unknown>(`/api/postal-codes/${postalCode}`).pipe(
      timeout(6000),
      map((body) => {
        if (body === null || typeof body !== 'object' || Array.isArray(body)) {
          throw new Error('Resposta postal inválida');
        }
        const value = body as Record<string, unknown>;
        if (value['postalCode'] !== postalCode) throw new Error('Resposta postal incoerente');
        const field = (name: string): string | null => {
          const text = value[name];
          if (text === undefined || text === null) return null;
          if (typeof text !== 'string') throw new Error('Resposta postal inválida');
          return text.trim() ? text : null;
        };
        return { postalCode, street: field('street'), neighborhood: field('neighborhood'),
          city: field('city'), state: field('state') };
      }),
    );
  }

  findAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  create(request: CustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, request);
  }

  findById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  update(id: number, request: CustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  findAllDropdown(): Observable<CustomerDropdown[]> {
    return this.http.get<CustomerDropdown[]>(`${this.apiUrl}/dropdown`);
  }
}
