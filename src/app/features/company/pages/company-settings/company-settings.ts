import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Company, CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-company-settings',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './company-settings.html',
  styleUrl: './company-settings.scss',
})
export class CompanySettings implements OnInit, OnDestroy {
  loading = false;
  logoLoading = false;
  selectedLogo: File | null = null;
  logoPreviewUrl: string | null = null;
  company: Company | null = null;

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly companyService: CompanyService,
    private readonly messageService: MessageService
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      address: [''],
      email: ['', Validators.email],
      phone: [''],
    });
  }

  ngOnInit(): void {
    this.loadCompany();
  }

  ngOnDestroy(): void {
    this.clearLogoPreview();
  }

  loadCompany(): void {
    this.loading = true;
    this.companyService.findCurrent().subscribe({
      next: company => {
        this.company = company;
        this.form.patchValue({
          name: company.name,
          address: company.address ?? '',
          email: company.email ?? '',
          phone: company.phone ?? '',
        });
        if (company.hasLogo) this.loadLogo();
        this.loading = false;
      },
      error: () => this.loading = false,
    });
  }

  save(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.companyService.update(this.form.getRawValue()).subscribe({
      next: company => {
        this.company = company;
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Dados da empresa atualizados.',
        });
      },
      error: () => this.loading = false,
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.selectedLogo = file;
    this.clearLogoPreview();
    this.logoPreviewUrl = URL.createObjectURL(file);
  }

  saveLogo(): void {
    if (!this.selectedLogo) return;

    this.logoLoading = true;
    this.companyService.updateLogo(this.selectedLogo).subscribe({
      next: () => {
        this.selectedLogo = null;
        this.logoLoading = false;
        this.loadLogo();
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Logo atualizada.',
        });
      },
      error: () => this.logoLoading = false,
    });
  }

  deleteLogo(): void {
    this.companyService.deleteLogo().subscribe({
      next: () => {
        this.selectedLogo = null;
        this.clearLogoPreview();
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Logo removida.',
        });
      }
    });
  }

  private loadLogo(): void {
    this.companyService.getLogo().subscribe(blob => {
      this.clearLogoPreview();
      this.logoPreviewUrl = URL.createObjectURL(blob);
    });
  }

  private clearLogoPreview(): void {
    if (this.logoPreviewUrl) URL.revokeObjectURL(this.logoPreviewUrl);
    this.logoPreviewUrl = null;
  }
}