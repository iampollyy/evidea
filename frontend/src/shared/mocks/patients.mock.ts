import sampleAvatar from '@/assets/sample-image.jpg';
import type { PatientsGridPatient } from '@/ui/components/PatientsGrid/PatientsGrid';

export const patientsMock: PatientsGridPatient[] = Array.from({ length: 15 }, (_, index) => ({
  id: `patient-${index + 1}`,
  name: 'Alberto Ripley',
  age: 26,
  gender: 'Male',
  avatarSrc: sampleAvatar,
  lastAppointment: new Date(2026, 3, 30),
}));
