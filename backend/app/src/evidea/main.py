from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from importlib import import_module

from fastapi import FastAPI

from evidea import __version__
from evidea.adapters.email import SmtpEmailSender
from evidea.adapters.storage import LocalFileStorage
from evidea.core.config import Settings, get_settings
from evidea.core.db import create_db_engine, create_session_factory
from evidea.core.errors import register_error_handlers
from evidea.core.logging import configure_logging
from evidea.core.middleware import OriginCheckMiddleware, RequestContextMiddleware
from evidea.core.openapi import ContractFastAPI, load_contract
from evidea.modules.auth.rate_limit import LoginRateLimiter
from evidea.modules.auth.router import auth_router, me_router
from evidea.modules.cases.router import router as cases_router
from evidea.modules.catalog.router import router as catalog_router
from evidea.modules.doctors.router import router as doctors_router
from evidea.modules.health.router import router as health_router
from evidea.modules.patients.router import router as patients_router
from evidea.modules.predictions.router import router as predictions_router

API_PREFIX = "/api/v1"

import_module("evidea.models")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = create_db_engine(
            settings.database_app_url,
            connect_timeout_seconds=settings.db_connect_timeout_seconds,
        )
        app.state.session_factory = create_session_factory(engine)
        yield
        engine.dispose()

    app = ContractFastAPI(
        title="EVIDEA API",
        version=__version__,
        openapi_url=f"{API_PREFIX}/openapi.json",
        docs_url=f"{API_PREFIX}/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.storage = LocalFileStorage(settings.storage_dir)
    app.state.email_sender = SmtpEmailSender(settings)
    app.state.login_limiter = LoginRateLimiter(
        max_attempts=settings.login_max_attempts, window_seconds=settings.login_window_seconds
    )

    register_error_handlers(app)
    app.add_middleware(OriginCheckMiddleware, allowed_origins=settings.allowed_origins)
    app.add_middleware(RequestContextMiddleware)

    for router in (
        auth_router,
        me_router,
        doctors_router,
        patients_router,
        cases_router,
        catalog_router,
        predictions_router,
        health_router,
    ):
        app.include_router(router, prefix=API_PREFIX)
    app.contract_schema = load_contract(settings.openapi_spec_path, API_PREFIX)
    return app
