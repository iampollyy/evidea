import type { Meta, StoryObj } from '@storybook/react-vite';

import { LabTestRow } from './LabTestRow';

const meta = {
  title: 'Atoms/LabTestRow',
  component: LabTestRow,
  args: {
    name: 'Complete Blood Count',
    category: 'Laboratory result',
    status: 'completed',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['completed', 'pending', 'notAvailable'],
    },
  },
  decorators: [
    (Story) => (
      <ul style={{ margin: 0, padding: 0, maxWidth: '50rem' }}>
        <Story />
      </ul>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LabTestRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const NotAvailable: Story = {
  args: {
    status: 'notAvailable',
  },
};
