import { useId, useState, type ChangeEvent, type FormEvent } from 'react';

import type { FieldName, StringField, UseValidatedFormOptions } from '@/types/forms.types';
import { trimStrings } from '@/utils/trimStrings';

export function useValidatedForm<T extends object>({
  initialValues,
  validate,
  fieldOrder,
  id,
  disabled = false,
}: UseValidatedFormOptions<T>) {
  const generatedId = useId();
  const formId = id ?? generatedId;

  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<FieldName<T>, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validate(values);
  const invalidFields = fieldOrder.filter((field) => errors[field]);

  const fieldId = (field: FieldName<T>) => `${formId}-${field}`;

  const errorFor = (field: FieldName<T>) =>
    submitAttempted || touched[field] ? errors[field] : undefined;

  const setValue = <K extends FieldName<T>>(field: K, value: T[K]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const touch = (field: FieldName<T>) => {
    setTouched((previous) => (previous[field] ? previous : { ...previous, [field]: true }));
  };

  const bindInput = <K extends StringField<T>>(field: K) => ({
    id: fieldId(field),
    name: field,
    value: values[field] as string,
    error: errorFor(field),
    disabled,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(field, event.target.value as T[K]),
    onBlur: () => touch(field),
  });

  const bindDropdown = <K extends StringField<T>>(field: K) => ({
    id: fieldId(field),
    name: field,
    value: values[field] as string,
    error: errorFor(field),
    disabled,
    onChange: (value: string) => {
      setValue(field, value as T[K]);
      touch(field);
    },
  });

  const handleSubmit =
    (onValid: (values: T) => void | Promise<void>) => (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (disabled) return;
      setSubmitAttempted(true);

      const [firstInvalid] = invalidFields;
      if (firstInvalid) {
        document.getElementById(fieldId(firstInvalid))?.focus();
        return;
      }

      void onValid(trimStrings(values));
    };

  return {
    formId,
    values,
    errorFor,
    fieldId,
    setValue,
    touch,
    bindInput,
    bindDropdown,
    handleSubmit,
    invalidFieldCount: submitAttempted ? invalidFields.length : 0,
  };
}
