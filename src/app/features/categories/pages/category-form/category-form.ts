import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule
  ],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss'
})
export class CategoryForm {

  form;
  loading = false;
  categoryId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly categoryService: CategoryService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      description: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.categoryId = Number(id);
      this.loadCategory();
    }
  }

  loadCategory(): void {
    if (!this.categoryId) {
      return;
    }

    this.loading = true;

    this.categoryService.findById(this.categoryId).subscribe({
      next: category => {
        this.form.patchValue({
          name: category.name,
          description: category.description ?? ''
        });

        this.loading = false;
      },
      error: error => {
        console.error('Erro ao buscar categoria:', error);
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    const request = this.form.getRawValue();

    if (this.categoryId) {
      this.categoryService.update(this.categoryId, request).subscribe({
        next: () => {
          this.router.navigate(['/categories']);
        },
        error: error => {
          console.error('Erro ao editar categoria:', error);
          this.loading = false;
        }
      });

      return;
    }

    this.categoryService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/categories']);
      },
      error: error => {
        console.error('Erro ao cadastrar categoria:', error);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/categories']);
  }
}