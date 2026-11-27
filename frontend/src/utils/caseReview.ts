import { ANAMNESIS_FIELDS } from '@/constants/anamnesis.constants';
import { CASE_REVIEW_LAB_CATEGORY } from '@/constants/caseReview.constants';
import type { CaseLabReport, CaseLabTest } from '@/shared/types/caseReview.types';
import type { AnamnesisValues } from '@/shared/types/cases.types';

export function getAnamnesisBrief(anamnesis: AnamnesisValues | null) {
  return anamnesis?.clinicalNotes ?? anamnesis?.chiefComplaint ?? null;
}

export function getFilledAnamnesisFields(anamnesis: AnamnesisValues | null) {
  return ANAMNESIS_FIELDS.filter(({ id }) => anamnesis?.[id]);
}

export function hasAnamnesis(anamnesis: AnamnesisValues | null) {
  return Boolean(getAnamnesisBrief(anamnesis)) || getFilledAnamnesisFields(anamnesis).length > 0;
}

export function countAvailableLabTests(tests: CaseLabTest[]) {
  return tests.filter(({ status }) => status === 'completed').length;
}

export function toCaseLabTests(reports: CaseLabReport[]): CaseLabTest[] {
  return reports.map(({ id, panelName }) => ({
    id,
    name: panelName,
    category: CASE_REVIEW_LAB_CATEGORY,
    status: 'completed',
  }));
}
