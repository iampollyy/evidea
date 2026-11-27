import type { Meta, StoryObj } from '@storybook/react-vite';

import { hypothesesMock } from '@/shared/mocks/predictions.mock';
import { HypothesisSummaryCard } from './HypothesisSummaryCard';

const meta = {
  title: 'Components/HypothesisSummaryCard',
  component: HypothesisSummaryCard,
  args: {
    hypothesis: hypothesesMock[0],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '21.25rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HypothesisSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopRanked: Story = {};

export const LowerRanked: Story = {
  args: {
    hypothesis: hypothesesMock[2],
  },
};
