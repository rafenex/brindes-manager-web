import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {

  private readonly storageKey = 'brindes_theme';
  private dark = false;

  initialize(): void {
    this.dark = localStorage.getItem(this.storageKey) === 'dark';
    this.applyTheme();
  }

  isDark(): boolean {
    return this.dark;
  }

  toggle(): void {
    this.dark = !this.dark;

    localStorage.setItem(
      this.storageKey,
      this.dark ? 'dark' : 'light'
    );

    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle(
      'app-dark',
      this.dark
    );
  }
}