import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Filter, type FilterOption } from './Filter';

const statusOptions: FilterOption[] = [
  { value: 'active', label: 'Active patients' },
  { value: 'archived', label: 'Archived patients' },
];

const meta = {
  title: 'Atoms/Filter',
  component: Filter,
  args: {
    options: statusOptions,
    value: 'active',
    label: 'Filter',
    applied: false,
    disabled: false,
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: '8rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Filter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Applied: Story = {
  args: {
    value: 'archived',
    applied: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Interactive: Story = {
  render: function InteractiveFilter(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Filter
        {...args}
        value={value}
        applied={value !== 'active'}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
    );
  },
};
