import { Badge } from '@/ui/atoms/Badge/Badge';
import { Button } from '@/ui/atoms/Button/Button';
import { Dropdown } from '@/ui/atoms/Dropdown/Dropdown';
import { Icon } from '@/ui/atoms/Icon/Icon';
import { AddDoctorForm } from '@/ui/components/AddDoctorForm/AddDoctorForm';
import { SearchField } from '@/ui/components/SearchField/SearchField';
import { DoctorsTable } from '@/ui/organisms/DoctorsTable/DoctorsTable';
import {
  MIN_SEARCH_LENGTH,
  ROLE_FILTER_OPTIONS,
  SEARCH_MAX_LENGTH,
  STATUS_TABS,
} from '@/constants/adminDashboard.constants';
import type { AdminDashboardProps } from '@/types/adminDashboard.types';
import type { PageControl } from '@/types/common.types';
import styles from './AdminDashboard.module.scss';

export function AdminDashboard({
  metrics,
  doctors,
  filters,
  totalPages,
  totalItems,
  pendingDoctorId,
  isLoading = false,
  error,
  notice,
  isAddDoctorOpen = false,
  isAddingDoctor = false,
  addDoctorError,
  onRetry,
  onFiltersChange,
  onAddDoctorOpen,
  onAddDoctorCancel,
  onAddDoctorSubmit,
  onDoctorAction,
}: AdminDashboardProps) {
  const searchLength = filters.search.trim().length;
  const pageControls: PageControl[] = [
    { label: 'Previous', targetPage: filters.page - 1, disabled: filters.page <= 1 },
    { label: 'Next', targetPage: filters.page + 1, disabled: filters.page >= totalPages },
  ];

  return (
    <>
      <div className={styles.pageHeading}>
        <div className={styles.headingCopy}>
          <h1 className={styles.title}>Doctors</h1>
          <p className={styles.subtitle}>Manage your medical team and their access to Evidea.</p>
        </div>
        <Button icon={<Icon name="person_add" />} onClick={onAddDoctorOpen}>
          Add Doctor
        </Button>
      </div>

      <section className={styles.directory} aria-labelledby="directory-title">
        <div className={styles.directoryHeading}>
          <div className={styles.directoryTitleGroup}>
            <h2 id="directory-title" className={styles.directoryTitle}>
              Doctor directory
            </h2>
            <span className={styles.totalCount}>{totalItems} doctors</span>
          </div>
          <div className={styles.directoryTools}>
            <SearchField
              className={styles.search}
              label="Search doctors"
              placeholder="Search doctors"
              shortcutKey={null}
              maxLength={SEARCH_MAX_LENGTH}
              value={filters.search}
              onChange={(event) => onFiltersChange?.({ search: event.currentTarget.value })}
            />
            <Dropdown
              className={styles.roleFilter}
              label="Filter by role"
              hideLabel
              size="sm"
              value={filters.role}
              options={ROLE_FILTER_OPTIONS}
              onChange={(value) => {
                const option = ROLE_FILTER_OPTIONS.find((item) => item.value === value);
                if (option) onFiltersChange?.({ role: option.value });
              }}
            />
          </div>
        </div>

        <div className={styles.tabs} role="group" aria-label="Filter doctors by status">
          {STATUS_TABS.map((tab) => {
            const isSelected = filters.status === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isSelected}
                className={isSelected ? `${styles.tab} ${styles.selectedTab}` : styles.tab}
                onClick={() => onFiltersChange?.({ status: tab.value })}
              >
                {tab.label}
                <Badge variant={isSelected ? 'brand' : 'neutral'} size="sm" pill>
                  {metrics?.[tab.value] ?? '—'}
                </Badge>
              </button>
            );
          })}
        </div>

        {searchLength > 0 && searchLength < MIN_SEARCH_LENGTH && (
          <p className={styles.searchHint}>
            Enter at least {MIN_SEARCH_LENGTH} characters to search.
          </p>
        )}
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

        <div aria-busy={isLoading}>
          {isLoading && (
            <p className={styles.loading} role="status">
              Loading doctors…
            </p>
          )}
          <DoctorsTable
            doctors={doctors}
            pendingDoctorId={pendingDoctorId}
            onAction={onDoctorAction}
          />
        </div>

        <div className={styles.pagination}>
          <span>
            {totalItems === 0 ? 'No doctors' : `Page ${filters.page} of ${Math.max(totalPages, 1)}`}
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
      </section>

      {isAddDoctorOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Add doctor">
            <AddDoctorForm
              onSubmit={(values) => onAddDoctorSubmit?.(values)}
              onCancel={onAddDoctorCancel}
              isSubmitting={isAddingDoctor}
              submitError={addDoctorError}
            />
          </div>
        </div>
      )}
    </>
  );
}
