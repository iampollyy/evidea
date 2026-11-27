import { useRef, type KeyboardEvent } from 'react';

import { EXPLANATION_METHODS } from '@/constants/predictionResults.constants';
import type { ExplanationMethod } from '@/shared/types/predictions.types';
import styles from './ExplanationMethodSwitch.module.scss';

export interface ExplanationMethodSwitchProps {
  value: ExplanationMethod;
  onChange?: (value: ExplanationMethod) => void;
  className?: string;
}

const METHODS: ExplanationMethod[] = ['shap', 'lime'];

export function ExplanationMethodSwitch({
  value,
  onChange,
  className,
}: ExplanationMethodSwitchProps) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const nextIndex = (index + METHODS.length) % METHODS.length;
    optionRefs.current[nextIndex]?.focus();
    if (METHODS[nextIndex] !== value) onChange?.(METHODS[nextIndex]);
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
    <div role="radiogroup" aria-label="Explanation method" className={classes}>
      {METHODS.map((method, index) => {
        const isSelected = method === value;

        return (
          <button
            key={method}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={isSelected ? `${styles.option} ${styles.selected}` : styles.option}
            onClick={() => select(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {EXPLANATION_METHODS[method].label}
          </button>
        );
      })}
    </div>
  );
}
