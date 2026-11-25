import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  readonly form;
  readonly userId: number | null;
  ready = false;
  loading = false;
  saving = false;

  constructor(
    fb: FormBuilder,
    private readonly userService: UserService,
    private readonly router: Router,
    route: ActivatedRoute,
    private readonly messageService: MessageService,
    readonly authService: AuthService
  ) {
    const id = route.snapshot.paramMap.get('id');
    this.userId = id === null ? null : Number(id);
    this.form = fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.ready = this.userId === null;
  }

  ngOnInit(): void {
    if (this.userId === null) {
      return;
    }
    this.form.controls.password.disable();
    if (!Number.isSafeInteger(this.userId) || this.userId <= 0) {
      this.showError('Conta de usuário indisponível.');
      return;
    }

    this.loading = true;
    this.userService.findForEdit(this.userId).pipe(finalize(() => this.loading = false)).subscribe({
      next: ({ name, email }) => {
        this.form.patchValue({ name, email });
        this.ready = true;
      },
      error: (error) => this.showError(error.error?.messages?.[0] ?? 'Não foi possível carregar o usuário.'),
    });
  }

  save(): void {
    if (!this.ready || this.saving || !this.authService.isAdmin()) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    if (!name.trim()) {
      this.showError('O nome é obrigatório.');
      return;
    }

    const editing = this.userId !== null;
    const request = this.userId === null
      ? this.userService.create({ name, email, password })
      : this.userService.update(this.userId, { name, email });
    this.saving = true;
    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: editing ? 'Usuário atualizado.' : 'Usuário cadastrado.',
        });
        this.router.navigate(['/users']);
      },
      error: (error) => this.showError(error.error?.messages?.[0] ??
        (editing ? 'Não foi possível atualizar o usuário.' : 'Não foi possível cadastrar o usuário.')),
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail });
  }
}
