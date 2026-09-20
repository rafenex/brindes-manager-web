import { Component, OnInit } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';

import { Customer, CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-list',
  imports: [TableModule, ButtonModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList implements OnInit {
  customers: Customer[] = [];
  loading = true;

  constructor(
    private readonly customerService: CustomerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  newCustomer(): void {
    this.router.navigate(['/customers/new']);
  }

  loadCustomers(): void {
    this.loading = true;

    this.customerService.findAll().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar clientes:', error);
        this.loading = false;
      },
    });
  }
}
