import type { ComponentPropsWithRef } from 'react';

import stripeBlue from '@/assets/decor/banner-stripe-blue.svg';
import stripeViolet from '@/assets/decor/banner-stripe-violet.svg';
import type { PatientStatus } from '@/shared/types/patients.types';
import type { Sex } from '@/shared/types/person.types';
import { Badge } from '@/shared/ui/atoms/Badge/Badge';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Image } from '@/shared/ui/atoms/Image/Image';
import { getAge, toDate, toIsoDate } from '@/utils/date';
import { getSexLabel } from '@/utils/sex';
import styles from './PatientBanner.module.scss';

export interface PatientBannerPatient {
  code: string;
  name: string;
  surname: string;
  birthDate: Date | string;
  sex: Sex;
  status?: PatientStatus;
  phoneNumber?: string | null;
  lastVisit?: Date | string | null;
  photoSrc?: string;
}

export interface PatientBannerProps extends Omit<ComponentPropsWithRef<'section'>, 'children'> {
  patient: PatientBannerPatient;
  onAddCase?: () => void;
}

const STATUS_BADGES = {
  active: { variant: 'success', label: 'Active patient' },
  archived: { variant: 'neutral', label: 'Archived patient' },
} as const;

const longDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function FormattedDate({ value }: { value: Date | string }) {
  const date = toDate(value);
  if (!date) return <>{String(value)}</>;
  return <time dateTime={toIsoDate(date)}>{longDate.format(date)}</time>;
}

export function PatientBanner({ patient, onAddCase, className, ...rest }: PatientBannerProps) {
  const {
    code,
    name,
    surname,
    birthDate,
    sex,
    status = 'active',
    phoneNumber,
    lastVisit,
    photoSrc,
  } = patient;

  const fullName = `${name} ${surname}`;
  const birth = toDate(birthDate);
  const age = birth ? getAge(birth, new Date()) : null;
  const sexLabel = getSexLabel(sex) ?? sex;
  const badge = STATUS_BADGES[status];
  const classes = [styles.banner, className].filter(Boolean).join(' ');

  const photoFallback = (
    <span className={styles.photoPlaceholder}>
      <Icon name="person" className={styles.photoPlaceholderIcon} />
    </span>
  );

  return (
    <section className={classes} aria-label={`Patient ${fullName}`} {...rest}>
      <div className={styles.decor} aria-hidden="true">
        <Image
          src={stripeBlue}
          alt=""
          width={119}
          height={226}
          loading="eager"
          className={styles.stripeBlue}
        />
        <Image
          src={stripeViolet}
          alt=""
          width={104}
          height={285}
          loading="eager"
          className={styles.stripeViolet}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.profile}>
          <div className={styles.photo}>
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={fullName}
                aspectRatio="1/1"
                loading="eager"
                className={styles.photoImage}
                fallback={photoFallback}
              />
            ) : (
              photoFallback
            )}
          </div>

          <div className={styles.details}>
            <div className={styles.idRow}>
              <span className={styles.code}>{code}</span>
              <Badge variant={badge.variant} size="sm" pill>
                {badge.label}
              </Badge>
            </div>
            <h1 className={styles.name}>{fullName}</h1>
            <p className={styles.summary}>
              {age != null && `${age} ${age === 1 ? 'year' : 'years'} · `}
              {sexLabel} · Born <FormattedDate value={birthDate} />
            </p>

            {(phoneNumber || lastVisit) && (
              <ul className={styles.facts}>
                {phoneNumber && (
                  <li className={styles.fact}>
                    <Icon name="call" className={styles.factIcon} />
                    <span>
                      Phone: <a href={`tel:${phoneNumber.replace(/[^\d+]/g, '')}`}>{phoneNumber}</a>
                    </span>
                  </li>
                )}
                {lastVisit && (
                  <li className={styles.fact}>
                    <Icon name="calendar_month" className={styles.factIcon} />
                    <span>
                      Last visit: <FormattedDate value={lastVisit} />
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {onAddCase && (
          <Button icon={<Icon name="add" />} onClick={onAddCase}>
            Add New Case
          </Button>
        )}
      </div>
    </section>
  );
}
