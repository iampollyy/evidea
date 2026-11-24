import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LoginPage } from './LoginPage';

const meta = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  args: {
    onLoginSuccess: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
