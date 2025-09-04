from __future__ import annotations

from typing import Any, Dict, Optional

from flask import Blueprint, jsonify, request
from sqlalchemy import asc, desc, func, select

from db import session_scope
from models import Stock


sql_bp = Blueprint("sql", __name__, url_prefix="/api/sql")


def to_dict(stock: Stock) -> Dict[str, Any]:
    return {
        "id": stock.id,
        "date": stock.date,
        "trade_code": stock.trade_code,
        "high": stock.high,
        "low": stock.low,
        "open": stock.open,
        "close": stock.close,
        "volume": stock.volume,
    }


def parse_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        s = str(val).replace(",", "").strip()
        if s == "":
            return None
        return float(s)
    except Exception:
        return None


def parse_int(val: Any) -> Optional[int]:
    f = parse_float(val)
    return int(f) if f is not None else None


@sql_bp.get("/stocks")
def list_stocks():
    trade_code = request.args.get("trade_code")
    q = request.args.get("q")  # partial match on trade_code
    page = max(int(request.args.get("page", 1) or 1), 1)
    page_size = int(request.args.get("page_size", 50) or 50)
    page_size = max(1, min(page_size, 500))
    sort = request.args.get("sort", "date")  # e.g. "date" or "-date"

    sort_dir = asc
    field = sort
    if sort.startswith("-"):
        sort_dir = desc
        field = sort[1:]

    # Map allowed fields
    sort_map = {
        "id": Stock.id,
        "date": Stock.date,
        "trade_code": Stock.trade_code,
        "high": Stock.high,
        "low": Stock.low,
        "open": Stock.open,
        "close": Stock.close,
        "volume": Stock.volume,
    }
    sort_col = sort_map.get(field, Stock.date)

    with session_scope() as s:
        stmt = select(Stock)
        if trade_code:
            stmt = stmt.where(Stock.trade_code == trade_code)
        if q:
            qv = f"%{q.lower()}%"
            stmt = stmt.where(func.lower(Stock.trade_code).like(qv))

        total = s.scalar(select(func.count()).select_from(stmt.subquery())) or 0

        stmt = (
            stmt.order_by(sort_dir(sort_col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = s.execute(stmt).scalars().all()
        items = [to_dict(r) for r in rows]
        return jsonify(
            {
                "items": items,
                "page": page,
                "page_size": page_size,
                "total": total,
                "sort": sort,
                "trade_code": trade_code,
                "q": q,
            }
        )


@sql_bp.get("/stocks/<int:item_id>")
def get_stock(item_id: int):
    with session_scope() as s:
        obj = s.get(Stock, item_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404
        return jsonify(to_dict(obj))


@sql_bp.post("/stocks")
def create_stock():
    body = request.get_json(silent=True) or {}
    st = Stock(
        date=str(body.get("date", "")),
        trade_code=str(body.get("trade_code", "")),
        high=parse_float(body.get("high")),
        low=parse_float(body.get("low")),
        open=parse_float(body.get("open")),
        close=parse_float(body.get("close")),
        volume=parse_int(body.get("volume")),
    )
    with session_scope() as s:
        s.add(st)
        s.flush()  # populate st.id
        return jsonify(to_dict(st)), 201


@sql_bp.put("/stocks/<int:item_id>")
def update_stock(item_id: int):
    body = request.get_json(silent=True) or {}
    with session_scope() as s:
        obj = s.get(Stock, item_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404
        # Apply partial updates
        if "date" in body:
            obj.date = str(body.get("date") or "")
        if "trade_code" in body:
            obj.trade_code = str(body.get("trade_code") or "")
        if "high" in body:
            obj.high = parse_float(body.get("high"))
        if "low" in body:
            obj.low = parse_float(body.get("low"))
        if "open" in body:
            obj.open = parse_float(body.get("open"))
        if "close" in body:
            obj.close = parse_float(body.get("close"))
        if "volume" in body:
            obj.volume = parse_int(body.get("volume"))
        s.flush()
        return jsonify(to_dict(obj))


@sql_bp.delete("/stocks/<int:item_id>")
def delete_stock(item_id: int):
    with session_scope() as s:
        obj = s.get(Stock, item_id)
        if not obj:
            return jsonify({"error": "Not found"}), 404
        s.delete(obj)
        return ("", 204)
