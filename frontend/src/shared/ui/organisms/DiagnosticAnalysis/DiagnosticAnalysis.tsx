import { useState } from 'react';

import type { ClinicalCaseOption } from '@/shared/types/clinicalCases.types';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { CaseSelectionDialog } from '@/shared/ui/components/CaseSelectionDialog/CaseSelectionDialog';
import { SectionCard } from '@/shared/ui/components/SectionCard/SectionCard';
import styles from './DiagnosticAnalysis.module.scss';

export interface DiagnosticAnalysisProps {
  cases: ClinicalCaseOption[];
  onCaseSelect?: (caseId: string) => void;
  className?: string;
}

export function DiagnosticAnalysis({ cases, onCaseSelect, className }: DiagnosticAnalysisProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = (caseId: string) => {
    setIsSelecting(false);
    onCaseSelect?.(caseId);
  };

  return (
    <SectionCard
      title="Diagnostic Analysis"
      subtitle="Free-text clinical documentation — enter observations in your own words"
      icon="description"
      className={className}
    >
      <div className={styles.empty}>
        <button
          type="button"
          className={styles.create}
          aria-label="Create diagnostic case"
          onClick={() => setIsSelecting(true)}
        >
          <Icon name="add" className={styles.createIcon} />
        </button>
        <h3 className={styles.title}>Create Diagnostic Case</h3>
        <p className={styles.description}>
          Select an existing clinical case to prepare patient data for AI-assisted analysis.
        </p>
        <p className={styles.note}>
          Patient history and diagnostic data will be retrieved automatically
        </p>
      </div>

      {isSelecting && (
        <CaseSelectionDialog
          cases={cases}
          onSelect={handleSelect}
          onClose={() => setIsSelecting(false)}
        />
      )}
    </SectionCard>
  );
}
