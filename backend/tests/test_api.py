import json
import os
import sys
from pathlib import Path

import pytest

# Ensure backend dir is on sys.path when running via `pytest -q` inside backend/
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # type: ignore


@pytest.fixture(scope="module")
def client():
    app = create_app()
    app.config.update(TESTING=True)
    with app.test_client() as c:
        yield c


def test_root_ok(client):
    res = client.get("/")
    assert res.status_code == 200
    assert b"Backend OK" in res.data


def test_health_ok(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data.get("status") == "ok"


def test_stocks_json_available(client):
    res = client.get("/api/stocks")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    # basic shape
    row = data[0]
    assert "date" in row and "trade_code" in row


def test_sql_list_smoke(client):
    res = client.get("/api/sql/stocks?page=1&page_size=5")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, dict)
    assert "items" in data and isinstance(data["items"], list)
