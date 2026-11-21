import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { AddPatientForm } from './AddPatientForm';

const meta = {
  title: 'Components/AddPatientForm',
  component: AddPatientForm,
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
} satisfies Meta<typeof AddPatientForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    defaultValues: {
      name: 'Alberto',
      surname: 'Ripley',
      birthDate: '1999-04-18',
      sex: 'male',
      email: 'alberto.ripley@example.com',
      phoneNumber: '+370 612 34567',
    },
  },
};

export const ValidationErrors: Story = {
  args: {
    defaultValues: {
      name: 'A',
      birthDate: '2999-01-01',
      email: 'alberto@',
      phoneNumber: '12',
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add Patient' }));
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
    submitError: 'Could not save the patient. Please try again.',
  },
};
