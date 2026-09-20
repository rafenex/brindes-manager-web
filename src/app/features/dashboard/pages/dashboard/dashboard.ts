import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';
import { OrderService } from '../../../orders/services/order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  totalCustomers = 0;
  totalProducts = 0;
  totalOrders = 0;

  loading = true;

  constructor(
    private customerService: CustomerService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;

    forkJoin({
      customers: this.customerService.findAll(),
      products: this.productService.findAll(),
      orders: this.orderService.findAll()
    }).subscribe({
      next: response => {
        this.totalCustomers = response.customers.length;
        this.totalProducts = response.products.length;
        this.totalOrders = response.orders.length;

        this.loading = false;
      },
      error: error => {
        console.error('Erro ao carregar dashboard:', error);
        this.loading = false;
      }
    });
  }
}