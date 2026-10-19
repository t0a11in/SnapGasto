import { AuthResponse, UserResponse } from '../app/core/models';

export const TEST_API = 'http://api.test/api';

export const userFixture = (overrides: Partial<UserResponse> = {}): UserResponse => ({
  id: 'u-1',
  fullName: 'Ana Pérez',
  email: 'ana@test.cl',
  role: 'USER',
  ...overrides,
});

export const authFixture = (overrides: Partial<UserResponse> = {}, token = 'token-1'): AuthResponse => ({
  accessToken: token,
  user: userFixture(overrides),
});

/** localStorage limpio entre pruebas. */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch {
    /* noop */
  }
}
