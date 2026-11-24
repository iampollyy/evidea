import { useId, type ReactNode } from 'react';

import { useValidatedForm } from '@/shared/lib/form/useValidatedForm';
import { SEX_OPTIONS } from '@/shared/lib/person/sex';
import { getAge, parseIsoDate, toIsoDate } from '@/shared/lib/validation/person';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Dropdown } from '@/shared/ui/atoms/Dropdown/Dropdown';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Input } from '@/shared/ui/atoms/Input/Input';
import {
  PATIENT_FIELD_ORDER,
  validatePatient,
  type AddPatientFormValues,
} from '@/shared/ui/components/AddPatientForm/validatePatient';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import styles from './PersonalInfoForm.module.scss';

export type PersonalInfoValues = AddPatientFormValues;

export interface PersonalInfoFormProps {
  values: PersonalInfoValues;
  isEditing: boolean;
  canEdit?: boolean;
  isSaving?: boolean;
  saveError?: ReactNode;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: (values: PersonalInfoValues) => void | Promise<void>;
  className?: string;
}

const longDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatAge(birthDate: string) {
  const date = parseIsoDate(birthDate);
  if (!date) return '';
  const age = getAge(date, new Date());
  return age >= 0 ? `${age} ${age === 1 ? 'year' : 'years'}` : '';
}

function ReadOnlyField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <Input
      label={label}
      value={value}
      placeholder="Not provided"
      readOnly
      className={[styles.field, wide && styles.wide].filter(Boolean).join(' ')}
    />
  );
}

function PersonalInfoView({ values }: { values: PersonalInfoValues }) {
  const birthDate = parseIsoDate(values.birthDate);
  const sexLabel = SEX_OPTIONS.find((option) => option.value === values.sex)?.label ?? '';

  return (
    <div className={styles.grid}>
      <ReadOnlyField label="First Name" value={values.name} />
      <ReadOnlyField label="Last Name" value={values.surname} />
      <ReadOnlyField
        label="Date of Birth"
        value={birthDate ? longDate.format(birthDate) : values.birthDate}
      />
      <ReadOnlyField label="Age" value={formatAge(values.birthDate)} />
      <ReadOnlyField label="Sex" value={sexLabel} />
      <ReadOnlyField label="Phone Number" value={values.phoneNumber} />
      <ReadOnlyField label="Email Address" value={values.email} wide />
    </div>
  );
}

interface PersonalInfoEditorProps {
  formId: string;
  values: PersonalInfoValues;
  isSaving: boolean;
  saveError?: ReactNode;
  onSave?: PersonalInfoFormProps['onSave'];
}

function PersonalInfoEditor({
  formId,
  values,
  isSaving,
  saveError,
  onSave,
}: PersonalInfoEditorProps) {
  const form = useValidatedForm({
    initialValues: values,
    validate: validatePatient,
    fieldOrder: PATIENT_FIELD_ORDER,
    id: formId,
    disabled: isSaving,
  });

  return (
    <form id={form.formId} noValidate onSubmit={form.handleSubmit((next) => onSave?.(next))}>
      <div className={styles.grid}>
        <Input
          label="First Name"
          required
          autoComplete="off"
          className={styles.field}
          {...form.bindInput('name')}
        />
        <Input
          label="Last Name"
          required
          autoComplete="off"
          className={styles.field}
          {...form.bindInput('surname')}
        />
        <Input
          label="Date of Birth"
          type="date"
          required
          max={toIsoDate(new Date())}
          className={styles.field}
          {...form.bindInput('birthDate')}
        />
        <ReadOnlyField label="Age" value={formatAge(form.values.birthDate)} />
        <Dropdown
          label="Sex"
          options={SEX_OPTIONS}
          placeholder="Select"
          required
          className={styles.field}
          {...form.bindDropdown('sex')}
        />
        <Input
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          className={styles.field}
          {...form.bindInput('phoneNumber')}
        />
        <Input
          label="Email Address"
          type="email"
          required
          autoComplete="off"
          className={[styles.field, styles.wide].join(' ')}
          {...form.bindInput('email')}
        />
      </div>
      {form.invalidFieldCount > 0 && (
        <p className={styles.formError} role="alert">
          Fix {form.invalidFieldCount} {form.invalidFieldCount === 1 ? 'field' : 'fields'} before
          saving.
        </p>
      )}
      {saveError && (
        <p className={styles.formError} role="alert">
          {saveError}
        </p>
      )}
    </form>
  );
}

export function PersonalInfoForm({
  values,
  isEditing,
  canEdit = true,
  isSaving = false,
  saveError,
  onEdit,
  onCancel,
  onSave,
  className,
}: PersonalInfoFormProps) {
  const formId = useId();

  const actions = isEditing ? (
    <>
      <Button variant="secondary" disabled={isSaving} onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" form={formId} disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save'}
      </Button>
    </>
  ) : (
    canEdit && (
      <Button variant="secondary" icon={<Icon name="edit" />} onClick={onEdit}>
        Edit
      </Button>
    )
  );

  return (
    <SectionCard
      title="Personal Information"
      subtitle="Identity, demographic, and contact information"
      icon="person"
      actions={actions}
      className={className}
    >
      {isEditing ? (
        <PersonalInfoEditor
          formId={formId}
          values={values}
          isSaving={isSaving}
          saveError={saveError}
          onSave={onSave}
        />
      ) : (
        <PersonalInfoView values={values} />
      )}
    </SectionCard>
  );
}
