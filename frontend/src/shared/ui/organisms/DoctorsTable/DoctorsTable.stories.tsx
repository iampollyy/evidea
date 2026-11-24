import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { doctorsMock } from '@/mocks/doctors.mock';
import { DoctorsTable } from './DoctorsTable';

const meta = {
  title: 'Organisms/DoctorsTable',
  component: DoctorsTable,
  args: {
    doctors: doctorsMock,
    onAction: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DoctorsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    doctors: [],
  },
};

export const UpdatingDoctor: Story = {
  args: {
    pendingDoctorId: 'doctor-2',
  },
};
