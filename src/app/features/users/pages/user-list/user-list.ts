import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

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

  constructor(
    private readonly userService: UserService,
    private readonly router: Router
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

  newUser(): void {
    this.router.navigate(['/users/new']);
  }
}