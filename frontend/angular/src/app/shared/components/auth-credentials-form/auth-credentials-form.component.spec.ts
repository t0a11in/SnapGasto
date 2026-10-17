import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthCredentialsFormComponent } from './auth-credentials-form.component';

describe('AuthCredentialsFormComponent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('emits valid credentials and remembers only the email', () => {
    const fixture = TestBed.createComponent(AuthCredentialsFormComponent);
    const component = fixture.componentInstance;
    const submitted = jasmine.createSpy('submitted');
    component.submitted.subscribe(submitted);
    component.credentials.set({
      fullName: '',
      email: 'ana@example.com',
      password: 'secreto123',
      rememberPassword: true,
    });

    component.submit();

    expect(submitted).toHaveBeenCalledWith({
      fullName: '',
      email: 'ana@example.com',
      password: 'secreto123',
      rememberPassword: true,
    });
    expect(localStorage.getItem('snapgasto.auth.remembered-email')).toBe('ana@example.com');
    expect(localStorage.getItem('snapgasto.auth.remembered-password')).toBeNull();
  });

  it('toggles password visibility', () => {
    const fixture = TestBed.createComponent(AuthCredentialsFormComponent);
    fixture.detectChanges();

    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();

    expect(componentPasswordInput(fixture).type).toBe('text');
  });
});

function componentPasswordInput(fixture: ComponentFixture<AuthCredentialsFormComponent>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[type="password"], input[type="text"]') as HTMLInputElement;
}
