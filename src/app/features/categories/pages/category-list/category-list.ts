import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import {
  Category,
  CategoryService
} from '../../services/category.service';

@Component({
  selector: 'app-category-list',
  imports: [
    TableModule,
    ButtonModule
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryList implements OnInit {

  categories: Category[] = [];
  loading = true;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;

    this.categoryService.findAll().subscribe({
      next: categories => {
        this.categories = categories;
        this.loading = false;
      },
      error: error => {
        console.error('Erro ao buscar categorias:', error);
        this.loading = false;
      }
    });
  }

  newCategory(): void {
    this.router.navigate(['/categories/new']);
  }

  editCategory(id: number): void {
    this.router.navigate(['/categories', id, 'edit']);
  }

  deleteCategory(id: number): void {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta categoria?'
    );

    if (!confirmed) {
      return;
    }

    this.categoryService.delete(id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: error => {
        console.error('Erro ao excluir categoria:', error);
      }
    });
  }
}