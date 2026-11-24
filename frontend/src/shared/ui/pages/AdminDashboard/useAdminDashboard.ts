import { useEffect, useState } from 'react';

import { createDoctor, getDoctorMetrics, listDoctors, runDoctorAction } from '@/shared/api/doctors';
import type {
  DoctorAction,
  DoctorMetrics,
  DoctorRecord,
  DoctorsPage,
} from '@/shared/api/doctors.types';
import type { AddDoctorFormValues } from '@/shared/ui/components/AddDoctorForm/AddDoctorForm';
import {
  ACTION_CONFIRMATIONS,
  ACTION_NOTICES,
  DOCTOR_ADDED_NOTICE,
  INITIAL_FILTERS,
  MIN_SEARCH_LENGTH,
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from './AdminDashboard.constants';
import type { AdminDashboardProps, DoctorFilters } from './AdminDashboard.types';
import { getErrorMessage, toDoctorInput } from './AdminDashboard.utils';

interface Loaded<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export function useAdminDashboard(): AdminDashboardProps {
  const [filters, setFilters] = useState<DoctorFilters>(INITIAL_FILTERS);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [doctorsPage, setDoctorsPage] = useState<Loaded<DoctorsPage> | null>(null);
  const [metrics, setMetrics] = useState<DoctorMetrics | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDoctorId, setPendingDoctorId] = useState<string | null>(null);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [addDoctorError, setAddDoctorError] = useState<string | null>(null);

  const { page, status, role } = filters;
  const query = search.length >= MIN_SEARCH_LENGTH ? search : undefined;
  const requestKey = [page, status, role, query, refreshKey].join('|');

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(filters.search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    const controller = new AbortController();
    const key = [page, status, role, query, refreshKey].join('|');

    listDoctors({
      page,
      pageSize: PAGE_SIZE,
      status: status === 'all' ? undefined : status,
      role: role === 'all' ? undefined : role,
      search: query,
      signal: controller.signal,
    })
      .then((data) => setDoctorsPage({ key, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDoctorsPage((previous) => ({
          key,
          data: previous?.data ?? null,
          error: getErrorMessage(error),
        }));
      });

    return () => controller.abort();
  }, [page, status, role, query, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    getDoctorMetrics(controller.signal)
      .then(setMetrics)
      .catch(() => {
        if (!controller.signal.aborted) setMetrics(null);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);

  const changeFilters = (patch: Partial<DoctorFilters>) => {
    setNotice(null);
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  };

  const handleAddDoctor = async (values: AddDoctorFormValues) => {
    setIsAddingDoctor(true);
    setAddDoctorError(null);
    try {
      await createDoctor(toDoctorInput(values));
      setIsAddDoctorOpen(false);
      setNotice(DOCTOR_ADDED_NOTICE);
      refresh();
    } catch (error) {
      setAddDoctorError(getErrorMessage(error));
    } finally {
      setIsAddingDoctor(false);
    }
  };

  const handleDoctorAction = async (doctor: DoctorRecord, action: DoctorAction) => {
    const confirmation = ACTION_CONFIRMATIONS[action]?.(doctor);
    if (confirmation && !window.confirm(confirmation)) return;

    setPendingDoctorId(doctor.id);
    setActionError(null);
    setNotice(null);
    try {
      await runDoctorAction(doctor.id, action);
      setNotice(ACTION_NOTICES[action](doctor));
      refresh();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingDoctorId(null);
    }
  };

  return {
    metrics,
    doctors: doctorsPage?.data?.items ?? [],
    filters,
    totalPages: doctorsPage?.data?.meta.totalPages ?? 1,
    totalItems: doctorsPage?.data?.meta.totalItems ?? 0,
    pendingDoctorId,
    isLoading: doctorsPage?.key !== requestKey,
    error: actionError ?? doctorsPage?.error ?? null,
    notice,
    isAddDoctorOpen,
    isAddingDoctor,
    addDoctorError,
    onRetry: () => {
      setActionError(null);
      refresh();
    },
    onFiltersChange: changeFilters,
    onAddDoctorOpen: () => {
      setAddDoctorError(null);
      setIsAddDoctorOpen(true);
    },
    onAddDoctorCancel: () => setIsAddDoctorOpen(false),
    onAddDoctorSubmit: handleAddDoctor,
    onDoctorAction: handleDoctorAction,
  };
}
