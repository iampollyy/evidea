import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ExplanationMethodSwitch } from './ExplanationMethodSwitch';

const meta = {
  title: 'Components/ExplanationMethodSwitch',
  component: ExplanationMethodSwitch,
  args: {
    value: 'shap',
  },
  argTypes: {
    value: {
      control: 'inline-radio',
      options: ['shap', 'lime'],
    },
    onChange: { action: 'changed' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ExplanationMethodSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shap: Story = {};

export const Lime: Story = {
  args: {
    value: 'lime',
  },
};

export const Interactive: Story = {
  render: function InteractiveExplanationMethodSwitch(args) {
    const [value, setValue] = useState(args.value);
    return (
      <ExplanationMethodSwitch
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
