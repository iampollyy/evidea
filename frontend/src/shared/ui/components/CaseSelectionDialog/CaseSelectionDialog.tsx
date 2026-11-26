import { useId, useState } from 'react';

import { CLINICAL_CASE_COLUMNS } from '@/constants/clinicalCases.constants';
import type { ClinicalCaseOption } from '@/shared/types/clinicalCases.types';
import { Button } from '@/shared/ui/atoms/Button/Button';
import { ClinicalCaseRow } from '@/shared/ui/atoms/ClinicalCaseRow/ClinicalCaseRow';
import { Icon } from '@/shared/ui/atoms/Icon/Icon';
import { Modal } from '@/shared/ui/components/Modal/Modal';
import styles from './CaseSelectionDialog.module.scss';

export interface CaseSelectionDialogProps {
  cases: ClinicalCaseOption[];
  onSelect: (caseId: string) => void;
  onClose: () => void;
}

export function CaseSelectionDialog({ cases, onSelect, onClose }: CaseSelectionDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const radioName = useId();
  const selectedCase = cases.find((item) => item.id === selectedId);

  return (
    <Modal label="Select Clinical Case" onClose={onClose} className={styles.dialog}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <h2 className={styles.title}>Select Clinical Case</h2>
          <p className={styles.subtitle}>
            Choose a clinical case with available patient history and diagnostic data.
          </p>
        </div>
        <Button
          variant="ghost"
          className={styles.close}
          icon={<Icon name="close" />}
          aria-label="Close"
          onClick={onClose}
        />
      </header>

      <div className={styles.body}>
        <div className={styles.toolbar}>
          <p className={styles.listTitle}>
            Clinical Cases
            <span className={styles.count}>
              {cases.length} {cases.length === 1 ? 'case' : 'cases'} available
            </span>
          </p>
          <span className={styles.sort}>Sorted by last updated</span>
        </div>

        <div className={styles.tableFrame}>
          <div className={styles.table}>
            <div className={styles.heading}>
              <span />
              {CLINICAL_CASE_COLUMNS.map((column) => (
                <span key={column} className={styles.headingCell}>
                  {column}
                </span>
              ))}
            </div>
            {cases.length > 0 ? (
              <ul className={styles.list}>
                {cases.map(({ id, ...item }) => (
                  <ClinicalCaseRow
                    key={id}
                    {...item}
                    name={radioName}
                    checked={id === selectedId}
                    onSelect={() => setSelectedId(id)}
                  />
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>No clinical cases available yet.</p>
            )}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.hint} aria-live="polite">
          {selectedCase ? `${selectedCase.caseCode} selected` : 'Select one case to continue'}
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" className={styles.cancel} onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={styles.submit}
            disabled={!selectedId}
            onClick={() => selectedId && onSelect(selectedId)}
          >
            Select Clinical Case
            <Icon name="arrow_forward" className={styles.submitIcon} />
          </Button>
        </div>
      </footer>
    </Modal>
  );
}
