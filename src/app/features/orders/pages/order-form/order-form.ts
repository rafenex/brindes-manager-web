import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import {
  Customer,
  CustomerService,
} from '../../../customers/services/customer.service';

import {
  ProductDropdown,
  ProductService,
} from '../../../products/services/product.service';

import {
  OrderItemRequest,
  OrderRequest,
  OrderService,
} from '../../services/order.service';
import { CurrencyPipe } from '@angular/common';

interface OrderItemFormValue {
  productId: number | null;
  quantity: number | null;
  unitPrice: number | null;
  customDescription: string | null;
}

@Component({
  selector: 'app-order-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    CurrencyPipe,
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderForm implements OnInit {
  orderId: number | null = null;

  customers: Customer[] = [];
  products: ProductDropdown[] = [];
  productOptions: {
    label: string;
    value: number;
    disabled: boolean;
  }[] = [];
  loading = false;

  form: FormGroup;

  customerOptions: {
    label: string;
    value: number;
    disabled: boolean;
  }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly orderService: OrderService,
    private readonly customerService: CustomerService,
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      customerId: [null as number | null, Validators.required],
      notes: [''],
      items: this.fb.array([]),
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.orderId = Number(id);
    }
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();

    if (this.orderId) {
      this.loadOrder();
    } else {
      this.addItem();
    }
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {
    const item = this.fb.group({
      productId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [
        null as number | null,
        [Validators.required, Validators.min(0.01)],
      ],
      customDescription: [''],
    });

    this.items.push(item);
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      return;
    }

    this.items.removeAt(index);
  }

  loadCustomers(): void {
    this.customerService.findAllDropdown().subscribe({
      next: (customers) => {
        this.customerOptions = customers.map((customer) => ({
          label: customer.active ? customer.name : `${customer.name} (Inativo)`,
          value: customer.id,
          disabled: !customer.active,
        }));
      },
      error: (error) => {
        console.error('Erro ao buscar clientes:', error);
      },
    });
  }

  loadProducts(): void {
    this.productService.findAllDropdown().subscribe({
      next: (products) => {
        this.products = products;

        this.productOptions = products.map((product) => ({
          label: product.active
            ? `${product.reference} - ${product.name}`
            : `${product.reference} - ${product.name} (Inativo)`,
          value: product.id,
          disabled: !product.active,
        }));
      },
      error: (error) => {
        console.error('Erro ao buscar produtos:', error);
      },
    });
  }

  loadOrder(): void {
    if (!this.orderId) {
      return;
    }

    this.loading = true;

    this.orderService.findById(this.orderId).subscribe({
      next: (order) => {
        this.form.patchValue({
          customerId: order.customerId,
          notes: order.notes ?? '',
        });

        this.items.clear();

        order.items.forEach((item) => {
          this.items.push(
            this.fb.group({
              productId: [item.productId, Validators.required],
              quantity: [
                item.quantity,
                [Validators.required, Validators.min(1)],
              ],
              unitPrice: [
                item.unitPrice,
                [Validators.required, Validators.min(0.01)],
              ],
              customDescription: [item.customDescription ?? ''],
            })
          );
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar pedido:', error);
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.items.length === 0) {
      return;
    }

    const value = this.form.getRawValue();

    if (value.customerId === null) {
      return;
    }

    const formItems = value.items as OrderItemFormValue[];

    const items: OrderItemRequest[] = formItems.map((item) => ({
      productId: item.productId!,
      quantity: item.quantity!,
      unitPrice: item.unitPrice!,
      customDescription: item.customDescription ?? '',
    }));

    const request: OrderRequest = {
      customerId: value.customerId,
      notes: value.notes ?? '',
      items,
    };

    this.loading = true;

    if (this.orderId) {
      this.orderService.update(this.orderId, request).subscribe({
        next: () => {
          this.router.navigate(['/orders']);
        },
        error: (error) => {
          console.error('Erro ao editar pedido:', error);
          this.loading = false;
        },
      });

      return;
    }

    this.orderService.create(request).subscribe({
      next: () => {
        this.router.navigate(['/orders']);
      },
      error: (error) => {
        console.error('Erro ao cadastrar pedido:', error);
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/orders']);
  }

  onProductChange(index: number, productId: number): void {
    const product = this.products.find((product) => product.id === productId);

    if (!product) {
      return;
    }

    this.items.at(index).patchValue({
      unitPrice: product.basePrice,
    });
  }
  getItemTotal(index: number): number {
    const itemForm = this.items.at(index) as FormGroup;

    const quantity = itemForm.get('quantity')?.value ?? 0;
    const unitPrice = itemForm.get('unitPrice')?.value ?? 0;

    return quantity * unitPrice;
  }

  getOrderTotal(): number {
    return this.items.controls.reduce(
      (total, _, index) => total + this.getItemTotal(index),
      0
    );
  }
}
