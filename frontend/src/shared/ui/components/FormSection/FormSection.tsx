import type { ComponentPropsWithRef, ReactNode } from 'react';

import styles from './FormSection.module.scss';

export interface FormSectionProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'title'> {
  title: ReactNode;
  leading?: ReactNode;
}

export function FormSection({ title, leading, className, children, ...rest }: FormSectionProps) {
  const classes = [styles.section, className].filter(Boolean).join(' ');

  return (
    <fieldset className={classes} {...rest}>
      <legend className={styles.title}>{title}</legend>
      <div className={styles.body}>
        {leading}
        <div className={styles.grid}>{children}</div>
      </div>
    </fieldset>
  );
}
