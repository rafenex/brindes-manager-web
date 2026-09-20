import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Product, ProductService } from '../../services/product.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-product-list',
  imports: [TableModule, ButtonModule, CurrencyPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  products: Product[] = [];
  loading = true;

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;

    this.productService.findAll().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar produtos:', error);
        this.loading = false;
      },
    });
  }

  newProduct(): void {
    this.router.navigate(['/products/new']);
  }

  editProduct(id: number): void {
    this.router.navigate(['/products', id, 'edit']);
  }

  deleteProduct(id: number): void {
    this.confirmationService.confirm({
      header: 'Excluir produto',
      message: 'Tem certeza que deseja excluir este produto?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',

      accept: () => {
        this.productService.delete(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Produto excluído.',
            });

            this.loadProducts();
          },
          error: (error) => {
            console.error('Erro ao excluir produto:', error);

            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível excluir o produto.',
            });
          },
        });
      },
    });
  }
}
