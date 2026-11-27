import type { Meta, StoryObj } from '@storybook/react-vite';

import { SubmissionSummary } from './SubmissionSummary';

const meta = {
  title: 'Components/SubmissionSummary',
  component: SubmissionSummary,
  args: {
    hasHistory: true,
    labTestsCount: 6,
    hasVitalSigns: true,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '20.625rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SubmissionSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MissingData: Story = {
  args: {
    hasHistory: false,
    labTestsCount: 0,
    hasVitalSigns: false,
  },
};
