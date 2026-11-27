import type { Meta, StoryObj } from '@storybook/react-vite';

import { clinicalFactorsMock, labFactorsMock } from '@/shared/mocks/predictions.mock';
import { EvidenceCard } from './EvidenceCard';

const meta = {
  title: 'Components/EvidenceCard',
  component: EvidenceCard,
  args: {
    source: 'clinical',
    factors: clinicalFactorsMock,
  },
  argTypes: {
    source: {
      control: 'select',
      options: ['clinical', 'laboratory'],
    },
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
} satisfies Meta<typeof EvidenceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clinical: Story = {};

export const Laboratory: Story = {
  args: {
    source: 'laboratory',
    factors: labFactorsMock,
  },
};

export const NegativeContribution: Story = {
  args: {
    source: 'laboratory',
    factors: [...labFactorsMock, { label: 'Lactate 1.1 mmol/L', contribution: -0.04 }],
  },
};
