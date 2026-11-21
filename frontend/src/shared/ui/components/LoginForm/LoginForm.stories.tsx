import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LoginForm } from './LoginForm';

const meta = {
  title: 'Components/LoginForm',
  component: LoginForm,
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
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
    defaultValues: { email: 'sarah.chen@evidea.health', password: 'secret-password' },
  },
};

export const WithSubmitError: Story = {
  args: {
    submitError: 'Invalid email or password',
    defaultValues: { email: 'sarah.chen@evidea.health' },
  },
};
