import type { DoctorMetrics, DoctorRecord } from '@/types/doctors.types';

export const doctorsMock: DoctorRecord[] = [
  {
    id: 'doctor-1',
    name: 'Sarah',
    surname: 'Chen',
    email: 'sarah.chen@clinic.example',
    role: 'clinician',
    status: 'active',
    avatarUrl: null,
    createdOn: '2025-03-14',
  },
  {
    id: 'doctor-2',
    name: 'Andrew',
    surname: 'Miller',
    email: 'andrew.miller@clinic.example',
    role: 'admin',
    status: 'invited',
    avatarUrl: null,
    createdOn: '2025-04-02',
  },
  {
    id: 'doctor-3',
    name: 'Maya',
    surname: 'Patel',
    email: 'maya.patel@clinic.example',
    role: 'clinician',
    status: 'deactivated',
    avatarUrl: null,
    createdOn: '2024-12-19',
  },
];

export const doctorMetricsMock: DoctorMetrics = {
  all: 48,
  active: 36,
  invited: 9,
  deactivated: 3,
};
