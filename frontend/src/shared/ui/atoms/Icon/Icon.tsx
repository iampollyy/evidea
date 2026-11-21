import styles from './Icon.module.scss';

export interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const classes = [styles.icon, className].filter(Boolean).join(' ');

  return (
    <span className={classes} aria-hidden="true">
      {name}
    </span>
  );
}
