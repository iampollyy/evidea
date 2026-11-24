import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import type { SidebarNavItem } from '@/shared/ui/components/SidebarNav/SidebarNav';
import { Sidebar } from './Sidebar';

const items: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', href: '/dashboard' },
  { id: 'patients', label: 'Patients', icon: 'group', href: '/patients', count: 5 },
  { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' },
];

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  args: {
    logoHref: '/',
    nav: { items, activeId: 'dashboard', onNavigate: fn() },
    doctor: { firstName: 'Sarah', lastName: 'Chen', position: 'Family doctor' },
    onSignOut: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongDoctorName: Story = {
  args: {
    doctor: {
      firstName: 'Alexandra',
      lastName: 'Montgomery-Wellington',
      position: 'Consultant cardiologist',
    },
  },
};
