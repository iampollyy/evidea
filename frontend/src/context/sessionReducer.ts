import type { SessionAction, SessionState } from '@/shared/types/session.types';

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'checkStarted':
      return 'checking';
    case 'checkFailed':
      return { error: action.error };
    case 'userSet':
      return { user: action.user };
    case 'userUpdated':
      if (typeof state !== 'object' || !('user' in state)) return state;
      return { user: { ...state.user, ...action.patch } };
    case 'userCleared':
      return 'unauthenticated';
  }
}
