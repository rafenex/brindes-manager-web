import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
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
import { Company, CompanyService } from '../../features/company/services/company.service';

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
export class MainLayout implements OnInit, OnDestroy {
  company: Company | null = null;
  logoUrl: string | null = null;
  private readonly subscriptions = new Subscription();

  constructor(
    public readonly authService: AuthService,
    public readonly themeService: ThemeService,
    private readonly router: Router,
    private readonly companyService: CompanyService
  ) {
  }

  ngOnInit(): void {
    this.subscriptions.add(this.companyService.findCurrent().subscribe({
      next: company => {
        this.company = company;
        if (company.hasLogo) {
          this.subscriptions.add(this.companyService.getLogo().subscribe({
            next: blob => {
              this.logoUrl = URL.createObjectURL(blob);
            },
            error: () => { /* Keep the gift icon when the logo cannot be loaded. */ }
          }));
        }
      },
      error: () => { /* Keep the default branding when company data is unavailable. */ }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.logoUrl) {
      URL.revokeObjectURL(this.logoUrl);
      this.logoUrl = null;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
