import { useEffect, useId, useRef, type ComponentPropsWithRef } from 'react';

import { Icon } from '@/ui/atoms/Icon/Icon';
import { assignRef } from '@/utils/assignRef';
import styles from './SearchField.module.scss';

export interface SearchFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  label?: string;
  shortcutKey?: string | null;
}

export function SearchField({
  label = 'Search',
  placeholder = 'Search',
  shortcutKey = 'k',
  id,
  className,
  ref,
  'aria-keyshortcuts': ariaKeyShortcuts,
  ...rest
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcutKey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === shortcutKey.toLowerCase()
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey]);

  const classes = [styles.field, className].filter(Boolean).join(' ');
  const keyShortcuts =
    ariaKeyShortcuts ??
    (shortcutKey
      ? `Meta+${shortcutKey.toUpperCase()} Control+${shortcutKey.toUpperCase()}`
      : undefined);

  return (
    <label htmlFor={inputId} className={classes}>
      <span className={styles.visuallyHidden}>{label}</span>
      <Icon name="search" className={styles.searchIcon} />
      <input
        ref={(node) => {
          inputRef.current = node;
          assignRef(ref, node);
        }}
        id={inputId}
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        aria-keyshortcuts={keyShortcuts}
        className={styles.input}
        {...rest}
      />
      {shortcutKey && (
        <span className={styles.shortcut} aria-hidden="true">
          <Icon name="keyboard_command_key" className={styles.shortcutIcon} />
        </span>
      )}
    </label>
  );
}
