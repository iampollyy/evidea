import { useEffect, useState } from 'react';

import { getCase } from '@/api/cases';
import { getPatient } from '@/api/patients';
import { CASE_REVIEW_MISMATCH_ERROR } from '@/constants/caseReview.constants';
import type { CaseDetail, CaseReviewData } from '@/shared/types/caseReview.types';
import type { PatientDetail } from '@/shared/types/patients.types';
import { toCaseLabTests } from '@/utils/caseReview';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { toBannerPatient } from '@/utils/mappers/patient';

interface LoadedCaseReview {
  key: number;
  patient: PatientDetail | null;
  clinicalCase: CaseDetail | null;
  error: string | null;
}

export function useCaseReview(patientId: string, caseId: string): CaseReviewData {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loaded, setLoaded] = useState<LoadedCaseReview | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const key = refreshKey;

    Promise.all([getPatient(patientId, controller.signal), getCase(caseId, controller.signal)])
      .then(([patient, clinicalCase]) => {
        if (controller.signal.aborted) return;
        if (clinicalCase.patientId !== patient.id) {
          setLoaded({ key, patient: null, clinicalCase: null, error: CASE_REVIEW_MISMATCH_ERROR });
          return;
        }
        setLoaded({ key, patient, clinicalCase, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ key, patient: null, clinicalCase: null, error: getErrorMessage(error) });
      });

    return () => controller.abort();
  }, [patientId, caseId, refreshKey]);

  const isCurrent = loaded?.key === refreshKey;
  const patient = isCurrent ? loaded.patient : null;
  const clinicalCase = isCurrent ? loaded.clinicalCase : null;

  return {
    patient: patient && toBannerPatient(patient),
    anamnesis: clinicalCase?.anamnesis ?? null,
    labTests: clinicalCase ? toCaseLabTests(clinicalCase.labReports) : [],
    hasVitalSigns: (clinicalCase?.vitalSigns.length ?? 0) > 0,
    isLoading: !isCurrent,
    error: isCurrent ? loaded.error : null,
    onRetry: () => setRefreshKey((key) => key + 1),
  };
}
