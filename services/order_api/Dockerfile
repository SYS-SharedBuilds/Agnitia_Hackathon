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
COPY scripts/ scripts/
COPY services/orchestrator/ services/orchestrator/
COPY services/order_api/ services/order_api/

EXPOSE 8000

CMD ["uvicorn", "services.order_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
