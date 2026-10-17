import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './config/api-base-url.token';
import { TokenStatusLogic } from './token-status-logic';

describe('TokenStatusLogic', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: API_BASE_URL, useValue: 'http://api.test/api' },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it('should create an instance', () => {
    expect(TestBed.inject(TokenStatusLogic)).toBeTruthy();
  });
});
