import { STATUS_ACTIONS } from '@/constants/doctor.constants';
import type { DoctorColumnId, DoctorsTableProps } from '@/shared/types/doctorsTable.types';
import { DOCTOR_COLUMNS } from './DoctorsTable.constants';
import styles from './DoctorsTable.module.scss';

const columnClassNames: Record<DoctorColumnId, string> = {
  doctor: styles.doctorColumn,
  email: styles.emailColumn,
  role: styles.roleColumn,
  status: styles.statusColumn,
  createdOn: styles.dateColumn,
  action: styles.actionColumn,
};

function cellClassName(columnId: DoctorColumnId) {
  return `${styles.cell} ${columnClassNames[columnId]}`;
}

export function DoctorsTable({ doctors, pendingDoctorId, onAction }: DoctorsTableProps) {
  return (
    <div className={styles.scrollRegion}>
      <div
        className={styles.table}
        role="table"
        aria-label="Doctors"
        aria-rowcount={doctors.length + 1}
      >
        <div className={`${styles.row} ${styles.heading}`} role="row">
          {DOCTOR_COLUMNS.map((column) => (
            <div key={column.id} className={cellClassName(column.id)} role="columnheader">
              {column.header}
            </div>
          ))}
        </div>

        {doctors.map((doctor) => {
          const context = {
            doctor,
            fullName: `${doctor.name} ${doctor.surname}`,
            isPending: pendingDoctorId === doctor.id,
            onAction,
          };
          const rowClassName =
            STATUS_ACTIONS[doctor.status] === 'deactivate'
              ? `${styles.row} ${styles.deactivationRow}`
              : styles.row;

          return (
            <div key={doctor.id} className={rowClassName} role="row">
              {DOCTOR_COLUMNS.map((column) => (
                <div key={column.id} className={cellClassName(column.id)} role="cell">
                  {column.render(context)}
                </div>
              ))}
            </div>
          );
        })}

        {doctors.length === 0 && (
          <div className={styles.emptyState} role="row">
            <div className={styles.emptyCell} role="cell">
              No doctors found.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
