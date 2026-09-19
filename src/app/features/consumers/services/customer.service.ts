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

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private readonly apiUrl = 'http://localhost:8080/api/customers';

  constructor(private readonly http: HttpClient) {
  }

  findAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }
}