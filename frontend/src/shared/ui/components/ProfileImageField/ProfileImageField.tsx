import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Image } from '@/shared/ui/atoms/Image/Image';
import styles from './ProfileImageField.module.scss';

export interface ProfileImageFieldProps {
  label: ReactNode;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
}

export function ProfileImageField({
  label,
  value,
  onChange,
  accept = 'image/png, image/jpeg, image/webp',
  id,
  name,
  disabled,
  error,
  className,
}: ProfileImageFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hasError = error != null && error !== false && error !== '';

  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const previewUrl = preview && preview.file === value ? preview.url : null;

  const previewRef = useRef(preview);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.url);
    },
    [],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(file.type.startsWith('image/') ? { file, url: URL.createObjectURL(file) } : null);
    onChange(file);
  };

  const classes = [styles.field, hasError && styles.invalid, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className={styles.row}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <label htmlFor={inputId} className={styles.picker}>
          {previewUrl ? (
            <Image src={previewUrl} alt="" aspectRatio="1/1" className={styles.preview} />
          ) : (
            <Icon name="person_add" className={styles.placeholderIcon} />
          )}
          <span className={styles.badge}>
            <Icon name="image" className={styles.badgeIcon} />
          </span>
        </label>
        <input
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={styles.visuallyHidden}
          onChange={handleChange}
        />
      </div>
      {hasError && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
