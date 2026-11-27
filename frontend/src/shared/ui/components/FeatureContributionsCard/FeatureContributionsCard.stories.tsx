import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { explanationsMock } from '@/shared/mocks/predictions.mock';
import { FeatureContributionsCard } from './FeatureContributionsCard';

const explanation = explanationsMock['hypothesis-1'];

const meta = {
  title: 'Components/FeatureContributionsCard',
  component: FeatureContributionsCard,
  args: {
    method: 'shap',
    contributions: explanation.shap,
  },
  argTypes: {
    onMethodChange: { action: 'method changed' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '38.25rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureContributionsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shap: Story = {};

export const Lime: Story = {
  args: {
    method: 'lime',
    contributions: explanation.lime,
  },
};

export const Interactive: Story = {
  render: function InteractiveFeatureContributionsCard(args) {
    const [method, setMethod] = useState(args.method);
    return (
      <FeatureContributionsCard
        {...args}
        method={method}
        contributions={explanation[method]}
        onMethodChange={(next) => {
          setMethod(next);
          args.onMethodChange?.(next);
        }}
      />
    );
  },
};

export const Empty: Story = {
  args: {
    contributions: [],
  },
};
