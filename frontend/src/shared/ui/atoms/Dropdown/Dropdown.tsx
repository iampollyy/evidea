import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import styles from './Dropdown.module.scss';

export type DropdownSize = 'sm' | 'md' | 'lg';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  label: ReactNode;
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: DropdownSize;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
}

const TYPEAHEAD_TIMEOUT = 500;

export function Dropdown({
  label,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  size = 'md',
  name,
  id,
  required,
  disabled,
  hideLabel = false,
  hint,
  error,
  className,
}: DropdownProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ query: '', timeout: 0 });

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const currentValue = value !== undefined ? value : internalValue;
  const selectedIndex = options.findIndex((option) => option.value === currentValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const hasError = error != null && error !== false && error !== '';

  const describedBy =
    [hint != null && hintId, hasError && errorId].filter(Boolean).join(' ') || undefined;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    listboxRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex]);

  useEffect(() => () => window.clearTimeout(typeahead.current.timeout), []);

  const findEnabled = (start: number, step: 1 | -1) => {
    for (let index = start; index >= 0 && index < options.length; index += step) {
      if (!options[index].disabled) return index;
    }
    return -1;
  };

  const firstEnabled = () => findEnabled(0, 1);
  const lastEnabled = () => findEnabled(options.length - 1, -1);

  const open = (index: number) => {
    setIsOpen(true);
    setActiveIndex(index);
  };

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const select = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    if (value === undefined) setInternalValue(option.value);
    if (option.value !== currentValue) onChange?.(option.value);
    close();
    comboboxRef.current?.focus();
  };

  const findByTypeahead = (character: string) => {
    const state = typeahead.current;
    window.clearTimeout(state.timeout);
    state.query += character.toLowerCase();
    state.timeout = window.setTimeout(() => {
      state.query = '';
    }, TYPEAHEAD_TIMEOUT);

    const start = (isOpen ? activeIndex : selectedIndex) + 1;
    const ordered = [...options.slice(start), ...options.slice(0, start)];
    const match = ordered.find(
      (option) => !option.disabled && option.label.toLowerCase().startsWith(state.query),
    );
    return match ? options.indexOf(match) : -1;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const { key, altKey } = event;
    const initialIndex = selectedIndex >= 0 ? selectedIndex : firstEnabled();

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        open(key === 'ArrowUp' && selectedIndex < 0 ? lastEnabled() : initialIndex);
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        open(key === 'Home' ? firstEnabled() : lastEnabled());
      } else if (key.length === 1 && key !== ' ' && !event.ctrlKey && !event.metaKey) {
        const match = findByTypeahead(key);
        open(match >= 0 ? match : initialIndex);
      }
      return;
    }

    switch (key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = findEnabled(activeIndex + 1, 1);
        if (next >= 0) setActiveIndex(next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (altKey) {
          select(activeIndex);
          break;
        }
        const previous = findEnabled(activeIndex - 1, -1);
        if (previous >= 0) setActiveIndex(previous);
        break;
      }
      case 'Home':
        event.preventDefault();
        setActiveIndex(firstEnabled());
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(lastEnabled());
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        select(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (key.length === 1 && !event.ctrlKey && !event.metaKey) {
          const match = findByTypeahead(key);
          if (match >= 0) setActiveIndex(match);
        }
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (isOpen) {
      close();
    } else {
      open(selectedIndex >= 0 ? selectedIndex : firstEnabled());
    }
  };

  const classes = [
    styles.field,
    styles[size],
    isOpen && styles.open,
    hasError && styles.invalid,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={rootRef} className={classes}>
      <span
        id={labelId}
        className={hideLabel ? styles.visuallyHidden : styles.label}
        onClick={() => comboboxRef.current?.focus()}
      >
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </span>
      <div className={styles.control}>
        <div
          ref={comboboxRef}
          id={baseId}
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          className={styles.trigger}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-required={required || undefined}
          aria-invalid={hasError || undefined}
          aria-disabled={disabled || undefined}
          aria-describedby={describedBy}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget)) close();
          }}
        >
          <span className={selectedOption ? styles.value : styles.placeholder}>
            {selectedOption?.label ?? placeholder}
          </span>
          <Icon name="keyboard_arrow_down" className={styles.chevron} />
        </div>
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          className={styles.listbox}
          hidden={!isOpen}
        >
          {options.map((option, index) => {
            const optionClasses = [
              styles.option,
              index === activeIndex && styles.active,
              index === selectedIndex && styles.selected,
              option.disabled && styles.optionDisabled,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li
                key={option.value}
                id={optionId(index)}
                data-index={index}
                role="option"
                aria-selected={index === selectedIndex}
                aria-disabled={option.disabled || undefined}
                className={optionClasses}
                onPointerDown={(event) => event.preventDefault()}
                onPointerEnter={() => !option.disabled && setActiveIndex(index)}
                onClick={() => select(index)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      </div>
      {name && <input type="hidden" name={name} value={currentValue ?? ''} />}
      {hint != null && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
