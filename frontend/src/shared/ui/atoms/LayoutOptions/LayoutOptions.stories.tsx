import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { LayoutOptions } from './LayoutOptions';

const meta = {
  title: 'Atoms/LayoutOptions',
  component: LayoutOptions,
  args: {
    value: 'grid',
    label: 'Patients layout',
  },
  argTypes: {
    value: {
      control: 'inline-radio',
      options: ['list', 'grid'],
    },
    onChange: { action: 'changed' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayoutOptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

export const List: Story = {
  args: {
    value: 'list',
  },
};

export const Interactive: Story = {
  render: function InteractiveLayoutOptions(args) {
    const [value, setValue] = useState(args.value);
    return (
      <LayoutOptions
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
    );
  },
};
