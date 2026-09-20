import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Category, CategoryService } from '../../services/category.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-category-list',
  imports: [TableModule, ButtonModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList implements OnInit {
  categories: Category[] = [];
  loading = true;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;

    this.categoryService.findAll().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar categorias:', error);
        this.loading = false;
      },
    });
  }

  newCategory(): void {
    this.router.navigate(['/categories/new']);
  }

  editCategory(id: number): void {
    this.router.navigate(['/categories', id, 'edit']);
  }

  deleteCategory(id: number): void {
    this.confirmationService.confirm({
      header: 'Excluir categoria',
      message: 'Tem certeza que deseja excluir esta categoria?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',

      accept: () => {
        this.categoryService.delete(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Categoria excluída.',
            });

            this.loadCategories();
          },
          error: (error) => {
            console.error('Erro ao excluir categoria:', error);

            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível excluir a categoria.',
            });
          },
        });
      },
    });
  }
}
