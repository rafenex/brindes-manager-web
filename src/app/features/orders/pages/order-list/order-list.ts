import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { Order, OrderService, OrderStatus } from '../../services/order.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-order-list',
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    SelectModule,
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList implements OnInit {
  orders: Order[] = [];
  loading = true;
  statusOptions: {
    label: string;
    value: OrderStatus;
  }[] = [
    {
      label: 'Orçamento',
      value: 'BUDGET',
    },
    {
      label: 'Aprovado',
      value: 'APPROVED',
    },
    {
      label: 'Em produção',
      value: 'IN_PRODUCTION',
    },
    {
      label: 'Entregue',
      value: 'DELIVERED',
    },
    {
      label: 'Cancelado',
      value: 'CANCELED',
    },
  ];
  constructor(
    private readonly orderService: OrderService,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;

    this.orderService.findAll().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao buscar pedidos:', error);
        this.loading = false;
      },
    });
  }

  newOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  editOrder(id: number): void {
    this.router.navigate(['/orders', id, 'edit']);
  }

  deleteOrder(id: number): void {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este pedido?'
    );

    if (!confirmed) {
      return;
    }

    this.orderService.delete(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pedido excluído.',
        });

        this.loadOrders();
      },
      error: (error) => {
        console.error('Erro ao excluir pedido:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível excluir o pedido.',
        });
      },
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      BUDGET: 'Orçamento',
      APPROVED: 'Aprovado',
      IN_PRODUCTION: 'Em produção',
      DELIVERED: 'Entregue',
      CANCELED: 'Cancelado',
    };

    return labels[status];
  }

  getStatusSeverity(
    status: OrderStatus
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<
      OrderStatus,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      BUDGET: 'secondary',
      APPROVED: 'info',
      IN_PRODUCTION: 'warn',
      DELIVERED: 'success',
      CANCELED: 'danger',
    };

    return severities[status];
  }

  updateStatus(id: number, status: OrderStatus): void {
    this.orderService.updateStatus(id, status).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Status do pedido atualizado.',
        });

        this.loadOrders();
      },
      error: (error) => {
        console.error('Erro ao atualizar status:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível atualizar o status do pedido.',
        });
      },
    });
  }

  downloadPdf(id: number): void {
    this.orderService.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `pedido-${id}.pdf`;

        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erro ao baixar PDF:', error);
      },
    });
  }
}
