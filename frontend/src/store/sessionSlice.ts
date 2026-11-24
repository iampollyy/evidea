import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { getCurrentUser } from '@/api/auth';
import { INITIAL_SESSION_STATE, UNKNOWN_SESSION_ERROR } from '@/constants/session.constants';
import type { CurrentUser } from '@/shared/types/auth.types';
import type { CurrentUserPatch, SessionState } from '@/shared/types/session.types';

export const checkSession = createAsyncThunk('session/check', (_: void, { signal }) =>
  getCurrentUser(signal),
);

const sessionSlice = createSlice({
  name: 'session',
  initialState: INITIAL_SESSION_STATE as SessionState,
  reducers: {
    userSet: (_state, action: PayloadAction<CurrentUser>) => ({ user: action.payload }),
    userUpdated: (state, action: PayloadAction<CurrentUserPatch>) => {
      if (typeof state === 'object' && 'user' in state) {
        Object.assign(state.user, action.payload);
        return;
      }
      return state;
    },
    userCleared: () => 'unauthenticated' as SessionState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSession.pending, () => 'checking' as SessionState)
      .addCase(checkSession.fulfilled, (state, action) => {
        if (state !== 'checking') return state;
        return action.payload ? { user: action.payload } : 'unauthenticated';
      })
      .addCase(checkSession.rejected, (state, action) => {
        if (state !== 'checking' || action.meta.aborted) return state;
        return { error: action.error.message ?? UNKNOWN_SESSION_ERROR };
      });
  },
  selectors: {
    selectSessionState: (state) => state,
  },
});

export const { userSet, userUpdated, userCleared } = sessionSlice.actions;
export const { selectSessionState } = sessionSlice.selectors;
export const sessionReducer = sessionSlice.reducer;
