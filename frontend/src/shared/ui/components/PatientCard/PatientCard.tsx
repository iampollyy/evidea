import type { ComponentPropsWithRef, MouseEvent } from 'react';

import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Avatar } from '@/shared/ui/components/Avatar/Avatar';
import { formatAppointmentDate, toIsoDate } from '@/utils/date';
import { isPlainLeftClick } from '@/utils/isPlainLeftClick';
import styles from './PatientCard.module.scss';

export interface PatientCardPatient {
  name: string;
  age: number;
  gender: string;
  avatarSrc?: string;
  lastAppointment?: Date | string;
  location?: string;
}

export interface PatientCardProps extends Omit<ComponentPropsWithRef<'article'>, 'children'> {
  patient: PatientCardPatient;
  href?: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMenuClick?: () => void;
}

export function PatientCard({
  patient,
  href,
  onNavigate,
  onMenuClick,
  className,
  ...rest
}: PatientCardProps) {
  const { name, age, gender, avatarSrc, lastAppointment, location } = patient;
  const classes = [styles.card, href && styles.interactive, className].filter(Boolean).join(' ');
  const hasMeta = lastAppointment != null || location != null;

  return (
    <article className={classes} aria-label={name} {...rest}>
      <div className={styles.top}>
        <div className={styles.details}>
          <Avatar name={name} src={avatarSrc} size="md" decorative />
          <div className={styles.identity}>
            <h3 className={styles.name}>
              {href ? (
                <a
                  href={href}
                  className={styles.link}
                  onClick={(event) => {
                    if (onNavigate && isPlainLeftClick(event)) onNavigate(event);
                  }}
                >
                  {name}
                </a>
              ) : (
                name
              )}
            </h3>
            <p className={styles.secondary}>
              {age}, {gender}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="more_vert" className={styles.menuIcon} />}
          aria-label={`More actions for ${name}`}
          className={styles.menuButton}
          onClick={onMenuClick}
        />
      </div>
      {hasMeta && (
        <dl className={styles.meta}>
          {lastAppointment != null && (
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>
                <Icon name="calendar_today" className={styles.metaIcon} />
                Last Appointment :
              </dt>
              <dd className={styles.metaValue}>
                {lastAppointment instanceof Date ? (
                  <time dateTime={toIsoDate(lastAppointment)}>
                    {formatAppointmentDate(lastAppointment)}
                  </time>
                ) : (
                  lastAppointment
                )}
              </dd>
            </div>
          )}
          {location != null && (
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>
                <Icon name="location_on" className={styles.metaIcon} />
                <span className={styles.visuallyHidden}>Location</span>
              </dt>
              <dd className={styles.metaValue}>{location}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}
