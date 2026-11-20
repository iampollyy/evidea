import type { ComponentPropsWithRef } from 'react';

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
  onPatientMenuClick?: (patient: PatientsGridPatient) => void;
}

export function PatientsGrid({
  patients,
  onPatientMenuClick,
  className,
  ...rest
}: PatientsGridProps) {
  const classes = [styles.grid, className].filter(Boolean).join(' ');

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
