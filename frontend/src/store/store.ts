import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { sessionReducer } from './sessionSlice';

const rootReducer = combineReducers({
  session: sessionReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const store = makeStore();
