import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Modal, type ModalProps } from './Modal';

function ModalHarness(props: Partial<ModalProps>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open dialog
      </button>
      {isOpen && (
        <Modal label="Add patient" onClose={() => setIsOpen(false)} {...props}>
          <button type="button">First</button>
          <input aria-label="Name" />
          <button type="button" disabled>
            Disabled
          </button>
          <button type="button" onClick={() => setIsOpen(false)}>
            Last
          </button>
        </Modal>
      )}
    </>
  );
}

async function openModal(props: Partial<ModalProps> = {}) {
  const user = userEvent.setup();
  render(<ModalHarness {...props} />);
  await user.click(screen.getByRole('button', { name: 'Open dialog' }));
  return user;
}

describe('Modal', () => {
  it('opens as a labelled modal dialog and moves focus inside', async () => {
    await openModal();

    const dialog = screen.getByRole('dialog', { name: 'Add patient' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab focus inside the dialog, skipping disabled controls', async () => {
    const user = await openModal();
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('closes on Escape and returns focus to the element that opened it', async () => {
    const user = await openModal();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus();
  });

  it('ignores Escape while it is not dismissible', async () => {
    const onClose = vi.fn();
    const user = await openModal({ dismissible: false, onClose });

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('focuses the dialog itself when it has no focusable content', async () => {
    const user = userEvent.setup();
    render(
      <Modal label="Saving">
        <p>Please wait…</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Saving' });
    expect(dialog).toHaveFocus();
    await user.tab();
    expect(dialog).toHaveFocus();
  });
});
