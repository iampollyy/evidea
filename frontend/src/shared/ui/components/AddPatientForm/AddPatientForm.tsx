import type { ComponentPropsWithRef, ReactNode } from 'react';

import { useValidatedForm } from '@/shared/lib/form/useValidatedForm';
import { SEX_OPTIONS } from '@/shared/lib/person/sex';
import { toIsoDate } from '@/shared/lib/validation/person';
import { Dropdown } from '@/shared/ui/atoms/Dropdown/Dropdown';
import { Input } from '@/shared/ui/atoms/Input/Input';
import { FormPanel } from '@/shared/ui/components/FormPanel/FormPanel';
import { FormSection } from '@/shared/ui/components/FormSection/FormSection';
import {
  EMPTY_PATIENT,
  PATIENT_FIELD_ORDER,
  validatePatient,
  type AddPatientFormValues,
} from './validatePatient';

export type { AddPatientFormValues } from './validatePatient';

export interface AddPatientFormProps extends Omit<
  ComponentPropsWithRef<'form'>,
  'onSubmit' | 'children' | 'title'
> {
  onSubmit: (values: AddPatientFormValues) => void | Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<AddPatientFormValues>;
  isSubmitting?: boolean;
  submitError?: ReactNode;
}

export function AddPatientForm({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
  submitError,
  id,
  ...rest
}: AddPatientFormProps) {
  const form = useValidatedForm({
    initialValues: { ...EMPTY_PATIENT, ...defaultValues },
    validate: validatePatient,
    fieldOrder: PATIENT_FIELD_ORDER,
    id,
    disabled: isSubmitting,
  });

  return (
    <FormPanel
      id={form.formId}
      title="New Patient"
      submitLabel="Add Patient"
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
          required
          max={toIsoDate(new Date())}
          {...form.bindInput('birthDate')}
        />
        <Dropdown
          label="Sex"
          options={SEX_OPTIONS}
          placeholder="Select"
          required
          {...form.bindDropdown('sex')}
        />
      </FormSection>

      <FormSection title="Contact Information">
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="off"
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
    </FormPanel>
  );
}
