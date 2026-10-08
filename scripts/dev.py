#!/usr/bin/env python3
"""SwitchOn - Development Environment Launcher.

Runs the complete local development environment:
1. Starts / ensures infra services via Docker Compose (postgres, redis, temporal).
2. Spawns Python backend services (order_api, mocks, worker).
3. Spawns Next.js frontend dev server (web).
4. Handles graceful termination (SIGINT / SIGTERM) across all spawned processes.
"""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import NamedTuple, NoReturn

REPO_ROOT = Path(__file__).resolve().parent.parent

# Color codes for clean output formatting
BLUE = "\033[34m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
MAGENTA = "\033[35m"
RESET = "\033[0m"
BOLD = "\033[1m"


class ServiceConfig(NamedTuple):
    name: str
    color: str
    cmd: list[str]
    env: dict[str, str]


def log(prefix: str, color: str, message: str) -> None:
    print(f"{color}{BOLD}[{prefix}]{RESET} {message}", flush=True)


def check_docker() -> bool:
    """Check if Docker is running and accessible."""
    try:
        res = subprocess.run(
            ["docker", "info"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return res.returncode == 0
    except FileNotFoundError:
        return False


def start_infra_containers() -> None:
    """Start base infrastructure containers if docker is present."""
    if not check_docker():
        log(
            "WARN",
            YELLOW,
            "Docker is not running or not found. Skipping infra containers start.",
        )
        return

    infra_services = ["postgres", "redis", "temporal"]
    log("DOCKER", CYAN, f"Ensuring infrastructure containers are running: {', '.join(infra_services)}...")
    try:
        subprocess.run(
            ["docker", "compose", "up", "-d", *infra_services],
            cwd=REPO_ROOT,
            check=False,
        )
    except Exception as exc:
        log("WARN", YELLOW, f"Could not start docker compose services: {exc}")


def main() -> NoReturn:
    os.chdir(REPO_ROOT)
    start_infra_containers()

    services: list[ServiceConfig] = [
        # Order API gateway
        ServiceConfig(
            name="order-api",
            color=GREEN,
            cmd=[
                sys.executable,
                "-m",
                "uvicorn",
                "services.order_api.main:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8000",
                "--reload",
            ],
            env={
                **dict(os.environ),
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
                "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
                "TEMPORAL_HOST": os.getenv("TEMPORAL_HOST", "localhost:7233"),
                "DEMO_MODE": "true",
            },
        ),
        # Mock OMS
        ServiceConfig(
            name="mock-oms",
            color=MAGENTA,
            cmd=[
                sys.executable,
                "-m",
                "uvicorn",
                "services.mocks.app:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8101",
            ],
            env={
                **dict(os.environ),
                "SYSTEM": "oms",
                "PORT": "8101",
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
                "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            },
        ),
        # Mock Inventory
        ServiceConfig(
            name="mock-inventory",
            color=MAGENTA,
            cmd=[
                sys.executable,
                "-m",
                "uvicorn",
                "services.mocks.app:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8102",
            ],
            env={
                **dict(os.environ),
                "SYSTEM": "inventory",
                "PORT": "8102",
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
            },
        ),
        # Mock Network
        ServiceConfig(
            name="mock-network",
            color=MAGENTA,
            cmd=[
                sys.executable,
                "-m",
                "uvicorn",
                "services.mocks.app:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8103",
            ],
            env={
                **dict(os.environ),
                "SYSTEM": "network",
                "PORT": "8103",
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
            },
        ),
        # Mock Billing
        ServiceConfig(
            name="mock-billing",
            color=MAGENTA,
            cmd=[
                sys.executable,
                "-m",
                "uvicorn",
                "services.mocks.app:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8104",
            ],
            env={
                **dict(os.environ),
                "SYSTEM": "billing",
                "PORT": "8104",
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
            },
        ),
        # Mock Notification
        ServiceConfig(
            name="mock-notification",
            color=MAGENTA,
            cmd=[
                sys.executable,
                "-m",
                "uvicorn",
                "services.mocks.app:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8105",
            ],
            env={
                **dict(os.environ),
                "SYSTEM": "notification",
                "PORT": "8105",
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
                "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            },
        ),
        # Orchestrator Worker
        ServiceConfig(
            name="worker",
            color=CYAN,
            cmd=[sys.executable, "-m", "services.orchestrator.worker"],
            env={
                **dict(os.environ),
                "PYTHONPATH": ".",
                "DATABASE_URL": os.getenv(
                    "DATABASE_URL",
                    "postgresql+asyncpg://postgres:postgres@localhost:5432/switchon",
                ),
                "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
                "TEMPORAL_HOST": os.getenv("TEMPORAL_HOST", "localhost:7233"),
                "OMS_MOCK_URL": "http://localhost:8101",
                "INVENTORY_MOCK_URL": "http://localhost:8102",
                "NETWORK_MOCK_URL": "http://localhost:8103",
                "BILLING_MOCK_URL": "http://localhost:8104",
                "NOTIFICATION_MOCK_URL": "http://localhost:8105",
                "DEMO_MODE": "true",
            },
        ),
        # Next.js Operator Console (web)
        ServiceConfig(
            name="web",
            color=BLUE,
            cmd=["npm", "run", "dev", "--prefix", "web"],
            env={
                **dict(os.environ),
                "NEXT_PUBLIC_API_URL": os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000"),
                "NEXT_PUBLIC_TEMPORAL_UI_URL": os.getenv(
                    "NEXT_PUBLIC_TEMPORAL_UI_URL", "http://localhost:8233"
                ),
            },
        ),
    ]

    procs: list[tuple[str, str, subprocess.Popen[bytes]]] = []

    def shutdown(signum: int | None = None, frame: object = None) -> None:
        log("SYSTEM", YELLOW, "Shutting down development servers...")
        for name, color, p in procs:
            if p.poll() is None:
                log(name, color, "Stopping...")
                try:
                    if hasattr(os, "killpg") and hasattr(os, "getpgid"):
                        os.killpg(os.getpgid(p.pid), signal.SIGTERM)
                    else:
                        p.terminate()
                except (ProcessLookupError, OSError):
                    pass

        # Wait briefly for graceful shutdown, then kill if needed
        time.sleep(1)
        for _name, _color, p in procs:
            if p.poll() is None:
                try:
                    if hasattr(os, "killpg") and hasattr(os, "getpgid"):
                        os.killpg(os.getpgid(p.pid), signal.SIGKILL)
                    else:
                        p.kill()
                except (ProcessLookupError, OSError):
                    pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    log("SWITCHON", GREEN, "Starting all development servers (Backend Python scripts + Next.js web)...")

    for svc in services:
        log(svc.name, svc.color, f"Starting ({' '.join(svc.cmd)})...")
        p = subprocess.Popen(
            svc.cmd,
            env=svc.env,
            cwd=REPO_ROOT,
            preexec_fn=os.setsid if hasattr(os, "setsid") else None,
            shell=sys.platform == "win32" and svc.name == "web",
        )
        procs.append((svc.name, svc.color, p))

    # Monitor processes
    exited_services: set[str] = set()
    try:
        while True:
            for name, color, p in procs:
                ret = p.poll()
                if ret is not None and name not in exited_services:
                    exited_services.add(name)
                    log(name, color, f"Process exited with code {ret}")
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

    sys.exit(0)


if __name__ == "__main__":
    main()
