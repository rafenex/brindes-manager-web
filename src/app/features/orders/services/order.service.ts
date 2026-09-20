import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type OrderStatus =
  | 'BUDGET'
  | 'APPROVED'
  | 'IN_PRODUCTION'
  | 'DELIVERED'
  | 'CANCELED';

export interface OrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  customDescription: string;
}

export interface OrderRequest {
  customerId: number;
  notes: string;
  items: OrderItemRequest[];
}

export interface OrderItem {
  id: number;
  productId: number;
  productReference: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customDescription: string | null;
}

export interface Order {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  userId: number;
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl = '/api/orders';

  constructor(private readonly http: HttpClient) {
  }

  findAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  findById(id: number): Observable<Order> {
    return this.http.get<Order>(
      `${this.apiUrl}/${id}`
    );
  }

  create(request: OrderRequest): Observable<Order> {
    return this.http.post<Order>(
      this.apiUrl,
      request
    );
  }

  update(id: number, request: OrderRequest): Observable<Order> {
    return this.http.put<Order>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${id}/pdf`,
      {
        responseType: 'blob'
      }
    );
  }
}