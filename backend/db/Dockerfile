FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /db

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY alembic.ini ./
COPY migrations ./migrations
COPY seeds ./seeds
COPY scripts ./scripts

RUN useradd --create-home --uid 10001 evidea
USER evidea

ENTRYPOINT ["python", "scripts/manage.py"]
CMD ["migrate"]
