import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm, type LoginFormProps } from './LoginForm';

function renderLoginForm(props: Partial<LoginFormProps> = {}) {
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} {...props} />);

  return {
    user: userEvent.setup(),
    onSubmit,
    email: screen.getByLabelText('Email Address'),
    password: screen.getByLabelText('Password'),
    submit: screen.getByRole('button', { name: /login|signing in/i }),
  };
}

describe('LoginForm', () => {
  it('renders an accessible form with labelled fields', () => {
    renderLoginForm();

    expect(screen.getByRole('form', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('blocks submission of empty fields, shows errors and focuses the first invalid field', async () => {
    const { user, onSubmit, email, password, submit } = renderLoginForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Email address is required');
    expect(password).toHaveAccessibleDescription('Password is required');
  });

  it('validates a field once the user leaves it', async () => {
    const { user, email } = renderLoginForm();

    await user.type(email, 'not-an-email');
    expect(email).not.toHaveAttribute('aria-invalid');

    await user.tab();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Enter a valid email address');
  });

  it('submits trimmed values when the form is valid', async () => {
    const { user, onSubmit, email, password } = renderLoginForm();

    await user.type(email, '  doctor@clinic.example ');
    await user.type(password, 'Secret#2026{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'doctor@clinic.example',
      password: 'Secret#2026',
    });
  });

  it('announces a server error passed through submitError', () => {
    renderLoginForm({ submitError: 'Invalid email or password' });

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('disables input and ignores repeated submits while a request is in flight', async () => {
    const { user, onSubmit, email, password, submit } = renderLoginForm({
      isSubmitting: true,
      defaultValues: { email: 'doctor@clinic.example', password: 'Secret#2026' },
    });

    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Signing in…');
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    expect(email).toBeDisabled();

    await user.type(password, '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('toggles password visibility with a keyboard-accessible toggle button', async () => {
    const { user, password } = renderLoginForm();
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(password).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});
