import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import {
  clinicalFactorsMock,
  hypothesesMock,
  labFactorsMock,
} from '@/shared/mocks/predictions.mock';
import { PredictionResults } from './PredictionResults';

const meta = {
  title: 'Organisms/PredictionResults',
  component: PredictionResults,
  args: {
    hypotheses: hypothesesMock,
    clinicalFactors: clinicalFactorsMock,
    labFactors: labFactorsMock,
    onExplain: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PredictionResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoHypotheses: Story = {
  args: {
    hypotheses: [],
    clinicalFactors: [],
    labFactors: [],
  },
};
