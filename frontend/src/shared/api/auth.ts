const LOGIN_URL = '/api/v1/auth/login';

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export async function login(credentials: LoginCredentials, signal?: AbortSignal): Promise<void> {
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
    signal,
  });

  if (!response.ok) {
    throw new AuthError(response.status, response.statusText || 'Login failed');
  }
}

export async function checkSession(signal?: AbortSignal): Promise<boolean> {
  const response = await fetch('/api/v1/me', {
    credentials: 'include',
    signal,
  });

  if (response.status === 401) return false;
  if (!response.ok) {
    throw new Error(`Session check failed: HTTP ${response.status}`);
  }

  return true;
}
