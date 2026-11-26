import type { Meta, StoryObj } from '@storybook/react-vite';

import { CaseSubmissionProgress } from './CaseSubmissionProgress';

const meta = {
  title: 'Organisms/CaseSubmissionProgress',
  component: CaseSubmissionProgress,
  args: {
    stage: 'submitting',
    patientName: 'Emma Thompson',
  },
  argTypes: {
    stage: {
      control: 'select',
      options: ['submitting', 'pending', 'processing'],
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof CaseSubmissionProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SubmittingCase: Story = {};

export const PredictionPending: Story = {
  args: {
    stage: 'pending',
  },
};

export const PredictionProcessing: Story = {
  args: {
    stage: 'processing',
  },
};
