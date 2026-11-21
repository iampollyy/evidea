import type { Meta, StoryObj } from '@storybook/react-vite';

import sampleAvatar from '@/assets/sample-image.jpg';
import { Avatar } from './Avatar';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: {
    name: 'Andrew Miller',
    src: sampleAvatar,
    size: 'md',
    decorative: false,
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Initials: Story = {
  args: {
    src: undefined,
  },
};

export const BrokenImage: Story = {
  args: {
    src: 'https://invalid.example/missing.png',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
      <Avatar {...args} src={undefined} size="sm" />
      <Avatar {...args} src={undefined} size="md" />
      <Avatar {...args} src={undefined} size="lg" />
    </div>
  ),
};
