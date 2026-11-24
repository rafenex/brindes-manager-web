import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription, TimeoutError } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CustomerService } from '../../services/customer.service';

type LookupField = 'street' | 'neighborhood' | 'city' | 'state';
const LOOKUP_FIELDS: LookupField[] = ['street', 'neighborhood', 'city', 'state'];

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.scss',
})
export class CustomerForm implements OnDestroy {
  form;
  loading = false;
  saving = false;
  lookupLoading = false;
  postalCodeNotice = '';
  formNotice = '';
  customerId: number | null = null;
  private readonly subscriptions = new Subscription();
  private lookupSubscription?: Subscription;
  private generation = 0;
  private destroyed = false;
  private lastCompleteCode: string | null = null;
  private readonly edits: Record<LookupField, number> = { street: 0, neighborhood: 0, city: 0, state: 0 };

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.form = this.fb.nonNullable.group({
      companyName: ['', Validators.required], name: [''],
      postalCode: [''], street: [''], number: [''], complement: [''],
      neighborhood: [''], city: [''], state: [''],
      document: [''], email: ['', Validators.email], phone: [''],
    });
    for (const field of LOOKUP_FIELDS) {
      this.subscriptions.add(this.form.controls[field].valueChanges.subscribe(() => this.edits[field]++));
    }
    this.subscriptions.add(this.form.controls.postalCode.valueChanges.subscribe(value => this.onPostalCodeChange(value)));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId = Number(id);
      this.loadCustomer();
    }
  }

  loadCustomer(): void {
    if (!this.customerId || this.loading || this.destroyed) return;
    this.loading = true;
    this.subscriptions.add(this.customerService.findById(this.customerId).subscribe({
      next: customer => {
        this.form.patchValue({
          companyName: customer.companyName ?? '', name: customer.name ?? '',
          postalCode: customer.postalCode ?? '', street: customer.street ?? '',
          number: customer.number ?? '', complement: customer.complement ?? '',
          neighborhood: customer.neighborhood ?? '', city: customer.city ?? '', state: customer.state ?? '',
          document: customer.document ?? '', email: customer.email ?? '', phone: customer.phone ?? '',
        }, { emitEvent: false });
        this.loading = false;
      },
      error: () => {
        this.formNotice = 'Não foi possível carregar o cliente. Tente novamente.';
        this.loading = false;
      },
    }));
  }

  private completeCode(value: string): string | null {
    return /^[0-9]{5}-?[0-9]{3}$/.test(value) ? value.replace('-', '') : null;
  }

  private cancelLookup(): void {
    // Invalidate before unsubscribe: teardown/finalize of an older request cannot clear a newer state.
    this.generation++;
    this.lookupSubscription?.unsubscribe();
    this.lookupSubscription = undefined;
    this.lookupLoading = false;
  }

  private onPostalCodeChange(value: string): void {
    const code = this.completeCode(value);
    if (code !== null && code === this.lastCompleteCode) return;
    this.cancelLookup();
    this.lastCompleteCode = code;
    this.postalCodeNotice = '';
    if (code === null || this.destroyed || this.saving || this.loading) return;
    const generation = this.generation;
    const edits = { ...this.edits };
    const current = () => !this.destroyed && generation === this.generation;
    this.lookupLoading = true;
    this.lookupSubscription = this.customerService.lookupPostalCode(code).pipe(
      finalize(() => { if (current()) this.lookupLoading = false; }),
    ).subscribe({
      next: address => {
        if (!current()) return;
        for (const field of LOOKUP_FIELDS) {
          if (edits[field] === this.edits[field]) {
            this.form.controls[field].setValue(address[field] ?? '', { emitEvent: false });
          }
        }
        this.postalCodeNotice = 'Consulta concluída. Confira o endereço e informe número e complemento, se necessário.';
      },
      error: (error: unknown) => {
        if (!current()) return;
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.postalCodeNotice = 'A consulta exige uma sessão autorizada. Verifique seu acesso.';
        } else if (error instanceof HttpErrorResponse && error.status === 404) {
          this.postalCodeNotice = 'CEP não encontrado. Preencha o endereço manualmente.';
        } else if (error instanceof TimeoutError || (error instanceof HttpErrorResponse && error.status === 504)) {
          this.postalCodeNotice = 'A consulta demorou demais. Preencha o endereço manualmente.';
        } else {
          this.postalCodeNotice = 'Não foi possível consultar o CEP. Preencha o endereço manualmente.';
        }
      },
    });
  }

  onPostalCodeBlur(): void {
    const value = this.form.controls.postalCode.value;
    if (value !== '' && this.completeCode(value) === null) {
      this.postalCodeNotice = 'CEP incompleto ou inválido. Você pode preencher o endereço manualmente e salvar.';
    } else if (value === '') {
      this.postalCodeNotice = '';
    }
  }

  save(): void {
    if (this.destroyed || this.saving || this.loading) return;
    const request = this.form.getRawValue();
    this.cancelLookup();
    this.onPostalCodeBlur();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formNotice = '';
    const save = this.customerId
      ? this.customerService.update(this.customerId, request)
      : this.customerService.create(request);
    this.subscriptions.add(save.subscribe({
      next: () => { this.router.navigate(['/customers']); },
      error: () => {
        this.saving = false;
        this.formNotice = 'Não foi possível salvar o cliente. Seus dados foram mantidos; tente novamente.';
      },
    }));
  }

  cancel(): void {
    this.cancelLookup();
    this.router.navigate(['/customers']);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelLookup();
    this.subscriptions.unsubscribe();
  }
}
