import { useState, type FormEvent, type ReactNode } from 'react';

import { ANAMNESIS_FIELDS, ANAMNESIS_NOTES_HINT } from '@/constants/anamnesis.constants';
import type { AnamnesisFormValues, AnamnesisValues } from '@/shared/types/cases.types';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { TextArea } from '@/shared/ui/atoms/TextArea/TextArea';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import { toAnamnesisFormValues, toAnamnesisValues } from '@/utils/mappers/anamnesis';
import styles from './AnamnesisForm.module.scss';

export interface AnamnesisFormProps {
  anamnesis: AnamnesisValues | null;
  isSaving?: boolean;
  saveError?: ReactNode;
  onCancel?: () => void;
  onSave?: (values: AnamnesisValues) => void | Promise<void>;
  className?: string;
}

export function AnamnesisForm({
  anamnesis,
  isSaving = false,
  saveError,
  onCancel,
  onSave,
  className,
}: AnamnesisFormProps) {
  const [values, setValues] = useState<AnamnesisFormValues>(() => toAnamnesisFormValues(anamnesis));

  const setField = (field: keyof AnamnesisFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleCancel = () => {
    setValues(toAnamnesisFormValues(anamnesis));
    onCancel?.();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(toAnamnesisValues(values));
  };

  return (
    <SectionCard
      title="Anamnesis"
      subtitle="Free-text clinical documentation — enter observations in your own words"
      icon="description"
      className={className}
    >
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <TextArea
          variant="notes"
          label="Clinical notes"
          hideLabel
          hint={ANAMNESIS_NOTES_HINT}
          value={values.clinicalNotes}
          disabled={isSaving}
          onChange={setField('clinicalNotes')}
        />
        <div className={styles.grid}>
          {ANAMNESIS_FIELDS.map((field) => (
            <TextArea
              key={field.id}
              label={field.label}
              value={values[field.id]}
              disabled={isSaving}
              onChange={setField(field.id)}
            />
          ))}
        </div>
        {saveError && (
          <p className={styles.formError} role="alert">
            {saveError}
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="tertiary" disabled={isSaving} onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Clinical Notes'}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
