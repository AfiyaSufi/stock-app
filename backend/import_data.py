from __future__ import annotations

import json
import os
from typing import Any, Dict, List

from sqlalchemy import delete

from db import DB_PATH, engine, session_scope
from models import Base, Stock


def parse_number(val: Any) -> float | None:
    if val is None:
        return None
    try:
        s = str(val).replace(",", "").strip()
        if s == "" or s.lower() == "null":
            return None
        return float(s)
    except Exception:
        return None


def parse_int(val: Any) -> int | None:
    f = parse_number(val)
    return int(f) if f is not None else None


def import_json(json_path: str) -> int:
    with open(json_path, "r", encoding="utf-8") as f:
        data: List[Dict[str, Any]] = json.load(f)

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Replace all rows for a clean import
    with session_scope() as s:
        s.execute(delete(Stock))
        rows = []
        for r in data:
            row = Stock(
                date=str(r.get("date", "")),
                trade_code=str(r.get("trade_code", "")),
                high=parse_number(r.get("high")),
                low=parse_number(r.get("low")),
                open=parse_number(r.get("open")),
                close=parse_number(r.get("close")),
                volume=parse_int(r.get("volume")),
            )
            rows.append(row)
        s.add_all(rows)
        return len(rows)


if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    json_path = os.path.join(project_root, "stock_market_data.json")
    if not os.path.exists(json_path):
        raise SystemExit(f"JSON not found at {json_path}")
    count = import_json(json_path)
    print(f"Imported {count} rows into SQLite at {DB_PATH}")
