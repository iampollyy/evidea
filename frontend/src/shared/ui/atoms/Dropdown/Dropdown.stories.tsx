import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Dropdown, type DropdownOption } from './Dropdown';

const departments: DropdownOption[] = [
  { value: 'cardiology', label: 'Cardiologist' },
  { value: 'neurology', label: 'Neurologist' },
  { value: 'oncology', label: 'Oncologist' },
  { value: 'pediatrics', label: 'Pediatrician' },
  { value: 'radiology', label: 'Radiologist', disabled: true },
  { value: 'surgery', label: 'Surgeon' },
];

const meta = {
  title: 'Atoms/Dropdown',
  component: Dropdown,
  args: {
    label: 'Department',
    options: departments,
    placeholder: 'Select',
    size: 'md',
    required: true,
    disabled: false,
    hideLabel: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    hint: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '23.25rem', minHeight: '18rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultValue: 'cardiology',
  },
};

export const WithoutPlaceholder: Story = {
  args: {
    placeholder: undefined,
  },
};

export const Optional: Story = {
  args: {
    required: false,
  },
};

export const WithHint: Story = {
  args: {
    hint: 'Primary department of the attending physician',
  },
};

export const WithError: Story = {
  args: {
    error: 'Please select a department',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'cardiology',
  },
};

export const Controlled: Story = {
  render: function ControlledDropdown(args) {
    const [value, setValue] = useState('neurology');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Dropdown {...args} value={value} onChange={setValue} />
        <span>Selected value: {value}</span>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Dropdown {...args} size="sm" label="Small" />
      <Dropdown {...args} size="md" label="Medium" />
      <Dropdown {...args} size="lg" label="Large" />
    </div>
  ),
};
