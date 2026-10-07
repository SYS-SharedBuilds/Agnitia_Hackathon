FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY shared/ shared/
COPY services/mocks/ services/mocks/

ENV PORT=8101
ENV SYSTEM=oms

CMD ["sh", "-c", "uvicorn services.mocks.app:app --host 0.0.0.0 --port ${PORT}"]
