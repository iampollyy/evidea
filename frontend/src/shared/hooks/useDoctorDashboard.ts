import { useEffect, useState } from 'react';

import { createPatient, listPatients } from '@/api/patients';
import {
  INITIAL_FILTERS,
  MIN_SEARCH_LENGTH,
  PAGE_SIZE,
  PATIENT_ADDED_NOTICE,
} from '@/constants/doctorDashboard.constants';
import type { Loaded } from '@/types/common.types';
import type { DoctorDashboardProps, PatientFilters } from '@/types/doctorDashboard.types';
import type { AddPatientFormValues } from '@/types/forms.types';
import type { PatientsPage } from '@/types/patients.types';
import type { LayoutOption } from '@/ui/atoms/LayoutOptions/LayoutOptions';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { toGridPatient, toPatientInput } from '@/utils/mappers/patient';

export function useDoctorDashboard(): DoctorDashboardProps {
  const [filters, setFilters] = useState<PatientFilters>(INITIAL_FILTERS);
  const [layout, setLayout] = useState<LayoutOption>('grid');
  const [refreshKey, setRefreshKey] = useState(0);
  const [patientsPage, setPatientsPage] = useState<Loaded<PatientsPage> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [addPatientError, setAddPatientError] = useState<string | null>(null);

  const { page, status } = filters;
  const search = filters.search.trim();
  const query = search.length >= MIN_SEARCH_LENGTH ? search : undefined;
  const requestKey = [page, status, query, refreshKey].join('|');

  useEffect(() => {
    const controller = new AbortController();
    const key = [page, status, query, refreshKey].join('|');

    listPatients({
      page,
      pageSize: PAGE_SIZE,
      status,
      search: query,
      signal: controller.signal,
    })
      .then((data) => setPatientsPage({ key, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPatientsPage((previous) => ({
          key,
          data: previous?.data ?? null,
          error: getErrorMessage(error),
        }));
      });

    return () => controller.abort();
  }, [page, status, query, refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);

  const changeFilters = (patch: Partial<PatientFilters>) => {
    setNotice(null);
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  };

  const handleAddPatient = async (values: AddPatientFormValues) => {
    setIsAddingPatient(true);
    setAddPatientError(null);
    try {
      await createPatient(toPatientInput(values));
      setIsAddPatientOpen(false);
      setNotice(PATIENT_ADDED_NOTICE);
      setFilters(INITIAL_FILTERS);
      refresh();
    } catch (error) {
      setAddPatientError(getErrorMessage(error));
    } finally {
      setIsAddingPatient(false);
    }
  };

  return {
    patients: patientsPage?.data?.items.map(toGridPatient) ?? [],
    filters,
    layout,
    totalPages: patientsPage?.data?.meta.totalPages ?? 1,
    totalItems: patientsPage?.data?.meta.totalItems ?? 0,
    isLoading: patientsPage?.key !== requestKey,
    error: patientsPage?.key === requestKey ? patientsPage.error : null,
    notice,
    isAddPatientOpen,
    isAddingPatient,
    addPatientError,
    onRetry: refresh,
    onFiltersChange: changeFilters,
    onLayoutChange: setLayout,
    onAddPatientOpen: () => {
      setAddPatientError(null);
      setIsAddPatientOpen(true);
    },
    onAddPatientCancel: () => setIsAddPatientOpen(false),
    onAddPatientSubmit: handleAddPatient,
  };
}
