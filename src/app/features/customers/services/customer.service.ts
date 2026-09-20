import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id: number;
  name: string;
  companyName: string | null;
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
  document: string;
  email: string;
  phone: string;
}

export interface CustomerDropdown {
  id: number;
  name: string;
  companyName: string | null;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly apiUrl = 'http://localhost:8080/api/customers';

  constructor(private readonly http: HttpClient) {}

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
  return this.http.get<CustomerDropdown[]>(
    `${this.apiUrl}/dropdown`
  );
}
}
