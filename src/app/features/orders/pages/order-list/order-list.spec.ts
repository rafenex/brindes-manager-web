import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { Order, OrderService } from '../../services/order.service';
import { OrderList } from './order-list';

describe('OrderList status Pago', () => {
  const order: Order = {
    id: 1, code: 'PED-1', customerId: 2, customerName: 'Cliente', userId: 3,
    status: 'APPROVED', totalAmount: 10, notes: null, active: true,
    createdAt: '', updatedAt: '', items: [],
  };
  const paid: Order = { ...order, status: 'PAID' };
  let service: jasmine.SpyObj<OrderService>;
  let messages: jasmine.SpyObj<MessageService>;
  let list: OrderList;

  beforeEach(() => {
    service = jasmine.createSpyObj<OrderService>('OrderService', ['updateStatus', 'findById', 'findAll']);
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);
    list = new OrderList(service, {} as Router, messages, new ConfirmationService());
    list.orders = [order];
  });

  it('offers Pago and applies the acknowledged status only after saving', () => {
    const response = new Subject<Order>();
    service.updateStatus.and.returnValue(response);
    expect(list.statusOptions).toContain({ value: 'PAID', label: 'Pago' });
    expect(list.getStatusLabel('PAID')).toBe('Pago');
    list.updateStatus(1, 'PAID');
    list.updateStatus(1, 'CANCELED');
    expect(service.updateStatus).toHaveBeenCalledOnceWith(1, 'PAID');
    expect(list.orders[0].status).toBe('APPROVED');
    response.next(paid);
    response.complete();
    expect(list.orders[0].status).toBe('PAID');
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('keeps the previous status when the server rejects the change', () => {
    service.updateStatus.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    list.updateStatus(1, 'PAID');
    expect(list.orders[0].status).toBe('APPROVED');
    expect(service.findById).not.toHaveBeenCalled();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
  });

  it('reads the saved status when the update response is lost', () => {
    service.updateStatus.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    service.findById.and.returnValue(of(paid));
    list.updateStatus(1, 'PAID');
    expect(service.findById).toHaveBeenCalledOnceWith(1);
    expect(list.orders[0].status).toBe('PAID');
  });

  it('reports that the current status could not be confirmed if the read fails', () => {
    const unavailable = () => new HttpErrorResponse({ status: 503 });
    service.updateStatus.and.returnValue(throwError(unavailable));
    service.findById.and.returnValue(throwError(unavailable));
    list.updateStatus(1, 'PAID');
    expect(list.orders[0].status).toBe('APPROVED');
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'warn', detail: 'Não foi possível confirmar o status atual do pedido.',
    }));
  });

  it('warns about an uncertain result when a timed-out write has not appeared in the read yet', fakeAsync(() => {
    const response = new Subject<Order>();
    service.updateStatus.and.returnValue(response);
    service.findById.and.returnValue(of(order));
    list.updateStatus(1, 'PAID');
    tick(15000);
    expect(service.findById).toHaveBeenCalledOnceWith(1);
    expect(list.orders[0].status).toBe('APPROVED');
    expect(messages.add.calls.mostRecent().args[0].severity).toBe('warn');
  }));

  it('preserves a confirmed status when an older list arrives with other changes', () => {
    const olderList = new Subject<Order[]>();
    const response = new Subject<Order>();
    const anotherOrder = { ...order, id: 2 };
    service.findAll.and.returnValue(olderList);
    service.updateStatus.and.returnValue(response);
    list.updateStatus(1, 'PAID');
    list.loadOrders();
    response.next(paid);
    response.complete();
    olderList.next([{ ...order, notes: 'Changed' }, anotherOrder]);
    olderList.complete();
    expect(list.orders).toEqual([{ ...paid, notes: 'Changed' }, anotherOrder]);
  });
});
