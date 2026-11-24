import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Observer, of, Subject, Subscription, TimeoutError } from 'rxjs';
import { CustomerForm } from './customer-form';
import { Customer, CustomerService, PostalCodeResponse } from '../../services/customer.service';

const address = (street = 'Rua da consulta'): PostalCodeResponse => ({
  postalCode: '01001000', street, neighborhood: 'Centro', city: 'São Paulo', state: 'SP',
});
const customer: Customer = { id: 7, companyName: 'Empresa', name: null, postalCode: null,
  street: null, number: null, complement: null, neighborhood: null, city: null, state: null,
  document: null, email: null, phone: null, active: true, userId: 1, createdAt: '', updatedAt: '' };

describe('CustomerForm HU003', () => {
  let service: jasmine.SpyObj<CustomerService>;
  let router: jasmine.SpyObj<Router>;
  let component: CustomerForm;
  let lookup: Subject<PostalCodeResponse>;
  let save: Subject<Customer>;
  beforeEach(() => {
    lookup = new Subject(); save = new Subject();
    service = jasmine.createSpyObj<CustomerService>('CustomerService', ['lookupPostalCode', 'findById', 'create', 'update']);
    service.lookupPostalCode.and.returnValue(lookup);
    service.create.and.returnValue(save); service.update.and.returnValue(save);
    service.findById.and.returnValue(of(customer));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    component = new CustomerForm(new FormBuilder(), service, router,
      { snapshot: { paramMap: convertToParamMap({}) } } as ActivatedRoute);
    component.form.controls.companyName.setValue('Empresa');
  });
  afterEach(() => component.ngOnDestroy());

  it('allows all seven empty fields and invalid CEP without a blocking validator', () => {
    expect(component.form.valid).toBeTrue();
    component.form.controls.postalCode.setValue('abc-12');
    component.onPostalCodeBlur();
    expect(component.postalCodeNotice).toContain('inválido');
    expect(component.form.valid).toBeTrue();
    component.save();
    expect(service.create.calls.mostRecent().args[0].postalCode).toBe('abc-12');
    expect(component.postalCodeNotice).toContain('inválido');
    expect(service.lookupPostalCode).not.toHaveBeenCalled();
  });

  it('updates an existing customer with all seven empty fields', () => {
    component.customerId = 7;
    component.save();
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).toHaveBeenCalledOnceWith(7, {
      companyName: 'Empresa', name: '', document: '', email: '', phone: '',
      postalCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    });
  });

  it('warns on save even when another existing validation prevents saving', () => {
    component.form.controls.companyName.setValue('');
    component.form.controls.postalCode.setValue('12');
    component.save();
    expect(component.postalCodeNotice).toContain('inválido');
    expect(service.create).not.toHaveBeenCalled();
  });

  it('loads nullable fields silently with no initial lookup', () => {
    component.customerId = 7; component.loadCustomer();
    expect(component.form.controls.street.value).toBe('');
    expect(component.form.controls.postalCode.value).toBe('');
    expect(service.lookupPostalCode).not.toHaveBeenCalled();
    service.findById.and.returnValue(of({ ...customer, postalCode: '01001000' }));
    component.loadCustomer();
    expect(component.form.controls.postalCode.value).toBe('01001000');
    expect(service.lookupPostalCode).not.toHaveBeenCalled();
  });

  it('looks up immediately with a standard hyphen and deduplicates the same complete CEP', () => {
    component.form.controls.postalCode.setValue('01001-000');
    expect(service.lookupPostalCode).toHaveBeenCalledOnceWith('01001000');
    expect(component.lookupLoading).toBeTrue();
    expect(component.loading).toBeFalse(); expect(component.saving).toBeFalse();
    component.form.controls.postalCode.setValue('01001000');
    component.onPostalCodeBlur();
    expect(service.lookupPostalCode).toHaveBeenCalledTimes(1);
  });

  it('applies partial success only to untouched fields, preserving number/complement and edit-return history', () => {
    component.form.patchValue({ street: 'Original', neighborhood: 'Antigo', city: 'Antiga', state: 'RJ', number: 'S/N', complement: 'Fundos' });
    component.form.controls.postalCode.setValue('01001000');
    component.form.controls.street.setValue('Alterada');
    component.form.controls.street.setValue('Original');
    component.form.controls.city.setValue('');
    lookup.next({ ...address(), neighborhood: null, city: 'Retornada', state: null }); lookup.complete();
    expect(component.form.controls.street.value).toBe('Original');
    expect(component.form.controls.city.value).toBe('');
    expect(component.form.controls.neighborhood.value).toBe('');
    expect(component.form.controls.state.value).toBe('');
    expect(component.form.controls.number.value).toBe('S/N');
    expect(component.form.controls.complement.value).toBe('Fundos');
    expect(component.lookupLoading).toBeFalse();
  });

  for (const error of [new HttpErrorResponse({ status: 404 }), new HttpErrorResponse({ status: 503 }),
    new HttpErrorResponse({ status: 504 }), new HttpErrorResponse({ status: 0 }), new TimeoutError()]) {
    it(`preserves address and permits manual saving after ${error.name}`, () => {
      component.form.controls.street.setValue('Manual');
      component.form.controls.postalCode.setValue('01001000'); lookup.error(error);
      expect(component.form.controls.street.value).toBe('Manual');
      expect(component.postalCodeNotice).toContain('manualmente');
      expect(component.lookupLoading).toBeFalse();
      component.save(); expect(service.create).toHaveBeenCalled();
    });
  }

  for (const status of [401, 403]) {
    it(`does not label authentication ${status} as postal unavailability`, () => {
      component.form.controls.postalCode.setValue('01001000');
      lookup.error(new HttpErrorResponse({ status }));
      expect(component.postalCodeNotice).toContain('sessão autorizada');
      expect(component.postalCodeNotice).not.toContain('manualmente');
    });
  }

  it('cancels A on B, old finalize does not stop B, and returning to A starts a fresh lookup', () => {
    const b = new Subject<PostalCodeResponse>();
    service.lookupPostalCode.and.returnValues(lookup, b, new Subject<PostalCodeResponse>());
    component.form.controls.postalCode.setValue('01001000');
    component.form.controls.postalCode.setValue('22222222');
    expect(lookup.observed).toBeFalse();
    expect(component.lookupLoading).toBeTrue();
    lookup.next(address('Obsoleta')); lookup.error(new Error('obsoleto'));
    expect(component.form.controls.street.value).toBe('');
    expect(component.postalCodeNotice).toBe('');
    expect(component.lookupLoading).toBeTrue();
    b.next({ ...address('Atual'), postalCode: '22222222' }); b.complete();
    expect(component.form.controls.street.value).toBe('Atual');
    component.form.controls.postalCode.setValue('01001000');
    expect(service.lookupPostalCode).toHaveBeenCalledTimes(3);
  });

  for (const value of ['123', '', 'abc01001000']) {
    it(`cancels lookup when changed to incomplete/empty/invalid ${value}`, () => {
      component.form.controls.postalCode.setValue('01001000');
      component.form.controls.postalCode.setValue(value);
      expect(lookup.observed).toBeFalse(); expect(component.lookupLoading).toBeFalse();
      lookup.next(address());
      expect(component.form.controls.street.value).toBe('');
    });
  }

  it('guards late success/error callbacks even from a source that ignores unsubscribe', () => {
    // Deliberately bypass RxJS cancellation to exercise generation checks independently of HTTP teardown.
    const callbacks: Partial<Observer<PostalCodeResponse>>[] = [];
    const uncancellable = { pipe: () => ({ subscribe: (observer: Partial<Observer<PostalCodeResponse>>) => {
      callbacks.push(observer); return new Subscription();
    } }) } as unknown as Observable<PostalCodeResponse>;
    service.lookupPostalCode.and.returnValue(uncancellable);
    component.form.controls.postalCode.setValue('01001000');
    component.form.controls.postalCode.setValue('22222222');
    callbacks[0].next?.(address('Antiga')); callbacks[0].error?.(new Error('Antigo'));
    expect(component.form.controls.street.value).toBe('');
    expect(component.postalCodeNotice).toBe(''); expect(component.lookupLoading).toBeTrue();
    component.form.controls.postalCode.setValue('12');
    callbacks[1].next?.(address('Tardia')); callbacks[1].error?.(new Error('Tardio'));
    expect(component.form.controls.street.value).toBe('');
    expect(component.postalCodeNotice).toBe(''); expect(component.lookupLoading).toBeFalse();
  });

  it('takes an immediate save snapshot, cancels lookup, rejects double save, and keeps values after save failure', () => {
    component.form.patchValue({ street: 'Manual', number: '12', complement: 'Sala' });
    component.form.controls.postalCode.setValue('01001000');
    component.save(); component.save();
    expect(service.create).toHaveBeenCalledTimes(1);
    const payload = service.create.calls.mostRecent().args[0];
    expect(payload.street).toBe('Manual'); expect(payload.number).toBe('12');
    expect(payload.complement).toBe('Sala'); expect(payload.postalCode).toBe('01001000');
    expect(lookup.observed).toBeFalse(); expect(component.lookupLoading).toBeFalse();
    expect(component.saving).toBeTrue();
    lookup.next(address('Tardia'));
    save.error(new Error('save failed'));
    expect(component.saving).toBeFalse(); expect(component.form.controls.street.value).toBe('Manual');
    expect(payload.street).toBe('Manual');
    expect(component.formNotice).toContain('mantidos');
    expect(service.lookupPostalCode).toHaveBeenCalledTimes(1);
  });

  it('cancels lookup and load/save subscriptions on destruction', () => {
    component.form.controls.postalCode.setValue('01001000'); component.ngOnDestroy();
    expect(lookup.observed).toBeFalse();
    lookup.next(address()); expect(component.form.controls.street.value).toBe('');
    component.save(); expect(service.create).not.toHaveBeenCalled();
  });
});

describe('CustomerForm HU003 accessible template', () => {
  let fixture: ComponentFixture<CustomerForm>;
  let lookup: Subject<PostalCodeResponse>;
  beforeEach(async () => {
    lookup = new Subject();
    await TestBed.configureTestingModule({
      imports: [CustomerForm],
      providers: [
        { provide: CustomerService, useValue: { lookupPostalCode: () => lookup } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerForm); fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  it('associates a live notice and keeps fields/save available during lookup', () => {
    fixture.componentInstance.form.patchValue({ companyName: 'Empresa', postalCode: '01001-000' });
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const cep = root.querySelector<HTMLInputElement>('#postalCode')!;
    const notice = root.querySelector('#postal-code-notice')!;
    expect(cep.getAttribute('aria-describedby')).toBe(notice.id);
    expect(notice.getAttribute('aria-live')).toBe('polite');
    expect(notice.textContent).toContain('Consultando');
    expect(root.querySelector<HTMLFieldSetElement>('fieldset')!.disabled).toBeFalse();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBeFalse();
    for (const id of ['postalCode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state']) {
      expect(root.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(root.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(root.querySelector('#address')).toBeNull();
    fixture.componentInstance.form.controls.postalCode.setValue('12');
    cep.dispatchEvent(new Event('blur')); fixture.detectChanges();
    expect(notice.textContent).toContain('inválido');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBeFalse();
  });
});
