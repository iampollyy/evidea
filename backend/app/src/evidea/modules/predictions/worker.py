import threading
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.orm import Session, sessionmaker

from evidea.core.logging import get_logger
from evidea.modules.audit.service import record_event
from evidea.modules.predictions.inference import Candidate, InferenceModel, ScoredDisease
from evidea.modules.predictions.models import (
    DiseaseHypothesis,
    PredictionExplanation,
    PredictionRun,
)
from evidea.modules.predictions.repository import PredictionRepository

log = get_logger("evidea.worker")

UNSUPPORTED_MESSAGE = "The active model does not support this input."
FAILED_MESSAGE = "The model failed to process this case."
STUCK_MESSAGE = "Processing did not finish in time."


def utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class ClaimedRun:
    id: UUID
    case_id: UUID
    snapshot: dict[str, Any]
    candidates: list[Candidate]


class PredictionWorker:
    def __init__(
        self,
        session_factory: sessionmaker[Session],
        model: InferenceModel,
        *,
        clock: Callable[[], datetime] = utcnow,
        stuck_after: timedelta = timedelta(minutes=10),
    ) -> None:
        self.session_factory = session_factory
        self.model = model
        self.clock = clock
        self.stuck_after = stuck_after

    def process_next(self) -> bool:
        claimed = self._claim()
        if claimed is None:
            return False
        if isinstance(claimed, UUID):
            return True
        try:
            results = self.model.predict(claimed.snapshot, claimed.candidates)
        except Exception:
            log.exception("prediction_failed", run_id=str(claimed.id))
            self._finish(claimed, status="failed", error=FAILED_MESSAGE)
            return True
        self._finish(claimed, status="completed", results=results)
        return True

    def process_all(self) -> int:
        processed = 0
        while self.process_next():
            processed += 1
        return processed

    def fail_stuck_runs(self) -> int:
        with self.session_factory() as session:
            runs = PredictionRepository(session).stuck_runs(
                started_before=self.clock() - self.stuck_after
            )
            for run in runs:
                run.status = "failed"
                run.error_message = STUCK_MESSAGE
                record_event(
                    session,
                    "prediction.timed_out",
                    case_id=run.case_id,
                    level="ERROR",
                    error_code="RUN_TIMEOUT",
                )
                log.warning("prediction_timed_out", run_id=str(run.id))
            session.commit()
            return len(runs)

    def run_forever(self, *, poll_interval: float, stop: threading.Event) -> None:
        log.info("worker_started", poll_interval=poll_interval)
        while not stop.is_set():
            try:
                self.fail_stuck_runs()
                if not self.process_next():
                    stop.wait(poll_interval)
            except Exception:
                log.exception("worker_iteration_failed")
                stop.wait(poll_interval)
        log.info("worker_stopped")

    def _claim(self) -> ClaimedRun | UUID | None:
        with self.session_factory() as session:
            repo = PredictionRepository(session)
            run = repo.claim_next_pending()
            if run is None:
                return None
            snapshot = dict(run.input_snapshot or {})
            candidates = [
                Candidate(disease_id=d.id, orpha_code=d.orpha_code, name=d.name)
                for d in repo.active_diseases()
            ]
            if not candidates or not self.model.supports(snapshot):
                run.status = "unsupported"
                run.error_message = UNSUPPORTED_MESSAGE
                record_event(
                    session,
                    "prediction.unsupported",
                    case_id=run.case_id,
                    level="WARN",
                    error_code="UNSUPPORTED",
                )
                session.commit()
                log.info("prediction_unsupported", run_id=str(run.id))
                return run.id
            run.status = "processing"
            session.commit()
            log.info("prediction_started", run_id=str(run.id))
            return ClaimedRun(run.id, run.case_id, snapshot, candidates)

    def _finish(
        self,
        claimed: ClaimedRun,
        *,
        status: str,
        results: list[ScoredDisease] | None = None,
        error: str | None = None,
    ) -> None:
        with self.session_factory() as session:
            run = session.get_one(PredictionRun, claimed.id, with_for_update=True)
            for rank, result in enumerate(results or [], start=1):
                hypothesis = DiseaseHypothesis(
                    id=uuid4(),
                    prediction_run_id=run.id,
                    disease_id=result.disease_id,
                    rank=rank,
                    score=Decimal(str(result.score)),
                )
                session.add(hypothesis)
                session.add_all(
                    PredictionExplanation(
                        hypothesis_id=hypothesis.id,
                        method=explanation.method,
                        data=explanation.data,
                        summary=explanation.summary,
                    )
                    for explanation in result.explanations
                )
            session.flush()
            run.status = status
            run.error_message = error
            record_event(
                session,
                f"prediction.{status}",
                case_id=run.case_id,
                level="INFO" if status == "completed" else "ERROR",
                error_code=None if status == "completed" else "MODEL_ERROR",
            )
            session.commit()
            log.info(f"prediction_{status}", run_id=str(run.id), hypotheses=len(results or []))
