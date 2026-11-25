import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { Order, OrderService, OrderStatus } from '../../services/order.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, finalize, map, of, timeout } from 'rxjs';

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
  readonly updatingStatus = new Set<number>();
  private statusesChangedDuringLoad?: Map<number, OrderStatus>;
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
    {
      label: 'Pago',
      value: 'PAID',
    },
  ];
  constructor(
    private readonly orderService: OrderService,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const statusChanges = new Map<number, OrderStatus>();
    this.statusesChangedDuringLoad = statusChanges;
    this.loading = true;

    this.orderService.findAll().subscribe({
      next: (orders) => {
        if (this.statusesChangedDuringLoad !== statusChanges) return;
        this.orders = orders.map(order => {
          const status = statusChanges.get(order.id);
          return status === undefined ? order : { ...order, status };
        });
        this.statusesChangedDuringLoad = undefined;
        this.loading = false;
      },
      error: (error) => {
        if (this.statusesChangedDuringLoad !== statusChanges) return;
        this.statusesChangedDuringLoad = undefined;
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
    this.confirmationService.confirm({
      header: 'Excluir pedido',
      message: 'Tem certeza que deseja excluir este pedido?',
      icon: 'pi pi-exclamation-triangle',

      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',

      accept: () => {
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
      PAID: 'Pago',
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
      PAID: 'success',
    };

    return severities[status];
  }

  updateStatus(id: number, status: OrderStatus): void {
    if (this.updatingStatus.has(id)) return;
    this.updatingStatus.add(id);

    this.orderService.updateStatus(id, status).pipe(
      timeout(15000),
      map(order => ({ order, confirmed: true })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && [400, 401, 403, 404].includes(error.status)) {
          return of({ order: null, confirmed: true });
        }
        return this.orderService.findById(id).pipe(
          timeout(15000),
          map(order => ({ order, confirmed: order.status === status })),
          catchError(() => of({ order: null, confirmed: false })),
        );
      }),
      finalize(() => this.updatingStatus.delete(id)),
    ).subscribe(({ order, confirmed }) => {
      if (order) {
        this.statusesChangedDuringLoad?.set(id, order.status);
        this.orders = this.orders.map(current => current.id === id ? order : current);
      }
      if (order?.status === status) {
        this.messageService.add({ severity: 'success', summary: 'Sucesso',
          detail: 'Status do pedido atualizado.' });
      } else if (confirmed) {
        this.messageService.add({ severity: 'error', summary: 'Erro',
          detail: 'Não foi possível atualizar o status do pedido.' });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'Status não confirmado',
          detail: 'Não foi possível confirmar o status atual do pedido.' });
      }
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
