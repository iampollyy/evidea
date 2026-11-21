import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import sampleImage from '@/assets/sample-image.jpg';
import { PatientBanner } from './PatientBanner';

const meta = {
  title: 'Components/PatientBanner',
  component: PatientBanner,
  args: {
    patient: {
      code: '#PT-2026-0025',
      name: 'Alberto',
      surname: 'Ripley',
      birthDate: '1998-01-25',
      sex: 'male',
      status: 'active',
      phoneNumber: '+370 612 45 648',
      lastVisit: new Date(2026, 4, 18),
      photoSrc: sampleImage,
    },
    onAddCase: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PatientBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutPhoto: Story = {
  args: {
    patient: {
      ...meta.args.patient,
      photoSrc: undefined,
    },
  },
};

export const MinimalData: Story = {
  args: {
    patient: {
      code: '#PT-2026-0031',
      name: 'Maria',
      surname: 'Kowalska',
      birthDate: '1961-09-03',
      sex: 'female',
      phoneNumber: null,
      lastVisit: null,
    },
  },
};

export const Archived: Story = {
  args: {
    patient: {
      ...meta.args.patient,
      status: 'archived',
    },
    onAddCase: undefined,
  },
};
