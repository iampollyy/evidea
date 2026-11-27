import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  clinicalFactorsMock,
  explanationsMock,
  hypothesesMock,
  labFactorsMock,
} from '@/shared/mocks/predictions.mock';
import { PredictionReport } from './PredictionReport';

const meta = {
  title: 'Organisms/PredictionReport',
  component: PredictionReport,
  args: {
    hypotheses: hypothesesMock,
    explanations: explanationsMock,
    clinicalFactors: clinicalFactorsMock,
    labFactors: labFactorsMock,
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PredictionReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
