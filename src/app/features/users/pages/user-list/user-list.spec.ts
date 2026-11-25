import { Router } from '@angular/router';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { User, UserService } from '../../services/user.service';
import { UserList } from './user-list';

describe('UserList', () => {
  const self: User = { id: 1, name: 'Admin', email: 'admin@example.test', role: 'ADMIN', active: true };
  const peer: User = { ...self, id: 2, name: 'Outro admin', email: 'peer@example.test' };
  let users: jasmine.SpyObj<UserService>;
  let auth: jasmine.SpyObj<AuthService>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  let list: UserList;

  beforeEach(() => {
    users = jasmine.createSpyObj('UserService', ['findAll', 'delete']);
    auth = jasmine.createSpyObj('AuthService', ['isAdmin', 'getUserId']);
    confirmation = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    auth.isAdmin.and.returnValue(true);
    auth.getUserId.and.returnValue(self.id);
    users.findAll.and.returnValue(of([self]));
    users.delete.and.returnValue(of(undefined));
    list = new UserList(users, jasmine.createSpyObj<Router>('Router', ['navigate']), auth, confirmation, new MessageService());
    list.users = [self, peer];
  });

  it('offers actions for another admin in the list and hides actions for self or a non-admin session', () => {
    expect(list.canManage(self)).toBeFalse();
    expect(list.canManage(peer)).toBeTrue();
    auth.isAdmin.and.returnValue(false);
    expect(list.canManage(peer)).toBeFalse();
  });

  it('does not send a deletion if permission is lost while confirmation is open', () => {
    list.deleteUser(peer);
    auth.isAdmin.and.returnValue(false);
    confirmation.confirm.calls.mostRecent().args[0].accept?.();
    expect(users.delete).not.toHaveBeenCalled();
  });

  it('identifies the account and reloads the list only after confirmation', () => {
    list.deleteUser(self);
    expect(confirmation.confirm).not.toHaveBeenCalled();

    list.deleteUser(peer);
    const dialog: Confirmation = confirmation.confirm.calls.mostRecent().args[0];
    expect(dialog.message).toContain(peer.email);
    expect(users.delete).not.toHaveBeenCalled();
    expect(list.users).toEqual([self, peer]);

    dialog.accept?.();
    expect(users.delete).toHaveBeenCalledOnceWith(peer.id);
    expect(users.findAll).toHaveBeenCalledTimes(1);
    expect(list.users).toEqual([self]);
  });
});
