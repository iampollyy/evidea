import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { TextArea } from './TextArea';

const meta = {
  title: 'Atoms/TextArea',
  component: TextArea,
  args: {
    label: 'Chief Complaint',
    value: 'Fatigue, reduced exercise tolerance, intermittent muscle weakness.',
    onChange: () => {},
    variant: 'field',
    hideLabel: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['field', 'notes'],
    },
    hint: {
      control: 'text',
    },
  },
  render: function ControlledTextArea(args) {
    const [value, setValue] = useState(args.value);
    return <TextArea {...args} value={value} onChange={setValue} />;
  },
  decorators: [
    (Story) => (
      <div style={{ width: '21.875rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Field: Story = {};

export const Empty: Story = {
  args: {
    value: '',
    placeholder: 'Describe the main complaint',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Notes: Story = {
  args: {
    variant: 'notes',
    label: 'Clinical notes',
    hideLabel: true,
    hint: 'Clinical notes support unrestricted natural-language entry. No symptom codes are required.',
    value:
      'Alberto was referred for assessment of recurrent episodes of fatigue, reduced exercise tolerance, and intermittent muscle weakness over the past nine months.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '45rem' }}>
        <Story />
      </div>
    ),
  ],
};
