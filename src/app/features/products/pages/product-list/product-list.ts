import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import {
  Product,
  ProductService
} from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [
    TableModule,
    ButtonModule,
    CurrencyPipe
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit {

  products: Product[] = [];
  loading = true;

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;

    this.productService.findAll().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: error => {
        console.error('Erro ao buscar produtos:', error);
        this.loading = false;
      }
    });
  }

  newProduct(): void {
    this.router.navigate(['/products/new']);
  }

  editProduct(id: number): void {
    this.router.navigate(['/products', id, 'edit']);
  }

  deleteProduct(id: number): void {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este produto?'
    );

    if (!confirmed) {
      return;
    }

    this.productService.delete(id).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: error => {
        console.error('Erro ao excluir produto:', error);
      }
    });
  }
}