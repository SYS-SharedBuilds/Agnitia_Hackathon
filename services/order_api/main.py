from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from services.order_api.routes import catalog, demo, metrics, orders, stream
from shared.logging import configure_logging, get_logger

configure_logging()
logger = get_logger("order_api")

app = FastAPI(
    title="SwitchOn - Order API Gateway",
    version="1.0.0",
    description="Durable telecom service activation orchestrator control plane gateway.",
)


# Defensive security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next: Any) -> Response:
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# CORS middleware for Next.js console
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(orders.router)
app.include_router(stream.router)
app.include_router(metrics.router)
app.include_router(catalog.router)
app.include_router(demo.router)

# Prometheus metrics mount
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "order_api"}
