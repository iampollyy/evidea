import { describe, expect, it } from 'vitest';

import { INITIAL_SESSION_STATE } from '@/constants/session.constants';
import { createUser } from '@/test/fixtures';
import { sessionReducer } from './sessionReducer';

describe('sessionReducer', () => {
  it('stores the signed-in user', () => {
    const user = createUser();

    expect(sessionReducer(INITIAL_SESSION_STATE, { type: 'userSet', user })).toEqual({ user });
  });

  it('merges a partial update into the current user', () => {
    const state = { user: createUser() };

    const next = sessionReducer(state, { type: 'userUpdated', patch: { surname: 'Kowalska' } });

    expect(next).toEqual({ user: { ...state.user, surname: 'Kowalska' } });
    expect(state.user.surname).toBe('Novak');
  });

  it('ignores updates when nobody is signed in', () => {
    const next = sessionReducer('unauthenticated', {
      type: 'userUpdated',
      patch: { name: 'Ghost' },
    });

    expect(next).toBe('unauthenticated');
  });

  it('clears the user on sign-out', () => {
    expect(sessionReducer({ user: createUser() }, { type: 'userCleared' })).toBe('unauthenticated');
  });

  it('records a failed session check and resets to checking on retry', () => {
    const failed = sessionReducer('checking', { type: 'checkFailed', error: 'HTTP 500' });

    expect(failed).toEqual({ error: 'HTTP 500' });
    expect(sessionReducer(failed, { type: 'checkStarted' })).toBe('checking');
  });
});
