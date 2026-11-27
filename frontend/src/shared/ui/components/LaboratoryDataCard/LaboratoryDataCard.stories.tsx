import type { Meta, StoryObj } from '@storybook/react-vite';

import { caseLabTestsMock } from '@/shared/mocks/caseReview.mock';
import { LaboratoryDataCard } from './LaboratoryDataCard';

const meta = {
  title: 'Components/LaboratoryDataCard',
  component: LaboratoryDataCard,
  args: {
    tests: caseLabTestsMock,
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LaboratoryDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    tests: [],
  },
};
