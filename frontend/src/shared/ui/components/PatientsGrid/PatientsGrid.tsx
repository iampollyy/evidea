import type { ComponentPropsWithRef, MouseEvent } from 'react';

import type { LayoutOption } from '@/ui/atoms/LayoutOptions/LayoutOptions';
import {
  PatientCard,
  type PatientCardPatient,
} from '@/ui/components/PatientCard/PatientCard';
import styles from './PatientsGrid.module.scss';

export interface PatientsGridPatient extends PatientCardPatient {
  id: string;
}

export interface PatientsGridProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  patients: PatientsGridPatient[];
  layout?: LayoutOption;
  getPatientHref?: (patient: PatientsGridPatient) => string;
  onPatientNavigate?: (patient: PatientsGridPatient, event: MouseEvent<HTMLAnchorElement>) => void;
  onPatientMenuClick?: (patient: PatientsGridPatient) => void;
}

export function PatientsGrid({
  patients,
  layout = 'grid',
  getPatientHref,
  onPatientNavigate,
  onPatientMenuClick,
  className,
  ...rest
}: PatientsGridProps) {
  const classes = [styles.grid, layout === 'list' && styles.list, className]
    .filter(Boolean)
    .join(' ');

  return (
    <ul className={classes} {...rest}>
      {patients.map((patient) => (
        <li key={patient.id} className={styles.item}>
          <PatientCard
            patient={patient}
            href={getPatientHref?.(patient)}
            onNavigate={onPatientNavigate && ((event) => onPatientNavigate(patient, event))}
            onMenuClick={onPatientMenuClick && (() => onPatientMenuClick(patient))}
          />
        </li>
      ))}
    </ul>
  );
}
