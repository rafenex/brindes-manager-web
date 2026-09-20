import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { CustomerService } from '../../../customers/services/customer.service';

@Component({
  selector: 'app-dashboard',
  imports: [ButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly customerService: CustomerService
  ) {}


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
