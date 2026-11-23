import threading
from typing import Any, cast

from sqlalchemy.orm import Session, sessionmaker

from evidea.modules.predictions.inference import StubModel
from evidea.modules.predictions.worker import PredictionWorker


class ScriptedWorker(PredictionWorker):
    def __init__(self, outcomes: list[Any], stop: threading.Event) -> None:
        super().__init__(cast(sessionmaker[Session], None), StubModel())
        self.outcomes = outcomes
        self.stop = stop
        self.calls: list[str] = []

    def fail_stuck_runs(self) -> int:
        self.calls.append("stuck")
        return 0

    def process_next(self) -> bool:
        self.calls.append("next")
        outcome = self.outcomes.pop(0)
        if not self.outcomes:
            self.stop.set()
        if isinstance(outcome, Exception):
            raise outcome
        return bool(outcome)


def test_loop_keeps_going_after_errors_and_stops_on_request() -> None:
    stop = threading.Event()
    worker = ScriptedWorker([True, RuntimeError("database hiccup"), False], stop)

    worker.run_forever(poll_interval=0.01, stop=stop)

    assert worker.calls == ["stuck", "next", "stuck", "next", "stuck", "next"]


def test_process_all_counts_processed_runs() -> None:
    stop = threading.Event()
    worker = ScriptedWorker([True, True, False], stop)
    assert worker.process_all() == 2
