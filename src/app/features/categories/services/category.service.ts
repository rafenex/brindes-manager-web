import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  description: string;
}

export interface CategoryDropdown {
  id: number;
  name: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly apiUrl = '/api/categories';

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  findById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  create(request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, request);
  }

  update(id: number, request: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  findAllDropdown(): Observable<CategoryDropdown[]> {
    return this.http.get<CategoryDropdown[]>(`${this.apiUrl}/dropdown`);
  }
}
