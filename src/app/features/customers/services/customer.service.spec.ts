import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerRequest, CustomerService } from './customer.service';

describe('CustomerService HU003', () => {
  let service: CustomerService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CustomerService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consults only the internal GET and maps nullable/missing partial fields', () => {
    service.lookupPostalCode('01001000').subscribe(value => expect(value).toEqual({
      postalCode: '01001000', street: 'Praça da Sé', neighborhood: null, city: null, state: null,
    }));
    const request = http.expectOne('/api/postal-codes/01001000');
    expect(request.request.method).toBe('GET');
    expect(request.request.body).toBeNull();
    request.flush({ postalCode: '01001000', street: 'Praça da Sé', city: '  ' });
  });

  for (const input of ['01001-000', '123', 'abc01001000', '010010000', '']) {
    it(`rejects non-normalized lookup input ${input} without HTTP`, () => {
      let failed = false;
      service.lookupPostalCode(input).subscribe({ error: () => failed = true });
      expect(failed).toBeTrue();
      http.expectNone(request => request.url.startsWith('/api/postal-codes/'));
    });
  }

  for (const body of [null, [], 'text', { postalCode: '99999999' },
    { postalCode: '01001000', street: 3 }, { postalCode: '01001000', state: false }]) {
    it(`rejects malformed/incoherent response ${JSON.stringify(body)}`, () => {
      const error = jasmine.createSpy('error');
      service.lookupPostalCode('01001000').subscribe({ next: () => fail('invalid response applied'), error });
      http.expectOne('/api/postal-codes/01001000').flush(body);
      expect(error).toHaveBeenCalled();
    });
  }

  for (const status of [400, 401, 403, 404, 503, 504]) {
    it(`preserves HTTP ${status} for the caller without retry`, () => {
      service.lookupPostalCode('01001000').subscribe({ error: (error: HttpErrorResponse) => expect(error.status).toBe(status) });
      http.expectOne('/api/postal-codes/01001000').flush({ messages: ['Falha'] }, { status, statusText: 'Error' });
      http.expectNone('/api/postal-codes/01001000');
    });
  }

  it('times out locally at six seconds and cancels HTTP', fakeAsync(() => {
    const error = jasmine.createSpy('error');
    service.lookupPostalCode('01001000').subscribe({ error });
    const request = http.expectOne('/api/postal-codes/01001000');
    tick(5999);
    expect(error).not.toHaveBeenCalled();
    tick(1);
    expect(error).toHaveBeenCalled();
    expect(request.cancelled).toBeTrue();
  }));

  it('sends all seven manual values unchanged, including invalid CEP, and accepts a nullable response', () => {
    const payload: CustomerRequest = { companyName: 'Empresa', name: '', document: '', email: '', phone: '',
      postalCode: 'inválido', street: 'Rua', number: 'S/N', complement: 'Fundos', neighborhood: '', city: '', state: '' };
    service.update(7, payload).subscribe();
    const request = http.expectOne('/api/customers/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    expect('address' in request.request.body).toBeFalse();
    request.flush({ id: 7, ...payload, postalCode: null });
  });
});
