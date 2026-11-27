import type { Meta, StoryObj } from '@storybook/react-vite';

import { hypothesesMock } from '@/shared/mocks/predictions.mock';
import { TopPredictionCard } from './TopPredictionCard';

const meta = {
  title: 'Components/TopPredictionCard',
  component: TopPredictionCard,
  args: {
    hypothesis: hypothesesMock[0],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '21.625rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TopPredictionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
