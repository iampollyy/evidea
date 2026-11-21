import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { SidebarNav, type SidebarNavItem } from './SidebarNav';

const items: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid_view', href: '/dashboard' },
  { id: 'patients', label: 'Patients', icon: 'group', href: '/patients', count: 42 },
  { id: 'new-case', label: 'New Clinical Case', icon: 'add_box', href: '/cases/new' },
  { id: 'history', label: 'Diagnostic History', icon: 'sort', href: '/history' },
  { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' },
];

const meta = {
  title: 'Components/SidebarNav',
  component: SidebarNav,
  args: {
    items,
    activeId: 'patients',
    onNavigate: fn(),
  },
  argTypes: {
    activeId: {
      control: 'select',
      options: items.map((item) => item.id),
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: function Render(args) {
    const [activeId, setActiveId] = useState(args.activeId);

    return (
      <SidebarNav
        {...args}
        activeId={activeId}
        onNavigate={(item, event) => {
          event.preventDefault();
          setActiveId(item.id);
          args.onNavigate?.(item, event);
        }}
      />
    );
  },
};
