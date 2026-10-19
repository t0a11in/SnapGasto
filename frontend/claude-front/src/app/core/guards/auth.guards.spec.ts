import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authFixture, clearStorage } from '../../../testing/test-helpers';
import { SessionStore } from '../state/session.store';
import { adminGuard, authGuard, guestGuard } from './auth.guards';

describe('Guards', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  let session: SessionStore;
  let router: Router;

  const run = (guard: typeof authGuard, url = '/incomes') =>
    TestBed.runInInjectionContext(() => guard(route, state(url)));

  beforeEach(() => {
    clearStorage();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => clearStorage());

  it('authGuard redirige a /login con returnUrl', () => {
    const result = run(authGuard, '/expenses') as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fexpenses');
  });

  it('authGuard permite con sesión', () => {
    session.setSession(authFixture());
    expect(run(authGuard)).toBeTrue();
  });

  it('adminGuard bloquea a USER', () => {
    session.setSession(authFixture({ role: 'USER' }));
    expect(router.serializeUrl(run(adminGuard) as UrlTree)).toBe('/incomes');
  });

  it('adminGuard permite a ADMIN', () => {
    session.setSession(authFixture({ role: 'ADMIN' }));
    expect(run(adminGuard)).toBeTrue();
  });

  it('guestGuard saca del login a quien ya tiene sesión', () => {
    expect(run(guestGuard)).toBeTrue();
    session.setSession(authFixture());
    expect(router.serializeUrl(run(guestGuard) as UrlTree)).toBe('/incomes');
  });
});
