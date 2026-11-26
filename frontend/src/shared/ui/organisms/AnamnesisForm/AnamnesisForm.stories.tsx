import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { anamnesisMock } from '@/shared/mocks/patientProfile.mock';
import { AnamnesisForm } from './AnamnesisForm';

const meta = {
  title: 'Organisms/AnamnesisForm',
  component: AnamnesisForm,
  args: {
    anamnesis: anamnesisMock,
    isSaving: false,
    onCancel: fn(),
    onSave: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnamnesisForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Empty: Story = {
  args: {
    anamnesis: null,
  },
};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};

export const WithError: Story = {
  args: {
    saveError: 'Could not save clinical notes. Try again.',
  },
};
