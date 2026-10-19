export type Role = 'ADMIN' | 'USER';

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

export interface TokenStatusResponse {
  tokenAlive: boolean;
}
