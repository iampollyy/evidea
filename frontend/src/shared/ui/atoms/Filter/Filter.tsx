import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import { Icon } from '@/ui/atoms/Icon/Icon';
import styles from './Filter.module.scss';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  label?: string;
  menuLabel?: string;
  applied?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Filter<T extends string = string>({
  options,
  value,
  onChange,
  label = 'Filter',
  menuLabel = label,
  applied = false,
  disabled = false,
  className,
}: FilterProps<T>) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  useEffect(() => {
    if (!isOpen) return;

    itemRefs.current[selectedIndex]?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, selectedIndex]);

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const select = (option: FilterOption<T>) => {
    if (option.value !== value) onChange?.(option.value);
    close();
  };

  const focusItem = (index: number) => {
    const count = options.length;
    itemRefs.current[(index + count) % count]?.focus();
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = itemRefs.current.findIndex((item) => item === document.activeElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(currentIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(currentIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(options.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const classes = [styles.filter, className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={classes}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <Icon name="filter_alt" className={styles.icon} />
        {label}
        {applied && (
          <>
            <span className={styles.indicator} aria-hidden="true" />
            <span className={styles.visuallyHidden}>(applied)</span>
          </>
        )}
      </button>
      <div
        id={menuId}
        role="menu"
        aria-label={menuLabel}
        className={styles.menu}
        hidden={!isOpen}
        onKeyDown={handleMenuKeyDown}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;

          return (
            <button
              key={option.value}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={isSelected}
              tabIndex={-1}
              className={isSelected ? `${styles.item} ${styles.selected}` : styles.item}
              onClick={() => select(option)}
            >
              {option.label}
              {isSelected && <Icon name="check" className={styles.check} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
