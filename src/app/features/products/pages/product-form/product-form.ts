import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import {
  ProductRequest,
  ProductService
} from '../../services/product.service';

import {
  Category,
  CategoryService
} from '../../../categories/services/category.service';

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit {

  productId: number | null = null;

  categories: Category[] = [];

  loading = false;
  loadingCategories = false;

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      reference: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      basePrice: [null as number | null, [
        Validators.required,
        Validators.min(0)
      ]],
      categoryId: [null as number | null, Validators.required]
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.productId = Number(id);
    }
  }

  ngOnInit(): void {
    this.loadCategories();

    if (this.productId) {
      this.loadProduct();
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;

    this.categoryService.findAll().subscribe({
      next: categories => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: error => {
        console.error('Erro ao buscar categorias:', error);
        this.loadingCategories = false;
      }
    });
  }

  loadProduct(): void {
    if (!this.productId) {
      return;
    }

    this.loading = true;

    this.productService.findById(this.productId).subscribe({
      next: product => {
        this.form.patchValue({
          reference: product.reference,
          name: product.name,
          description: product.description ?? '',
          basePrice: product.basePrice,
          categoryId: product.categoryId
        });

        this.loading = false;
      },
      error: error => {
        console.error('Erro ao buscar produto:', error);
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();

    if (value.basePrice === null || value.categoryId === null) {
      return;
    }

    const request: ProductRequest = {
      reference: value.reference ?? '',
      name: value.name ?? '',
      description: value.description ?? '',
      basePrice: value.basePrice,
      categoryId: value.categoryId
    };

    this.loading = true;

    if (this.productId) {
      this.productService.update(this.productId, request).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: error => {
          console.error('Erro ao editar produto:', error);
          this.loading = false;
        }
      });

      return;
    }

    this.productService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/products']);
      },
      error: error => {
        console.error('Erro ao cadastrar produto:', error);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}