import { Button } from '@/shared/ui/atoms/Button/Button';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { PatientBanner } from '@/shared/ui/components/PatientBanner/PatientBanner';
import { PatientProfileNav } from '@/shared/ui/components/PatientProfileNav/PatientProfileNav';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import { PersonalInfoForm } from '@/shared/ui/organisms/PersonalInfoForm/PersonalInfoForm';
import { VitalSignsForm } from '@/shared/ui/organisms/VitalSignsForm/VitalSignsForm';
import { PATIENT_PROFILE_TABS } from '@/constants/patientProfile.constants';
import type { PatientProfileProps, PatientProfileTab } from '@/shared/types/patientProfile.types';
import { isPlainLeftClick } from '@/utils/isPlainLeftClick';
import { getPatientProfileTabLabel } from '@/utils/patientProfile';
import styles from './PatientProfile.module.scss';

export function PatientProfile({
  activeTab,
  getTabHref,
  onTabNavigate,
  backHref,
  onBack,
  patient,
  isLoading = false,
  error,
  onRetry,
  personalInfo,
  vitalSigns,
}: PatientProfileProps) {
  const navItems = PATIENT_PROFILE_TABS.map((tab) => ({ ...tab, href: getTabHref(tab.id) }));

  return (
    <div className={styles.profile}>
      <a
        href={backHref}
        className={styles.back}
        onClick={(event) => {
          if (onBack && isPlainLeftClick(event)) onBack(event);
        }}
      >
        <Icon name="chevron_left" className={styles.backIcon} />
        Patients
      </a>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      {isLoading && !patient && (
        <p className={styles.status} role="status">
          Loading patient…
        </p>
      )}

      {patient && (
        <>
          <PatientBanner patient={patient} />

          <PatientProfileNav
            items={navItems}
            activeId={activeTab}
            onNavigate={
              onTabNavigate && ((item, event) => onTabNavigate(item.id as PatientProfileTab, event))
            }
          />

          {activeTab === 'overview' ? (
            <div className={styles.overview}>
              {personalInfo && <PersonalInfoForm {...personalInfo} />}
              <VitalSignsForm {...vitalSigns} />
            </div>
          ) : (
            <SectionCard title={getPatientProfileTabLabel(activeTab)}>
              <p className={styles.status}>This section is not available yet.</p>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
