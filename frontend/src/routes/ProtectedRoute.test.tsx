import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentUser } from '@/api/auth';
import { createUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { ROUTES } from './paths';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }));

const getCurrentUserMock = vi.mocked(getCurrentUser);

function renderGuardedRoute(requiredRole?: 'admin' | 'clinician') {
  return renderWithProviders(
    <Routes>
      <Route
        path="/private"
        element={
          <ProtectedRoute requiredRole={requiredRole}>
            <h1>Private area</h1>
          </ProtectedRoute>
        }
      />
      <Route path={ROUTES.login} element={<h1>Login page</h1>} />
      <Route path={ROUTES.forbidden} element={<h1>Forbidden page</h1>} />
    </Routes>,
    { route: '/private' },
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
  });

  it('shows a status while checking and then renders the protected content', async () => {
    getCurrentUserMock.mockResolvedValue(createUser());
    renderGuardedRoute();

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session…');
    expect(await screen.findByRole('heading', { name: 'Private area' })).toBeInTheDocument();
  });

  it('redirects to the login page when there is no session', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    renderGuardedRoute();

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });

  it('redirects to the forbidden page when the role does not match', async () => {
    getCurrentUserMock.mockResolvedValue(createUser({ role: 'clinician' }));
    renderGuardedRoute('admin');

    expect(await screen.findByRole('heading', { name: 'Forbidden page' })).toBeInTheDocument();
  });

  it('shows the error and recovers after a successful retry', async () => {
    getCurrentUserMock
      .mockRejectedValueOnce(new Error('Unable to verify your session: HTTP 503'))
      .mockResolvedValueOnce(createUser());
    const { user } = renderGuardedRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 503');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Private area' })).toBeInTheDocument();
    expect(getCurrentUserMock).toHaveBeenCalledTimes(2);
  });
});
