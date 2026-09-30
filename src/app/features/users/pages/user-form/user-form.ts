import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm {

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.userService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Usuário cadastrado.',
        });

        this.router.navigate(['/users']);
      },
      error: (error) => {
        console.error('Erro ao cadastrar usuário:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível cadastrar o usuário.',
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}