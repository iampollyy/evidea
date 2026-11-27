import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { explanationsMock, hypothesesMock } from '@/shared/mocks/predictions.mock';
import { HypothesisExplanation } from './HypothesisExplanation';

const meta = {
  title: 'Organisms/HypothesisExplanation',
  component: HypothesisExplanation,
  args: {
    hypothesis: hypothesesMock[0],
    explanation: explanationsMock[hypothesesMock[0].id],
    onBack: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HypothesisExplanation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopRanked: Story = {};

export const LowerRanked: Story = {
  args: {
    hypothesis: hypothesesMock[2],
    explanation: explanationsMock[hypothesesMock[2].id],
  },
};
