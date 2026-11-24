import { Badge } from '@/shared/ui/atoms/Badge/Badge';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { Filter } from '@/shared/ui/atoms/Filter/Filter';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { LayoutOptions } from '@/shared/ui/atoms/LayoutOptions/LayoutOptions';
import { AddPatientForm } from '@/shared/ui/components/AddPatientForm/AddPatientForm';
import { Modal } from '@/shared/ui/components/Modal/Modal';
import { PatientsGrid } from '@/shared/ui/components/PatientsGrid/PatientsGrid';
import { SearchField } from '@/shared/ui/components/SearchField/SearchField';
import {
  INITIAL_FILTERS,
  LAYOUT_TITLES,
  MIN_SEARCH_LENGTH,
  SEARCH_MAX_LENGTH,
  STATUS_FILTER_OPTIONS,
} from '@/constants/doctorDashboard.constants';
import type { PageControl } from '@/shared/types/common.types';
import type { DoctorDashboardProps } from '@/shared/types/doctorDashboard.types';
import styles from './DoctorDashboard.module.scss';

export function DoctorDashboard({
  patients,
  filters,
  layout,
  totalPages,
  totalItems,
  isLoading = false,
  error,
  notice,
  isAddPatientOpen = false,
  isAddingPatient = false,
  addPatientError,
  onRetry,
  onFiltersChange,
  onLayoutChange,
  onAddPatientOpen,
  onAddPatientCancel,
  onAddPatientSubmit,
  getPatientHref,
  onPatientOpen,
}: DoctorDashboardProps) {
  const searchLength = filters.search.trim().length;
  const isEmpty = !isLoading && !error && patients.length === 0;
  const pageControls: PageControl[] = [
    { label: 'Previous', targetPage: filters.page - 1, disabled: filters.page <= 1 },
    { label: 'Next', targetPage: filters.page + 1, disabled: filters.page >= totalPages },
  ];

  return (
    <>
      <div className={styles.heading}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{LAYOUT_TITLES[layout]}</h1>
          <Badge variant="brand">Total Patients : {totalItems}</Badge>
        </div>
        <div className={styles.actions}>
          <Filter
            label="Filter"
            menuLabel="Filter patients by status"
            options={STATUS_FILTER_OPTIONS}
            value={filters.status}
            applied={filters.status !== INITIAL_FILTERS.status}
            onChange={(status) => onFiltersChange?.({ status })}
          />
          <LayoutOptions label="Patients layout" value={layout} onChange={onLayoutChange} />
          <Button icon={<Icon name="add" />} onClick={onAddPatientOpen}>
            New Patient
          </Button>
        </div>
      </div>

      <div role="search">
        <SearchField
          label="Search patients"
          placeholder="Search"
          maxLength={SEARCH_MAX_LENGTH}
          value={filters.search}
          onChange={(event) => onFiltersChange?.({ search: event.currentTarget.value })}
        />
        {searchLength > 0 && searchLength < MIN_SEARCH_LENGTH && (
          <p className={styles.hint}>Enter at least {MIN_SEARCH_LENGTH} characters to search.</p>
        )}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <div className={styles.results} aria-busy={isLoading}>
        {isLoading && (
          <p className={styles.hint} role="status">
            Loading patients…
          </p>
        )}
        {isEmpty ? (
          <p className={styles.empty}>
            {searchLength >= MIN_SEARCH_LENGTH
              ? `No patients match “${filters.search.trim()}”.`
              : 'No patients yet.'}
          </p>
        ) : (
          <PatientsGrid
            patients={patients}
            layout={layout}
            aria-label="Patients"
            getPatientHref={getPatientHref}
            onPatientNavigate={onPatientOpen}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span>
            Page {filters.page} of {totalPages}
          </span>
          <div className={styles.paginationActions}>
            {pageControls.map((control) => (
              <Button
                key={control.label}
                variant="secondary"
                size="sm"
                disabled={control.disabled || isLoading}
                onClick={() => onFiltersChange?.({ page: control.targetPage })}
              >
                {control.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isAddPatientOpen && (
        <Modal label="Add patient" onClose={onAddPatientCancel} dismissible={!isAddingPatient}>
          <AddPatientForm
            onSubmit={(values) => onAddPatientSubmit?.(values)}
            onCancel={onAddPatientCancel}
            isSubmitting={isAddingPatient}
            submitError={addPatientError}
          />
        </Modal>
      )}
    </>
  );
}
