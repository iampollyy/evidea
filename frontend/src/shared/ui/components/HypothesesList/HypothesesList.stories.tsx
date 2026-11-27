import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { hypothesesMock } from '@/shared/mocks/predictions.mock';
import { HypothesesList } from './HypothesesList';

const meta = {
  title: 'Components/HypothesesList',
  component: HypothesesList,
  args: {
    hypotheses: hypothesesMock,
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
} satisfies Meta<typeof HypothesesList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    hypotheses: [],
  },
};
