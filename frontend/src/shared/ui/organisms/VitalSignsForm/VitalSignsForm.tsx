import { useId, type ReactNode } from 'react';

import type { VitalSignsValues } from '@/shared/types/cases.types';
import { VITAL_FIELD_ORDER, VITAL_RULES } from '@/constants/vitalSigns.constants';
import { useValidatedForm } from '@/shared/hooks/useValidatedForm';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Input } from '@/shared/ui/atoms/Input/Input';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import { formatMeasurement, toVitalFormValues, toVitalValues } from '@/utils/mappers/vitalSigns';
import { validateVitalSigns } from '@/utils/validation/vitalSigns';
import styles from './VitalSignsForm.module.scss';

type VitalField = keyof VitalSignsValues;

interface Measurement {
  id: string;
  label: string;
  icon: string;
  unit: string;
  fields: VitalField[];
}

const MEASUREMENTS: Measurement[] = [
  { id: 'weight', label: 'Weight', icon: 'monitor_weight', unit: 'kg', fields: ['weightKg'] },
  {
    id: 'blood-pressure',
    label: 'Blood Pressure',
    icon: 'blood_pressure',
    unit: 'mmHg',
    fields: ['systolicBpMmhg', 'diastolicBpMmhg'],
  },
  {
    id: 'heart-rate',
    label: 'Heart Rate',
    icon: 'ecg_heart',
    unit: 'bpm',
    fields: ['heartRateBpm'],
  },
  {
    id: 'respiratory-rate',
    label: 'Respiratory Rate',
    icon: 'pulmonology',
    unit: 'breaths/min',
    fields: ['respiratoryRate'],
  },
  {
    id: 'temperature',
    label: 'Body Temperature',
    icon: 'thermometer',
    unit: '°C',
    fields: ['bodyTempCelsius'],
  },
  {
    id: 'oxygen-saturation',
    label: 'Oxygen Saturation',
    icon: 'spo2',
    unit: 'SpO₂ %',
    fields: ['spo2Percent'],
  },
];

const measuredAtFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export interface VitalSignsFormProps {
  vitals: VitalSignsValues | null;
  measuredAt?: Date | string | null;
  isEditing: boolean;
  canEdit?: boolean;
  isSaving?: boolean;
  saveError?: ReactNode;
  notice?: ReactNode;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: (values: VitalSignsValues) => void | Promise<void>;
  className?: string;
}

function MeasurementLabel({ measurement, hidden }: { measurement: Measurement; hidden?: boolean }) {
  return (
    <span className={styles.label} aria-hidden={hidden || undefined}>
      <span className={styles.iconBox}>
        <Icon name={measurement.icon} className={styles.icon} />
      </span>
      {measurement.label}
    </span>
  );
}

function VitalSignsView({ vitals }: { vitals: VitalSignsValues | null }) {
  return (
    <dl className={styles.grid}>
      {MEASUREMENTS.map((measurement) => {
        const value = formatMeasurement(vitals, measurement.fields);

        return (
          <div key={measurement.id} className={styles.card}>
            <dt>
              <MeasurementLabel measurement={measurement} />
            </dt>
            <dd className={styles.reading}>
              {value == null ? (
                <span className={styles.empty}>Not recorded</span>
              ) : (
                <>
                  <span className={styles.value}>{value}</span>
                  <span className={styles.unit}>{measurement.unit}</span>
                </>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

interface VitalSignsEditorProps {
  formId: string;
  vitals: VitalSignsValues | null;
  isSaving: boolean;
  saveError?: ReactNode;
  onSave?: VitalSignsFormProps['onSave'];
}

function VitalSignsEditor({ formId, vitals, isSaving, saveError, onSave }: VitalSignsEditorProps) {
  const form = useValidatedForm({
    initialValues: toVitalFormValues(vitals),
    validate: validateVitalSigns,
    fieldOrder: VITAL_FIELD_ORDER,
    id: formId,
    disabled: isSaving,
  });

  return (
    <form
      id={form.formId}
      noValidate
      onSubmit={form.handleSubmit((values) => onSave?.(toVitalValues(values)))}
    >
      <div className={styles.grid}>
        {MEASUREMENTS.map((measurement) => (
          <div key={measurement.id} className={styles.card}>
            <MeasurementLabel measurement={measurement} hidden />
            <div className={styles.reading}>
              {measurement.fields.map((field, index) => (
                <div key={field} className={styles.inputGroup}>
                  {index > 0 && (
                    <span className={styles.separator} aria-hidden="true">
                      /
                    </span>
                  )}
                  <Input
                    label={`${VITAL_RULES[field].label}, ${measurement.unit}`}
                    hideLabel
                    size="sm"
                    inputMode="decimal"
                    autoComplete="off"
                    className={styles.input}
                    {...form.bindInput(field)}
                  />
                </div>
              ))}
              <span className={styles.unit} aria-hidden="true">
                {measurement.unit}
              </span>
            </div>
          </div>
        ))}
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

export function VitalSignsForm({
  vitals,
  measuredAt,
  isEditing,
  canEdit = true,
  isSaving = false,
  saveError,
  notice,
  onEdit,
  onCancel,
  onSave,
  className,
}: VitalSignsFormProps) {
  const formId = useId();
  const measuredDate = measuredAt ? new Date(measuredAt) : null;

  const subtitle = measuredDate ? (
    <>
      Most recent measurements ·{' '}
      <time dateTime={measuredDate.toISOString()}>{measuredAtFormat.format(measuredDate)}</time>
    </>
  ) : (
    'No measurements recorded yet'
  );

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
      <Button variant="secondary" onClick={onEdit}>
        Edit measurements
      </Button>
    )
  );

  return (
    <SectionCard
      title="Physical Examination & Vital Signs"
      subtitle={subtitle}
      icon="vital_signs"
      actions={actions}
      className={className}
    >
      {isEditing ? (
        <VitalSignsEditor
          formId={formId}
          vitals={vitals}
          isSaving={isSaving}
          saveError={saveError}
          onSave={onSave}
        />
      ) : (
        <VitalSignsView vitals={vitals} />
      )}
      {notice && !isEditing && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
    </SectionCard>
  );
}
