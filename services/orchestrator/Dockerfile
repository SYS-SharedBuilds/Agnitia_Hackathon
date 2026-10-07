FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY catalog/ catalog/
COPY shared/ shared/
COPY services/orchestrator/ services/orchestrator/

CMD ["python", "-m", "services.orchestrator.worker"]
