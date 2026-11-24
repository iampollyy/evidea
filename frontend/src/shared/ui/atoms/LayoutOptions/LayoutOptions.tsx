import { useRef, type KeyboardEvent } from 'react';

import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import styles from './LayoutOptions.module.scss';

export type LayoutOption = 'list' | 'grid';

export interface LayoutOptionsProps {
  value: LayoutOption;
  onChange?: (value: LayoutOption) => void;
  label?: string;
  className?: string;
}

const OPTIONS: { value: LayoutOption; label: string; icon: string }[] = [
  { value: 'list', label: 'List view', icon: 'list' },
  { value: 'grid', label: 'Grid view', icon: 'grid_view' },
];

export function LayoutOptions({
  value,
  onChange,
  label = 'Layout',
  className,
}: LayoutOptionsProps) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const nextIndex = (index + OPTIONS.length) % OPTIONS.length;
    const option = OPTIONS[nextIndex];
    optionRefs.current[nextIndex]?.focus();
    if (option.value !== value) onChange?.(option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(index - 1);
    }
  };

  const classes = [styles.group, className].filter(Boolean).join(' ');

  return (
    <div role="radiogroup" aria-label={label} className={classes}>
      {OPTIONS.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            tabIndex={isSelected ? 0 : -1}
            className={isSelected ? `${styles.option} ${styles.selected}` : styles.option}
            onClick={() => select(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <Icon name={option.icon} className={styles.icon} />
          </button>
        );
      })}
    </div>
  );
}
