import json
import sqlite3
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any


class MockStateStore:
    """Persistent SQLite store for mock systems state, idempotency replay, and tombstones.
    RULES §3.4: Every compensation writes a tombstone for the forward key; forward endpoints check tombstones.
    """

    def __init__(self, system_name: str, db_path: str | None = None) -> None:
        self.system_name = system_name
        self.db_path = db_path or f"/tmp/switchon_mock_{system_name}.sqlite"
        self._mem_conn: sqlite3.Connection | None = None
        if self.db_path == ":memory:":
            self._mem_conn = sqlite3.connect(":memory:", check_same_thread=False)
            self._mem_conn.row_factory = sqlite3.Row
        self._init_db()

    @contextmanager
    def _get_conn(self) -> Generator[sqlite3.Connection, None, None]:
        if self._mem_conn is not None:
            yield self._mem_conn
            return
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS idempotency (
                    key TEXT PRIMARY KEY,
                    response TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS tombstones (
                    forward_key TEXT PRIMARY KEY,
                    order_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS entities (
                    order_id TEXT PRIMARY KEY,
                    state TEXT NOT NULL,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()

    def is_tombstoned(self, forward_key: str) -> bool:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT forward_key FROM tombstones WHERE forward_key = ?", (forward_key,)
            ).fetchone()
            return bool(row is not None)

    def write_tombstone(self, forward_key: str, order_id: str | None = None) -> None:
        with self._get_conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO tombstones (forward_key, order_id) VALUES (?, ?)",
                (forward_key, order_id or ""),
            )
            conn.commit()

    def check_idempotency(self, key: str) -> tuple[int, dict[str, Any]] | None:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT status_code, response FROM idempotency WHERE key = ?", (key,)
            ).fetchone()
            if row:
                return row["status_code"], json.loads(row["response"])
        return None

    def record_idempotency(self, key: str, status_code: int, response: dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO idempotency (key, status_code, response) VALUES (?, ?, ?)",
                (key, status_code, json.dumps(response)),
            )
            conn.commit()

    def get_entity(self, order_id: str) -> dict[str, Any] | None:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT order_id, state, data FROM entities WHERE order_id = ?", (order_id,)
            ).fetchone()
            if row:
                return {
                    "order_id": row["order_id"],
                    "state": row["state"],
                    "data": json.loads(row["data"]),
                }
        return None

    def upsert_entity(self, order_id: str, state: str, data: dict[str, Any]) -> None:
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO entities (order_id, state, data, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(order_id) DO UPDATE SET
                    state = excluded.state,
                    data = excluded.data,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (order_id, state, json.dumps(data)),
            )
            conn.commit()

    def delete_entity(self, order_id: str) -> bool:
        with self._get_conn() as conn:
            cur = conn.execute("DELETE FROM entities WHERE order_id = ?", (order_id,))
            conn.commit()
            return cur.rowcount > 0

    def list_entities(self) -> list[dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute("SELECT order_id, state, data, updated_at FROM entities").fetchall()
            return [
                {
                    "order_id": r["order_id"],
                    "state": r["state"],
                    "data": json.loads(r["data"]),
                    "updated_at": r["updated_at"],
                }
                for r in rows
            ]

    def clear(self) -> None:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM idempotency")
            conn.execute("DELETE FROM tombstones")
            conn.execute("DELETE FROM entities")
            conn.commit()
