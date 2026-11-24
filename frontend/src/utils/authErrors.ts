import { AuthError } from '@/api/auth';
import { INVALID_INVITATION_MESSAGE } from '@/constants/auth.constants';

export function getLoginErrorMessage(error: unknown) {
  if (error instanceof AuthError && (error.status === 400 || error.status === 401)) {
    return 'Invalid email or password';
  }
  if (error instanceof AuthError && error.status === 403) {
    return 'Your account has been deactivated. Please contact an administrator.';
  }
  return 'Something went wrong. Please try again.';
}

export function getSetPasswordErrorMessage(error: unknown) {
  if (error instanceof AuthError && error.code === 'INVITATION_INVALID') {
    return INVALID_INVITATION_MESSAGE;
  }
  if (error instanceof AuthError && error.status === 422) {
    return 'Password does not meet the requirements.';
  }
  return 'Something went wrong. Please try again.';
}
