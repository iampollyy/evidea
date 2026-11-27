import type { Meta, StoryObj } from '@storybook/react-vite';

import { anamnesisMock } from '@/shared/mocks/patientProfile.mock';
import { ClinicalHistoryCard } from './ClinicalHistoryCard';

const meta = {
  title: 'Components/ClinicalHistoryCard',
  component: ClinicalHistoryCard,
  args: {
    anamnesis: anamnesisMock,
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ClinicalHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    anamnesis: null,
  },
};
