import type { Meta, StoryObj } from '@storybook/react-vite';

import sampleAvatar from '@/assets/sample-image.jpg';
import { PatientCard } from './PatientCard';

const meta = {
  title: 'Components/PatientCard',
  component: PatientCard,
  args: {
    patient: {
      name: 'Alberto Ripley',
      age: 26,
      gender: 'Male',
      avatarSrc: sampleAvatar,
      lastAppointment: new Date(2026, 3, 30),
      location: 'Vilnius, Lithuania',
    },
  },
  argTypes: {
    onMenuClick: { action: 'menu clicked' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '22.25rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PatientCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InitialsFallback: Story = {
  args: {
    patient: {
      name: 'Alberto Ripley',
      age: 26,
      gender: 'Male',
      lastAppointment: new Date(2026, 3, 30),
      location: 'Vilnius, Lithuania',
    },
  },
};

export const WithoutMeta: Story = {
  args: {
    patient: {
      name: 'Alberto Ripley',
      age: 26,
      gender: 'Male',
      avatarSrc: sampleAvatar,
    },
  },
};
