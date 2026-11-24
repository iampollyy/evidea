import { VITAL_FIELD_ORDER } from '@/constants/vitalSigns.constants';
import type { VitalSignsRecord } from '@/shared/types/cases.types';
import { isRecord } from '@/utils/typeGuards';

const API_URL = '/api/v1';

function isVitalSignsRecord(value: unknown): value is VitalSignsRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    VITAL_FIELD_ORDER.every((field) => typeof value[field] === 'number' || value[field] === null)
  );
}

async function getJson(url: string, action: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { credentials: 'include', signal });
  if (!response.ok) {
    throw new Error(`${action}: HTTP ${response.status}`);
  }
  return response.json();
}

async function getLatestCaseId(patientId: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: '1', pageSize: '1' });
  const page = await getJson(
    `${API_URL}/patients/${encodeURIComponent(patientId)}/cases?${params.toString()}`,
    'Unable to load clinical cases',
    signal,
  );
  if (!isRecord(page) || !Array.isArray(page.items)) {
    throw new Error('Unable to load clinical cases: invalid response');
  }

  const [latest] = page.items;
  return isRecord(latest) && typeof latest.id === 'string' ? latest.id : null;
}

export async function getLatestVitalSigns(
  patientId: string,
  signal?: AbortSignal,
): Promise<VitalSignsRecord | null> {
  const caseId = await getLatestCaseId(patientId, signal);
  if (!caseId) return null;

  const detail = await getJson(
    `${API_URL}/cases/${encodeURIComponent(caseId)}`,
    'Unable to load vital signs',
    signal,
  );
  if (!isRecord(detail) || !Array.isArray(detail.vitalSigns)) {
    throw new Error('Unable to load vital signs: invalid response');
  }

  const records = detail.vitalSigns.filter(isVitalSignsRecord);
  return records.reduce<VitalSignsRecord | null>(
    (latest, record) => (!latest || record.createdAt > latest.createdAt ? record : latest),
    null,
  );
}
