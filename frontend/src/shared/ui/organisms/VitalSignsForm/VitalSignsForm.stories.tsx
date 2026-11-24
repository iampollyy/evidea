import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import type { VitalSignsValues } from '@/shared/api/cases.types';
import { vitalSignsMeasuredAtMock, vitalSignsMock } from '@/shared/mocks/patientProfile.mock';
import { VitalSignsForm } from './VitalSignsForm';

const meta = {
  title: 'Organisms/VitalSignsForm',
  component: VitalSignsForm,
  args: {
    vitals: vitalSignsMock,
    measuredAt: vitalSignsMeasuredAtMock,
    isEditing: false,
    onEdit: fn(),
    onCancel: fn(),
    onSave: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VitalSignsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const View: Story = {};

export const Editing: Story = {
  args: {
    isEditing: true,
  },
};

export const NoMeasurements: Story = {
  args: {
    vitals: null,
    measuredAt: null,
  },
};

export const PartialMeasurements: Story = {
  args: {
    vitals: { ...vitalSignsMock, respiratoryRate: null, diastolicBpMmhg: null },
  },
};

export const Interactive: Story = {
  render: function InteractiveVitalSignsForm(args) {
    const [vitals, setVitals] = useState<VitalSignsValues | null>(args.vitals);
    const [isEditing, setIsEditing] = useState(false);

    return (
      <VitalSignsForm
        {...args}
        vitals={vitals}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSave={(next) => {
          setVitals(next);
          setIsEditing(false);
        }}
      />
    );
  },
};
