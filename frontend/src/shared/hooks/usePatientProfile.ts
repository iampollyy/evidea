import { useEffect, useState } from 'react';

import { getLatestVitalSigns } from '@/api/cases';
import { getPatient, replacePatient } from '@/api/patients';
import { IDLE_SECTION_STATE, VITALS_LOCAL_ONLY_NOTICE } from '@/constants/patientProfile.constants';
import type { VitalSignsValues } from '@/shared/types/cases.types';
import type { PersonalInfoValues } from '@/shared/types/forms.types';
import type {
  LoadedProfile,
  PatientProfileData,
  ProfileSectionState,
} from '@/shared/types/patientProfile.types';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { toBannerPatient, toPatientInput, toPersonalInfoValues } from '@/utils/mappers/patient';

export function usePatientProfile(patientId: string): PatientProfileData {
  const [refreshKey, setRefreshKey] = useState(0);
  const [profile, setProfile] = useState<LoadedProfile | null>(null);
  const [personalState, setPersonalState] = useState<ProfileSectionState>(IDLE_SECTION_STATE);
  const [vitalsState, setVitalsState] = useState<ProfileSectionState>(IDLE_SECTION_STATE);
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
      setPersonalState(IDLE_SECTION_STATE);
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
    setVitalsState(IDLE_SECTION_STATE);
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
      onEdit: () => setPersonalState({ ...IDLE_SECTION_STATE, isEditing: true }),
      onCancel: () => setPersonalState(IDLE_SECTION_STATE),
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
        setVitalsState({ ...IDLE_SECTION_STATE, isEditing: true });
      },
      onCancel: () => setVitalsState(IDLE_SECTION_STATE),
      onSave: saveVitalSigns,
    },
  };
}
