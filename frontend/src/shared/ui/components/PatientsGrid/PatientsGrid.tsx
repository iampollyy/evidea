import type { ComponentPropsWithRef } from 'react';

import type { LayoutOption } from '@/shared/ui/atoms/LayoutOptions/LayoutOptions';
import {
  PatientCard,
  type PatientCardPatient,
} from '@/shared/ui/components/PatientCard/PatientCard';
import styles from './PatientsGrid.module.scss';

export interface PatientsGridPatient extends PatientCardPatient {
  id: string;
}

export interface PatientsGridProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  patients: PatientsGridPatient[];
  layout?: LayoutOption;
  onPatientMenuClick?: (patient: PatientsGridPatient) => void;
}

export function PatientsGrid({
  patients,
  layout = 'grid',
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
            onMenuClick={onPatientMenuClick && (() => onPatientMenuClick(patient))}
          />
        </li>
      ))}
    </ul>
  );
}
