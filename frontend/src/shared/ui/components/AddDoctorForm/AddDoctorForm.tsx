import type { ComponentPropsWithRef, ReactNode } from 'react';

import { ROLE_OPTIONS } from '@/constants/doctor.constants';
import { DOCTOR_FIELD_ORDER, EMPTY_DOCTOR } from '@/constants/forms.constants';
import { SEX_OPTIONS } from '@/constants/person.constants';
import { useValidatedForm } from '@/shared/hooks/useValidatedForm';
import type { AddDoctorFormValues } from '@/shared/types/forms.types';
import { Dropdown } from '@/shared/ui/atoms/Dropdown/Dropdown';
import { Input } from '@/shared/ui/atoms/Input/Input';
import { FormPanel } from '@/shared/ui/components/FormPanel/FormPanel';
import { FormSection } from '@/shared/ui/components/FormSection/FormSection';
import { toIsoDate } from '@/utils/date';
import { validateDoctor } from '@/utils/validation/doctor';

export interface AddDoctorFormProps extends Omit<
  ComponentPropsWithRef<'form'>,
  'onSubmit' | 'children' | 'title'
> {
  onSubmit: (values: AddDoctorFormValues) => void | Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<AddDoctorFormValues>;
  isSubmitting?: boolean;
  submitError?: ReactNode;
}

export function AddDoctorForm({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
  submitError,
  id,
  ...rest
}: AddDoctorFormProps) {
  const form = useValidatedForm({
    initialValues: { ...EMPTY_DOCTOR, ...defaultValues },
    validate: validateDoctor,
    fieldOrder: DOCTOR_FIELD_ORDER,
    id,
    disabled: isSubmitting,
  });

  return (
    <FormPanel
      id={form.formId}
      title="New Doctor"
      submitLabel="Add Doctor"
      submittingLabel="Adding…"
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      invalidFieldCount={form.invalidFieldCount}
      submitError={submitError}
      onSubmit={form.handleSubmit(onSubmit)}
      {...rest}
    >
      <FormSection title="Personal Information">
        <Input label="Name" required autoComplete="off" {...form.bindInput('name')} />
        <Input label="Surname" required autoComplete="off" {...form.bindInput('surname')} />
        <Input
          label="Date of Birth"
          type="date"
          max={toIsoDate(new Date())}
          hint="Optional"
          {...form.bindInput('birthDate')}
        />
        <Dropdown
          label="Sex"
          options={SEX_OPTIONS}
          placeholder="Select"
          hint="Optional"
          {...form.bindDropdown('sex')}
        />
      </FormSection>

      <FormSection title="Contact Information">
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="off"
          hint="Used to sign in and receive the invitation"
          {...form.bindInput('email')}
        />
        <Input
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          hint="Optional"
          {...form.bindInput('phoneNumber')}
        />
      </FormSection>

      <FormSection title="Access">
        <Dropdown
          label="Role"
          options={ROLE_OPTIONS}
          placeholder="Select"
          required
          {...form.bindDropdown('role')}
        />
      </FormSection>
    </FormPanel>
  );
}
