import type { Meta, StoryObj } from '@storybook/react-vite';

import sampleAvatar from '@/assets/sample-image.jpg';
import { Header } from './Header';

const meta = {
  title: 'Components/Header',
  component: Header,
  args: {
    nav: {
      user: {
        name: 'Andrew Miller',
        avatarSrc: sampleAvatar,
      },
      hasUnreadNotifications: true,
    },
    search: {
      placeholder: 'Search',
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoSearch: Story = {
  args: {
    search: undefined,
  },
};
