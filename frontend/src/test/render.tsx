import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { SessionProvider } from '@/context/SessionProvider';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SessionProvider>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </SessionProvider>
    );
  }

  return { user: userEvent.setup(), ...render(ui, { wrapper: Wrapper, ...options }) };
}
