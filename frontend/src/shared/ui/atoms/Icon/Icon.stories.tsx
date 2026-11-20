import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from './Icon';

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  args: {
    name: 'add',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {};

export const Search: Story = {
  args: {
    name: 'search',
  },
};
