import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SetPasswordForm } from './SetPasswordForm';

const meta = {
  title: 'Components/SetPasswordForm',
  component: SetPasswordForm,
  args: {
    onSubmit: fn(),
    isSubmitting: false,
  },
  argTypes: {
    submitError: {
      control: 'text',
    },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '28.125rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SetPasswordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const WithSubmitError: Story = {
  args: {
    submitError: 'This invitation link is invalid or has expired.',
  },
};
