import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';

import { fn } from 'storybook/test';

import sampleAvatar from '@/assets/sample-image.jpg';
import { PatientsGrid, type PatientsGridPatient } from './PatientsGrid';

const patients: PatientsGridPatient[] = Array.from({ length: 15 }, (_, index) => ({
  id: String(index + 1),
  name: 'Alberto Ripley',
  age: 26,
  gender: 'Male',
  avatarSrc: sampleAvatar,
  lastAppointment: new Date(2026, 3, 30),
  location: 'Vilnius, Lithuania',
}));

const meta = {
  title: 'Components/PatientsGrid',
  component: PatientsGrid,
  args: {
    patients,
    'aria-label': 'Patients',
    getPatientHref: (patient) => `/doctor/patients/${patient.id}`,
    onPatientNavigate: fn((_patient: PatientsGridPatient, event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    ),
  },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['grid', 'list'],
    },
    onPatientMenuClick: { action: 'patient menu clicked' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '69.75rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PatientsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const List: Story = {
  args: {
    layout: 'list',
    patients: patients.slice(0, 4),
  },
};

export const MixedContent: Story = {
  args: {
    patients: [
      patients[0],
      {
        id: 'b',
        name: 'Margaret Elizabeth Johnson-Whitfield',
        age: 71,
        gender: 'Female',
        lastAppointment: new Date(2026, 9, 12),
        location: 'Kaunas, Lithuania',
      },
      { id: 'c', name: 'Tomas Kazlauskas', age: 42, gender: 'Male' },
      { ...patients[0], id: 'd' },
    ],
  },
};
