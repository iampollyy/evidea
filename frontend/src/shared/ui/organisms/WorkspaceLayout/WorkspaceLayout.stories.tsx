import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { adminUserMock } from '@/shared/mocks/currentUser.mock';
import { adminNavItemsMock } from '@/shared/mocks/adminNav.mock';
import { WorkspaceLayout } from './WorkspaceLayout';

const meta = {
  title: 'Organisms/WorkspaceLayout',
  component: WorkspaceLayout,
  args: {
    user: adminUserMock,
    navItems: adminNavItemsMock,
    activeNavId: adminNavItemsMock[0].id,
    homeHref: '/admin',
    onNavigate: fn(),
    onSignOut: fn(),
    children: <p>Page content</p>,
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorkspaceLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SignOutError: Story = {
  args: {
    signOutError: 'Unable to sign out: HTTP 503',
  },
};
