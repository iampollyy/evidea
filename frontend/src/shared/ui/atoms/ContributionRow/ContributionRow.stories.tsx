import type { Meta, StoryObj } from '@storybook/react-vite';

import { explanationsMock } from '@/shared/mocks/predictions.mock';
import { ContributionRow } from './ContributionRow';

const contributions = explanationsMock['hypothesis-1'].shap;

const meta = {
  title: 'Atoms/ContributionRow',
  component: ContributionRow,
  args: {
    contribution: contributions[0],
    scale: 0.3,
  },
  decorators: [
    (Story) => (
      <ul style={{ maxWidth: '35rem', margin: 0, padding: 0, listStyle: 'none' }}>
        <Story />
      </ul>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ContributionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {};

export const Negative: Story = {
  args: {
    contribution: contributions[6],
  },
};
