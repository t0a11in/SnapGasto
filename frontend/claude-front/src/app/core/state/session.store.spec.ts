import { TestBed } from '@angular/core/testing';
import { STORAGE_KEYS } from '../config/api.config';
import { authFixture, clearStorage } from '../../../testing/test-helpers';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  beforeEach(() => clearStorage());
  afterEach(() => clearStorage());

  it('inicia sin sesión', () => {
    const store = TestBed.inject(SessionStore);
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.isAdmin()).toBeFalse();
  });

  it('persiste token y usuario, nunca contraseña', () => {
    const store = TestBed.inject(SessionStore);
    store.setSession(authFixture({ role: 'ADMIN' }));
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.isAdmin()).toBeTrue();
    const raw = localStorage.getItem(STORAGE_KEYS.session)!;
    expect(JSON.parse(raw).accessToken).toBe('token-1');
    expect(raw.toLowerCase()).not.toContain('password');
  });

  it('restaura una sesión válida guardada', () => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(authFixture()));
    const store = TestBed.inject(SessionStore);
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.user()?.email).toBe('ana@test.cl');
  });

  it('descarta datos corruptos', () => {
    localStorage.setItem(STORAGE_KEYS.session, '{"accessToken":""}');
    const store = TestBed.inject(SessionStore);
    expect(store.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('clear elimina la sesión', () => {
    const store = TestBed.inject(SessionStore);
    store.setSession(authFixture());
    store.clear();
    expect(store.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });
});
