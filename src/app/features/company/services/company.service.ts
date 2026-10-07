import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Company {
  id: number;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  hasLogo: boolean;
}

export interface UpdateCompanyRequest {
  name: string;
  address: string;
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private readonly apiUrl = '/api/company/me';

  constructor(private readonly http: HttpClient) {}

  findCurrent(): Observable<Company> {
    return this.http.get<Company>(this.apiUrl);
  }

  update(request: UpdateCompanyRequest): Observable<Company> {
    return this.http.put<Company>(this.apiUrl, request);
  }

  updateLogo(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.put<void>(
      `${this.apiUrl}/logo`,
      formData
    );
  }

  deleteLogo(): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/logo`
    );
  }

  getLogo(): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/logo`, { responseType: 'blob' });
}
}