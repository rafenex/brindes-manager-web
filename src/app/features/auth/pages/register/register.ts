import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  cadastrar(): void {
    if (this.form.invalid) {
      return;
    }

    const request = this.form.getRawValue();

    this.authService.register(request).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Erro no cadastro:', error);
      },
    });
  }
}