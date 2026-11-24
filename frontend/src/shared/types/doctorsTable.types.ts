import type { ReactNode } from 'react';

import type { DoctorAction, DoctorRecord } from './doctors.types';

export interface DoctorsTableProps {
  doctors: DoctorRecord[];
  pendingDoctorId?: string | null;
  onAction?: (doctor: DoctorRecord, action: DoctorAction) => void;
}

export interface DoctorRowContext {
  doctor: DoctorRecord;
  fullName: string;
  isPending: boolean;
  onAction?: DoctorsTableProps['onAction'];
}

export type DoctorColumnId = 'doctor' | 'email' | 'role' | 'status' | 'createdOn' | 'action';

export interface DoctorColumn {
  id: DoctorColumnId;
  header: string;
  render: (context: DoctorRowContext) => ReactNode;
}
