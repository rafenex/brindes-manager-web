import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private readonly apiUrl = '/api/users';

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }
}