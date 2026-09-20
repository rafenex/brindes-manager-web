import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.scss'
})
export class CustomerForm {

  form;
  loading = false;
  customerId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      companyName: [''],
      document: [''],
      email: ['', Validators.email],
      phone: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.customerId = Number(id);
      this.loadCustomer();
    }
  }

  loadCustomer(): void {
    if (!this.customerId) {
      return;
    }

    this.loading = true;

    this.customerService.findById(this.customerId).subscribe({
      next: customer => {
        this.form.patchValue({
          name: customer.name,
          companyName: customer.companyName ?? '',
          document: customer.document ?? '',
          email: customer.email ?? '',
          phone: customer.phone ?? ''
        });

        this.loading = false;
      },
      error: error => {
        console.error('Erro ao buscar cliente:', error);
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    const request = this.form.getRawValue();

    if (this.customerId) {
      this.customerService.update(this.customerId, request).subscribe({
        next: () => {
          this.router.navigate(['/customers']);
        },
        error: error => {
          console.error('Erro ao editar cliente:', error);
          this.loading = false;
        }
      });

      return;
    }

    this.customerService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: error => {
        console.error('Erro ao cadastrar cliente:', error);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/customers']);
  }
}