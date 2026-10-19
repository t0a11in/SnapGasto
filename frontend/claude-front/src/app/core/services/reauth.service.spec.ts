import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { authFixture, clearStorage } from '../../../testing/test-helpers';
import { SessionStore } from '../state/session.store';
import { AuthService } from './auth.service';
import { ReauthService } from './reauth.service';

describe('ReauthService', () => {
  let modal: jasmine.SpyObj<NgbModal>;
  let service: ReauthService;
  let session: SessionStore;
  let auth: AuthService;
  let resolveModal: (v: unknown) => void;
  let rejectModal: (v: unknown) => void;

  beforeEach(() => {
    clearStorage();
    modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    modal.open.and.callFake(() => {
      const result = new Promise((res, rej) => {
        resolveModal = res;
        rejectModal = rej;
      });
      return { result } as unknown as NgbModalRef;
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: NgbModal, useValue: modal }],
    });
    service = TestBed.inject(ReauthService);
    session = TestBed.inject(SessionStore);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => clearStorage());

  it('abre un único modal para llamadas concurrentes', async () => {
    session.setSession(authFixture());
    const results: boolean[] = [];
    service.reauthenticate().subscribe((r) => results.push(r));
    service.reauthenticate().subscribe((r) => results.push(r));
    expect(modal.open).toHaveBeenCalledTimes(1);
    expect(service.inProgress).toBeTrue();
    resolveModal(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(results).toEqual([true, true]);
    expect(service.inProgress).toBeFalse();
  });

  it('cierra sesión si el usuario cancela', async () => {
    session.setSession(authFixture());
    const logout = spyOn(auth, 'logout');
    let result: boolean | undefined;
    service.reauthenticate().subscribe((r) => (result = r));
    rejectModal('cancel');
    await new Promise((r) => setTimeout(r));
    expect(result).toBeFalse();
    expect(logout).toHaveBeenCalled();
  });

  it('sin usuario en sesión no abre el modal', () => {
    const logout = spyOn(auth, 'logout');
    let result: boolean | undefined;
    service.reauthenticate().subscribe((r) => (result = r));
    expect(modal.open).not.toHaveBeenCalled();
    expect(result).toBeFalse();
    expect(logout).toHaveBeenCalled();
  });

  it('permite un nuevo modal después de terminar el anterior', async () => {
    session.setSession(authFixture());
    service.reauthenticate().subscribe();
    resolveModal(true);
    await new Promise((r) => setTimeout(r));
    service.reauthenticate().subscribe();
    expect(modal.open).toHaveBeenCalledTimes(2);
  });
});
