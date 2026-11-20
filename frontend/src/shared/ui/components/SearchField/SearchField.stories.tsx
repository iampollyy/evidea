import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchField } from './SearchField';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  args: {
    label: 'Search',
    placeholder: 'Search',
    shortcutKey: 'k',
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: {
    defaultValue: 'Andrew Miller',
  },
};

export const WithoutShortcut: Story = {
  args: {
    shortcutKey: null,
  },
};
