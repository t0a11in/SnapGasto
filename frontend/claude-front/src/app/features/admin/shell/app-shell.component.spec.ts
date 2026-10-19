import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authFixture, clearStorage } from '../../../../testing/test-helpers';
import { SessionStore } from '../../../core/state/session.store';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  beforeEach(async () => {
    clearStorage();
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => clearStorage());

  const render = async () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('USER ve solo sus finanzas', async () => {
    TestBed.inject(SessionStore).setSession(authFixture({ role: 'USER' }));
    const el = await render();
    expect(el.textContent).toContain('Ingresos');
    expect(el.textContent).toContain('Gastos');
    expect(el.textContent).not.toContain('Administración');
  });

  it('ADMIN ve además los mantenedores', async () => {
    TestBed.inject(SessionStore).setSession(authFixture({ role: 'ADMIN', fullName: 'Admin Root' }));
    const el = await render();
    expect(el.textContent).toContain('Administración');
    for (const label of ['Usuarios', 'Categorías', 'Gastos de usuarios', 'Notificaciones']) {
      expect(el.textContent).toContain(label);
    }
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('AR');
  });
});
