import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/auth/auth.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {

  constructor(
    public readonly authService: AuthService,
    public readonly themeService: ThemeService,
    private readonly router: Router
  ) {
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}