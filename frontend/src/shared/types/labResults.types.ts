export type LabResultStatus = 'completed' | 'pending' | 'notAvailable';

export interface LabResult {
  id: string;
  name: string;
  category: string;
  date: string | null;
  status: LabResultStatus;
  summary: string;
  isFlagged?: boolean;
  details?: string | null;
}
