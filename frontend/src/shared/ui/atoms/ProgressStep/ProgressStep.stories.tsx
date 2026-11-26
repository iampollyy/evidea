import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressStep } from './ProgressStep';

const meta = {
  title: 'Atoms/ProgressStep',
  component: ProgressStep,
  args: {
    status: 'active',
    children: 'Generating ranked hypotheses',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['done', 'active', 'upcoming'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Done: Story = {
  args: {
    status: 'done',
    children: 'Clinical case saved',
  },
};

export const Upcoming: Story = {
  args: {
    status: 'upcoming',
    children: 'Prediction run queued',
  },
};

export const Statuses: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.125rem' }}>
      <ProgressStep status="done">Clinical case saved</ProgressStep>
      <ProgressStep status="active">Prediction run queued</ProgressStep>
      <ProgressStep status="upcoming">Generating ranked hypotheses</ProgressStep>
    </div>
  ),
};
