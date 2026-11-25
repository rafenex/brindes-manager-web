import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';

import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  imports: [
    TableModule,
    ButtonModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {

  users: User[] = [];
  loading = true;
  deletingId: number | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
    readonly authService: AuthService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;

    this.userService.findAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar usuários:', error);
        this.loading = false;
      }
    });
  }

  canManage(user: User): boolean {
    const actorId = this.authService.getUserId();
    return this.authService.isAdmin() && Number.isSafeInteger(actorId) && actorId !== user.id;
  }

  editUser(user: User): void {
    if (this.canManage(user)) {
      this.router.navigate(['/users', user.id, 'edit']);
    }
  }

  deleteUser(user: User): void {
    if (!this.canManage(user) || this.deletingId !== null) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Excluir usuário',
      message: `Excluir ${user.name} (${user.email})? Essa conta perderá acesso ao sistema.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (!this.canManage(user)) {
          return;
        }
        this.deletingId = user.id;
        this.userService.delete(user.id).pipe(finalize(() => this.deletingId = null)).subscribe({
          next: () => {
            this.users = this.users.filter(({ id }) => id !== user.id);
            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Usuário excluído.' });
            this.loadUsers();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: error.error?.messages?.[0] ?? 'Não foi possível excluir o usuário.',
            });
          },
        });
      },
    });
  }

  newUser(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/users/new']);
    }
  }
}