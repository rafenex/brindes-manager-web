import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';

import { User, UserService } from '../../services/user.service';
import { UserForm } from './user-form';

describe('UserForm', () => {
  const user: User = { id: 2, name: 'Outra conta', email: 'user@example.test', role: 'USER', active: true };
  let service: jasmine.SpyObj<UserService>;
  let form: UserForm;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('UserService', ['findForEdit', 'update', 'create']);
    service.findForEdit.and.returnValue(of(user));
    service.update.and.returnValue(of(user));
    const route = { snapshot: { paramMap: convertToParamMap({ id: '' + user.id }) } } as ActivatedRoute;
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin']);
    auth.isAdmin.and.returnValue(true);
    form = new UserForm(new FormBuilder(), service, jasmine.createSpyObj<Router>('Router', ['navigate']),
      route, new MessageService(), auth);
    form.ngOnInit();
  });

  it('loads the target and sends only name and email', () => {
    expect(service.findForEdit).toHaveBeenCalledOnceWith(user.id);
    expect(form.form.value).toEqual({ name: user.name, email: user.email });
    form.form.controls.name.setValue('Nome atualizado');
    form.save();
    expect(service.update).toHaveBeenCalledOnceWith(user.id, { name: 'Nome atualizado', email: user.email });
    expect(service.create).not.toHaveBeenCalled();
  });

  it('blocks a second save after the open form loses admin permission', () => {
    auth.isAdmin.and.returnValue(false);
    form.save();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('keeps invalid data in the form and sends no update', () => {
    form.form.controls.email.setValue('inválido');
    form.save();
    expect(form.form.controls.email.touched).toBeTrue();
    expect(service.update).not.toHaveBeenCalled();
  });
});
