import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { hypothesesMock } from '@/shared/mocks/predictions.mock';
import { HypothesisCard } from './HypothesisCard';

const meta = {
  title: 'Components/HypothesisCard',
  component: HypothesisCard,
  args: {
    hypothesis: hypothesesMock[0],
    onExplain: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '35.75rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HypothesisCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopRanked: Story = {};

export const SecondRanked: Story = {
  args: {
    hypothesis: hypothesesMock[1],
  },
};

export const LowerRanked: Story = {
  args: {
    hypothesis: hypothesesMock[2],
  },
};
