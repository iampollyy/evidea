import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when activated with mouse, Enter and Space', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('does not submit a surrounding form unless type="submit" is set', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={(event) => handleSubmit(event.nativeEvent as SubmitEvent)}>
        <Button>Cancel</Button>
        <Button type="submit">Send</Button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks and is skipped by Tab when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <>
        <Button disabled onClick={handleClick}>
          Delete
        </Button>
        <Button>Next</Button>
      </>,
    );

    const disabledButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(disabledButton);
    await user.tab();

    expect(disabledButton).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('exposes an icon-only button by its aria-label and hides the icon from assistive tech', () => {
    render(<Button icon={<span data-testid="icon">x</span>} aria-label="Close dialog" />);

    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toHaveAccessibleName('Close dialog');
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('passes native attributes such as aria-pressed to the button element', () => {
    render(<Button aria-pressed>Bold</Button>);

    expect(screen.getByRole('button', { name: 'Bold', pressed: true })).toBeInTheDocument();
  });
});
