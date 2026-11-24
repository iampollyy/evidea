import { DOCTOR_ROLES } from './doctors.types';
import type { AcceptInvitationInput, CurrentUser, LoginCredentials } from './auth.types';

const LOGIN_URL = '/api/v1/auth/login';
const CURRENT_USER_URL = '/api/v1/me';
const LOGOUT_URL = '/api/v1/auth/logout';
const ACCEPT_INVITATION_URL = '/api/v1/auth/invitations/accept';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCurrentUser(value: unknown): value is CurrentUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.surname === 'string' &&
    typeof value.email === 'string' &&
    (DOCTOR_ROLES as readonly unknown[]).includes(value.role) &&
    (typeof value.avatarUrl === 'string' || value.avatarUrl === null)
  );
}

async function parseUser(response: Response, errorPrefix: string): Promise<CurrentUser> {
  const user: unknown = await response.json();
  if (!isCurrentUser(user)) {
    throw new Error(`${errorPrefix}: invalid user response`);
  }
  return user;
}

export class AuthError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    return isRecord(body) && typeof body.code === 'string' ? body.code : null;
  } catch {
    return null;
  }
}

export async function login(
  credentials: LoginCredentials,
  signal?: AbortSignal,
): Promise<CurrentUser> {
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

  return parseUser(response, 'Unable to sign in');
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser | null> {
  const response = await fetch(CURRENT_USER_URL, {
    credentials: 'include',
    signal,
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Unable to verify your session: HTTP ${response.status}`);
  }

  return parseUser(response, 'Unable to verify your session');
}

export async function logout(signal?: AbortSignal): Promise<void> {
  const response = await fetch(LOGOUT_URL, {
    method: 'POST',
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to sign out: HTTP ${response.status}`);
  }
}

export async function acceptInvitation(
  { token, password }: AcceptInvitationInput,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(ACCEPT_INVITATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, password }),
    signal,
  });

  if (!response.ok) {
    throw new AuthError(
      response.status,
      response.statusText || 'Unable to set password',
      await readErrorCode(response),
    );
  }
}
