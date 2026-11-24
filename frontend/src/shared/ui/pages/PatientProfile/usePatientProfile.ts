import { useEffect, useState } from 'react';

import { getLatestVitalSigns } from '@/shared/api/cases';
import type { VitalSignsRecord, VitalSignsValues } from '@/shared/api/cases.types';
import { getPatient, replacePatient } from '@/shared/api/patients';
import type { PatientDetail } from '@/shared/api/patients.types';
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage';
import { toPatientInput } from '@/shared/ui/components/AddPatientForm/validatePatient';
import type { PersonalInfoValues } from '@/shared/ui/organisms/PersonalInfoForm/PersonalInfoForm';
import { VITALS_LOCAL_ONLY_NOTICE } from './PatientProfile.constants';
import type { PatientProfileData } from './PatientProfile.types';
import { toBannerPatient, toPersonalInfoValues } from './PatientProfile.utils';

interface LoadedProfile {
  key: number;
  patient: PatientDetail | null;
  vitals: VitalSignsRecord | null;
  error: string | null;
  vitalsError: string | null;
}

interface SectionState {
  isEditing: boolean;
  isSaving: boolean;
  saveError: string | null;
}

const IDLE: SectionState = { isEditing: false, isSaving: false, saveError: null };

export function usePatientProfile(patientId: string): PatientProfileData {
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<LoadedProfile | null>(null);
  const [personalState, setPersonalState] = useState<SectionState>(IDLE);
  const [vitalsState, setVitalsState] = useState<SectionState>(IDLE);
  const [vitalsNotice, setVitalsNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const key = refreshKey;

    void Promise.allSettled([
      getPatient(patientId, controller.signal),
      getLatestVitalSigns(patientId, controller.signal),
    ]).then(([patientResult, vitalsResult]) => {
      if (controller.signal.aborted) return;
      setProfile({
        key,
        patient: patientResult.status === 'fulfilled' ? patientResult.value : null,
        error: patientResult.status === 'rejected' ? getErrorMessage(patientResult.reason) : null,
        vitals: vitalsResult.status === 'fulfilled' ? vitalsResult.value : null,
        vitalsError:
          vitalsResult.status === 'rejected' ? getErrorMessage(vitalsResult.reason) : null,
      });
    });

    return () => controller.abort();
  }, [patientId, refreshKey]);

  const patient = profile?.patient ?? null;
  const vitals = profile?.vitals ?? null;
  const canEdit = patient?.status === 'active';

  const savePersonalInfo = async (values: PersonalInfoValues) => {
    setPersonalState({ isEditing: true, isSaving: true, saveError: null });
    try {
      const updated = await replacePatient(patientId, toPatientInput(values));
      setProfile((current) => current && { ...current, patient: updated });
      setPersonalState(IDLE);
    } catch (error) {
      setPersonalState({ isEditing: true, isSaving: false, saveError: getErrorMessage(error) });
    }
  };

  const saveVitalSigns = (values: VitalSignsValues) => {
    setProfile(
      (current) =>
        current && {
          ...current,
          vitals: {
            id: current.vitals?.id ?? 'local',
            ...values,
            createdAt: new Date().toISOString(),
          },
        },
    );
    setVitalsNotice(VITALS_LOCAL_ONLY_NOTICE);
    setVitalsState(IDLE);
  };

  return {
    patient: patient && toBannerPatient(patient),
    isLoading: profile?.key !== refreshKey,
    error: profile?.key === refreshKey ? profile.error : null,
    onRetry: () => setRefreshKey((key) => key + 1),
    personalInfo: patient && {
      values: toPersonalInfoValues(patient),
      canEdit,
      ...personalState,
      onEdit: () => setPersonalState({ ...IDLE, isEditing: true }),
      onCancel: () => setPersonalState(IDLE),
      onSave: savePersonalInfo,
    },
    vitalSigns: {
      vitals,
      measuredAt: vitals?.createdAt ?? null,
      canEdit,
      ...vitalsState,
      notice: profile?.vitalsError ?? vitalsNotice,
      onEdit: () => {
        setVitalsNotice(null);
        setVitalsState({ ...IDLE, isEditing: true });
      },
      onCancel: () => setVitalsState(IDLE),
      onSave: saveVitalSigns,
    },
  };
}
