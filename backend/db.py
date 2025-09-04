from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


DB_PATH = os.getenv("STOCK_APP_DB", os.path.join(os.path.dirname(__file__), "stock.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

# For SQLite, check_same_thread=False when sharing across threads (e.g., dev server)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@contextmanager
def session_scope() -> Iterator:
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
