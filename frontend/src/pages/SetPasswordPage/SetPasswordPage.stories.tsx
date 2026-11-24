import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SetPasswordPage } from './SetPasswordPage';

const meta = {
  title: 'Pages/SetPasswordPage',
  component: SetPasswordPage,
  args: {
    token: 'sample-invitation-token-value',
    onGoToLogin: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SetPasswordPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InvalidLink: Story = {
  args: {
    token: null,
  },
};
