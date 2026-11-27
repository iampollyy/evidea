import { useState } from 'react';

import type {
  DiseaseHypothesis,
  EvidenceFactor,
  HypothesisExplanation as HypothesisExplanationData,
} from '@/shared/types/predictions.types';
import { HypothesisExplanation } from '@/shared/ui/organisms/HypothesisExplanation/HypothesisExplanation';
import { PredictionResults } from '@/shared/ui/organisms/PredictionResults/PredictionResults';

export interface PredictionReportProps {
  hypotheses: DiseaseHypothesis[];
  explanations: Record<string, HypothesisExplanationData>;
  clinicalFactors: EvidenceFactor[];
  labFactors: EvidenceFactor[];
  className?: string;
}

export function PredictionReport({
  hypotheses,
  explanations,
  clinicalFactors,
  labFactors,
  className,
}: PredictionReportProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = hypotheses.find((hypothesis) => hypothesis.id === selectedId);
  const explanation = selected && explanations[selected.id];

  if (selected && explanation) {
    return (
      <HypothesisExplanation
        hypothesis={selected}
        explanation={explanation}
        onBack={() => setSelectedId(null)}
        className={className}
      />
    );
  }

  return (
    <PredictionResults
      hypotheses={hypotheses}
      clinicalFactors={clinicalFactors}
      labFactors={labFactors}
      onExplain={setSelectedId}
      className={className}
    />
  );
}
