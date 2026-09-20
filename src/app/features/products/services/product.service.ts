import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  reference: string;
  name: string;
  description: string | null;
  basePrice: number;
  active: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  reference: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = 'http://localhost:8080/api/products';

  constructor(private readonly http: HttpClient) {
  }

  findAll(categoryId?: number): Observable<Product[]> {
    if (categoryId) {
      return this.http.get<Product[]>(
        this.apiUrl,
        {
          params: {
            categoryId
          }
        }
      );
    }

    return this.http.get<Product[]>(this.apiUrl);
  }

  findById(id: number): Observable<Product> {
    return this.http.get<Product>(
      `${this.apiUrl}/${id}`
    );
  }

  create(request: ProductRequest): Observable<Product> {
    return this.http.post<Product>(
      this.apiUrl,
      request
    );
  }

  update(id: number, request: ProductRequest): Observable<Product> {
    return this.http.put<Product>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}