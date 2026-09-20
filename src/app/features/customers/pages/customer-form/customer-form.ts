import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

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

  loading = false;

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly customerService: CustomerService,
    private readonly router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      companyName: [''],
      document: [''],
      email: ['', Validators.email],
      phone: ['']
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    this.customerService.create(this.form.getRawValue()).subscribe({
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