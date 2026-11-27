import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { caseLabTestsMock } from '@/shared/mocks/caseReview.mock';
import { anamnesisMock, patientBannerMock } from '@/shared/mocks/patientProfile.mock';
import { CaseReviewSection } from './CaseReviewSection';

const meta = {
  title: 'Organisms/CaseReviewSection',
  component: CaseReviewSection,
  args: {
    patient: patientBannerMock,
    anamnesis: anamnesisMock,
    labTests: caseLabTestsMock,
    hasVitalSigns: true,
    onBack: fn(),
    onSubmit: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CaseReviewSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MissingData: Story = {
  args: {
    anamnesis: null,
    labTests: [],
    hasVitalSigns: false,
  },
};
