import signal
import threading
from importlib import import_module
from types import FrameType

from evidea.core.config import get_settings
from evidea.core.db import create_db_engine, create_session_factory
from evidea.core.logging import configure_logging
from evidea.modules.predictions.inference import StubModel
from evidea.modules.predictions.worker import PredictionWorker

POLL_INTERVAL_SECONDS = 2.0

import_module("evidea.models")


def main() -> None:
    settings = get_settings()
    configure_logging(settings)
    engine = create_db_engine(
        settings.database_app_url, connect_timeout_seconds=settings.db_connect_timeout_seconds
    )
    worker = PredictionWorker(create_session_factory(engine), StubModel())
    stop = threading.Event()

    def request_stop(signum: int, frame: FrameType | None) -> None:
        stop.set()

    signal.signal(signal.SIGINT, request_stop)
    signal.signal(signal.SIGTERM, request_stop)
    try:
        worker.run_forever(poll_interval=POLL_INTERVAL_SECONDS, stop=stop)
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
