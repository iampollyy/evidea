import type { Meta, StoryObj } from '@storybook/react-vite';

import sampleAvatar from '@/assets/sample-image.jpg';
import { HeaderNav } from './HeaderNav';

const meta = {
  title: 'Components/HeaderNav',
  component: HeaderNav,
  args: {
    user: {
      name: 'Andrew Miller',
      avatarSrc: sampleAvatar,
    },
    hasUnreadNotifications: true,
  },
  argTypes: {
    onCalendarClick: { action: 'calendar clicked' },
    onSettingsClick: { action: 'settings clicked' },
    onNotificationsClick: { action: 'notifications clicked' },
    onProfileClick: { action: 'profile clicked' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HeaderNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoUnreadNotifications: Story = {
  args: {
    hasUnreadNotifications: false,
  },
};

export const InitialsFallback: Story = {
  args: {
    user: {
      name: 'Andrew Miller',
    },
  },
};
