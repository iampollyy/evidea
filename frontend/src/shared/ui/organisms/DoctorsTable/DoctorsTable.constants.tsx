import { ROLE_LABELS } from '@/shared/lib/doctor/role';
import {
  ACTION_LABELS,
  STATUS_ACTIONS,
  STATUS_BADGE_VARIANTS,
  STATUS_LABELS,
} from '@/shared/lib/doctor/status';
import { Badge } from '@/shared/ui/atoms/Badge/Badge';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Avatar } from '@/shared/ui/components/Avatar/Avatar';
import type { DoctorColumn } from './DoctorsTable.types';
import styles from './DoctorsTable.module.scss';

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatCreatedDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? date : dateFormatter.format(parsedDate);
}

export const DOCTOR_COLUMNS: DoctorColumn[] = [
  {
    id: 'doctor',
    header: 'Doctor',
    render: ({ doctor, fullName }) => (
      <>
        <Avatar name={fullName} src={doctor.avatarUrl ?? undefined} size="sm" />
        <span className={styles.doctorName}>{fullName}</span>
      </>
    ),
  },
  {
    id: 'email',
    header: 'Email address',
    render: ({ doctor }) => (
      <span className={styles.truncate} title={doctor.email}>
        {doctor.email}
      </span>
    ),
  },
  {
    id: 'role',
    header: 'Role',
    render: ({ doctor }) => ROLE_LABELS[doctor.role],
  },
  {
    id: 'status',
    header: 'Status',
    render: ({ doctor }) => (
      <Badge variant={STATUS_BADGE_VARIANTS[doctor.status]} size="sm" pill>
        {STATUS_LABELS[doctor.status]}
      </Badge>
    ),
  },
  {
    id: 'createdOn',
    header: 'Added',
    render: ({ doctor }) => formatCreatedDate(doctor.createdOn),
  },
  {
    id: 'action',
    header: 'Action',
    render: ({ doctor, fullName, isPending, onAction }) => {
      const action = STATUS_ACTIONS[doctor.status];
      const label = ACTION_LABELS[action];

      return (
        <Button
          variant="ghost"
          size="sm"
          className={styles.actionButton}
          disabled={!onAction || isPending}
          aria-label={`${label} ${fullName}`}
          onClick={() => onAction?.(doctor, action)}
        >
          {isPending ? 'Saving…' : label}
        </Button>
      );
    },
  },
];
