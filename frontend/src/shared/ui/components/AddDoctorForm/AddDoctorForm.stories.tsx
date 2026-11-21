import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { AddDoctorForm } from './AddDoctorForm';

const meta = {
  title: 'Components/AddDoctorForm',
  component: AddDoctorForm,
  args: {
    isSubmitting: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
  argTypes: {
    submitError: { control: 'text' },
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AddDoctorForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    defaultValues: {
      name: 'Andrew',
      surname: 'Miller',
      birthDate: '1984-06-12',
      sex: 'male',
      email: 'andrew.miller@evidea.com',
      phoneNumber: '+370 612 34567',
      role: 'clinician',
    },
  },
};

export const ValidationErrors: Story = {
  args: {
    defaultValues: {
      name: 'A',
      birthDate: '2015-01-01',
      email: 'andrew.miller@',
      phoneNumber: '12',
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add Doctor' }));
  },
};

export const Submitting: Story = {
  args: {
    ...Prefilled.args,
    isSubmitting: true,
  },
};

export const SubmitError: Story = {
  args: {
    ...Prefilled.args,
    submitError: 'A doctor with this email address already exists.',
  },
};
