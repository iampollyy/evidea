import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  args: {
    label: 'Name',
    size: 'md',
    required: true,
    placeholder: 'Placeholder',
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
      <div style={{ width: '15.25rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: undefined,
  },
};

export const Placeholder: Story = {};

export const Filled: Story = {
  args: {
    defaultValue: 'Input',
  },
};

export const Optional: Story = {
  args: {
    required: false,
  },
};

export const WithHint: Story = {
  args: {
    hint: 'As shown on the patient ID card',
  },
};

export const WithError: Story = {
  args: {
    defaultValue: 'J',
    error: 'Name must be at least 2 characters',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Input',
  },
};

export const HiddenLabel: Story = {
  args: {
    hideLabel: true,
    label: 'Search patients',
    placeholder: 'Search patients',
    required: false,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input {...args} size="sm" label="Small" />
      <Input {...args} size="md" label="Medium" />
      <Input {...args} size="lg" label="Large" />
    </div>
  ),
};
