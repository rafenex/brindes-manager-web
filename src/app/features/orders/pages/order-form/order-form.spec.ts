import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { OrderForm } from './order-form';
import { Order, OrderService } from '../../services/order.service';
import { CustomerDropdown, CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';

const customer = (fields: Partial<CustomerDropdown> = {}): CustomerDropdown => ({
  id: 7, companyName: 'Empresa', name: null, active: true, postalCode: null,
  street: null, number: null, complement: null, neighborhood: null, city: null, state: null, ...fields,
});
const order: Order = { id: 3, code: 'PED-3', customerId: 7, customerName: 'Empresa', userId: 1,
  status: 'BUDGET', totalAmount: 10, notes: null, active: true, createdAt: '', updatedAt: '',
  items: [{ id: 1, productId: 2, productReference: 'REF', productName: 'Produto', quantity: 1,
    unitPrice: 10, totalPrice: 10, customDescription: null }] };

describe('OrderForm HU003 address', () => {
  let component: OrderForm;
  let customers: Subject<CustomerDropdown[]>;
  let orders: Subject<Order>;
  beforeEach(() => {
    customers = new Subject(); orders = new Subject();
    component = new OrderForm(new FormBuilder(),
      { findById: () => orders } as unknown as OrderService,
      { findAllDropdown: () => customers } as unknown as CustomerService,
      {} as ProductService, {} as Router,
      { snapshot: { paramMap: convertToParamMap({ id: '3' }) } } as ActivatedRoute);
  });

  for (const dropdownFirst of [true, false]) {
    it(`renders inactive customer from seven dropdown fields when dropdownFirst=${dropdownFirst}`, () => {
      component.loadCustomers(); component.loadOrder();
      const value = customer({ active: false, street: 'Rua X', number: '12', complement: 'Sala 2',
        neighborhood: 'Centro', city: 'Cidade', state: 'SP', postalCode: '01001000' });
      if (dropdownFirst) { customers.next([value]); orders.next(order); }
      else { orders.next(order); customers.next([value]); }
      expect(component.selectedCustomerAddress).toBe('Rua X, 12 — Sala 2 — Centro — Cidade/SP — CEP 01001-000');
      expect(component.customerOptions).toEqual([{ label: 'Empresa (Inativo)', value: 7, disabled: true }]);
      expect(component.form.controls['customerId'].value).toBe(7);
      expect(component.items.length).toBe(1);
      expect(component.getOrderTotal()).toBe(10);
    });
  }

  const scenarios: { fields: Partial<CustomerDropdown>; expected: string | null }[] = [
    { fields: {}, expected: null },
    { fields: { number: 'S/N' }, expected: 'S/N' },
    { fields: { state: 'SP' }, expected: 'SP' },
    { fields: { city: 'Cidade' }, expected: 'Cidade' },
    { fields: { complement: 'Fundos' }, expected: 'Fundos' },
    { fields: { neighborhood: 'Centro' }, expected: 'Centro' },
    { fields: { postalCode: '12-inválido' }, expected: 'CEP 12-inválido' },
    { fields: { postalCode: '' }, expected: null },
    { fields: { postalCode: '   ' }, expected: 'CEP    ' },
    { fields: { postalCode: '01001000' }, expected: 'CEP 01001-000' },
    { fields: { postalCode: '01001' }, expected: 'CEP 01001' },
    { fields: { postalCode: ' 01001000' }, expected: 'CEP  01001000' },
    { fields: { postalCode: '01001000 ' }, expected: 'CEP 01001000 ' },
    { fields: { postalCode: ' 01001000 ' }, expected: 'CEP  01001000 ' },
    { fields: { postalCode: ' 01001-000 ' }, expected: 'CEP  01001-000 ' },
    { fields: { postalCode: ' 12-inválido ' }, expected: 'CEP  12-inválido ' },
    { fields: { street: ' Rua X ', postalCode: ' 01001000 ' }, expected: 'Rua X — CEP  01001000 ' },
    { fields: { postalCode: '01001-000' }, expected: 'CEP 01001-000' },
    { fields: { street: ' ', city: '  ', state: 'SP' }, expected: 'SP' },
    { fields: { street: '<b>São José</b>' }, expected: '<b>São José</b>' },
  ];
  for (const { fields, expected } of scenarios) {
    it(`formats partial fields without orphan separators: ${JSON.stringify(fields)}`, () => {
      component.customers = [customer(fields)]; component.onCustomerChange(7);
      expect(component.selectedCustomerAddress).toBe(expected);
    });
  }

  it('never recovers an old address property and clears presentation for missing selection', () => {
    component.customers = [Object.assign(customer(), { address: 'Legado proibido' })];
    component.onCustomerChange(7); expect(component.selectedCustomerAddress).toBeNull();
    component.customers = [customer({ street: 'Atual' })];
    component.onCustomerChange(7); expect(component.selectedCustomerAddress).toBe('Atual');
    component.onCustomerChange(null); expect(component.selectedCustomerAddress).toBeNull();
  });
});
