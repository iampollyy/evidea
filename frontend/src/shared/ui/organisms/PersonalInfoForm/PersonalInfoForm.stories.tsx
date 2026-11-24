import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { personalInfoMock } from '@/shared/mocks/patientProfile.mock';
import { PersonalInfoForm, type PersonalInfoValues } from './PersonalInfoForm';

const meta = {
  title: 'Organisms/PersonalInfoForm',
  component: PersonalInfoForm,
  args: {
    values: personalInfoMock,
    isEditing: false,
    onEdit: fn(),
    onCancel: fn(),
    onSave: fn(),
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PersonalInfoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const View: Story = {};

export const Editing: Story = {
  args: {
    isEditing: true,
  },
};

export const Saving: Story = {
  args: {
    isEditing: true,
    isSaving: true,
  },
};

export const SaveError: Story = {
  args: {
    isEditing: true,
    saveError: 'Another active patient already uses this email.',
  },
};

export const ArchivedReadOnly: Story = {
  args: {
    canEdit: false,
  },
};

export const Interactive: Story = {
  render: function InteractivePersonalInfoForm(args) {
    const [values, setValues] = useState<PersonalInfoValues>(args.values);
    const [isEditing, setIsEditing] = useState(false);

    return (
      <PersonalInfoForm
        {...args}
        values={values}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSave={(next) => {
          setValues(next);
          setIsEditing(false);
        }}
      />
    );
  },
};
