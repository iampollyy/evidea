import { useId, useState } from 'react';

import type { AnamnesisValues } from '@/shared/types/cases.types';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import { getAnamnesisBrief, getFilledAnamnesisFields } from '@/utils/caseReview';
import styles from './ClinicalHistoryCard.module.scss';

export interface ClinicalHistoryCardProps {
  anamnesis: AnamnesisValues | null;
}

export function ClinicalHistoryCard({ anamnesis }: ClinicalHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const brief = getAnamnesisBrief(anamnesis);
  const fields = getFilledAnamnesisFields(anamnesis);
  const isAvailable = Boolean(brief) || fields.length > 0;

  return (
    <SectionCard
      title="Clinical History"
      subtitle="Patient anamnesis and reported symptoms"
      icon="notes"
      actions={
        <span className={isAvailable ? styles.availability : styles.availabilityMissing}>
          <span className={styles.availabilityIcon}>
            <Icon name={isAvailable ? 'check' : 'remove'} />
          </span>
          {isAvailable ? 'Available' : 'Not available'}
        </span>
      }
    >
      {isAvailable ? (
        <>
          {brief && <p className={isExpanded ? styles.brief : styles.briefClamped}>“{brief}”</p>}
          {isExpanded && fields.length > 0 && (
            <dl id={detailsId} className={styles.details}>
              {fields.map(({ id, label }) => (
                <div key={id} className={styles.detail}>
                  <dt className={styles.detailLabel}>{label}</dt>
                  <dd className={styles.detailValue}>{anamnesis?.[id]}</dd>
                </div>
              ))}
            </dl>
          )}
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? 'Hide Full Clinical History' : 'View Full Clinical History'}
            <Icon
              name={isExpanded ? 'expand_less' : 'arrow_forward'}
              className={styles.toggleIcon}
            />
          </button>
        </>
      ) : (
        <p className={styles.empty}>No anamnesis recorded for this case.</p>
      )}
    </SectionCard>
  );
}
