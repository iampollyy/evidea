import { describe, expect, it } from 'vitest';

import { INITIAL_SESSION_STATE } from '@/constants/session.constants';
import { createUser } from '@/test/fixtures';
import { checkSession, sessionReducer, userCleared, userSet, userUpdated } from './sessionSlice';

describe('sessionSlice', () => {
  it('stores the signed-in user', () => {
    const user = createUser();

    expect(sessionReducer(INITIAL_SESSION_STATE, userSet(user))).toEqual({ user });
  });

  it('merges a partial update into the current user', () => {
    const state = { user: createUser() };

    const next = sessionReducer(state, userUpdated({ surname: 'Kowalska' }));

    expect(next).toEqual({ user: { ...state.user, surname: 'Kowalska' } });
    expect(state.user.surname).toBe('Novak');
  });

  it('ignores updates when nobody is signed in', () => {
    expect(sessionReducer('unauthenticated', userUpdated({ name: 'Ghost' }))).toBe(
      'unauthenticated',
    );
  });

  it('clears the user on sign-out', () => {
    expect(sessionReducer({ user: createUser() }, userCleared())).toBe('unauthenticated');
  });

  it('stores the user returned by the session check', () => {
    const user = createUser();

    expect(sessionReducer('checking', checkSession.fulfilled(user, 'request-1'))).toEqual({
      user,
    });
    expect(sessionReducer('checking', checkSession.fulfilled(null, 'request-1'))).toBe(
      'unauthenticated',
    );
  });

  it('records a failed session check and resets to checking on retry', () => {
    const failed = sessionReducer(
      'checking',
      checkSession.rejected(new Error('HTTP 500'), 'request-1'),
    );

    expect(failed).toEqual({ error: 'HTTP 500' });
    expect(sessionReducer(failed, checkSession.pending('request-2'))).toBe('checking');
  });

  it('keeps a user set by sign-in when a stale check resolves', () => {
    const state = { user: createUser() };

    expect(sessionReducer(state, checkSession.fulfilled(null, 'request-1'))).toBe(state);
  });
});
