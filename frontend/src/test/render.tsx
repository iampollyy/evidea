import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { makeStore, type AppStore, type RootState } from '@/store/store';
import { SessionCheck } from './SessionCheck';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    preloadedState,
    store = makeStore(preloadedState),
    ...options
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <SessionCheck>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </SessionCheck>
      </Provider>
    );
  }

  return { store, user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) };
}
