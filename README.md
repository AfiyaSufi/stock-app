# stock-app

React + Flask stock viewer. Phase 1 (jsonModel) reads from `stock_market_data.json` and exposes a table plus a combined line/bar chart. Phase 2 (sqlModel) will migrate to SQLite and add CRUD.

## Structure

```
stock-app/
├── backend/               # Flask API (JSON model now; SQLite later)
│   ├── app.py             # Flask entrypoint + routes
│   ├── config.py          # Settings
│   └── requirements.txt   # Backend deps
├── frontend/              # React + Vite + TypeScript
│   ├── src/pages/Home.tsx # Table + chart + trade_code filter
│   └── src/components/StockChart.tsx
├── stock_market_data.json # Provided dataset (source of truth in jsonModel)
└── .gitignore
```

## Run (jsonModel)

Prereqs: Python 3.10+, Node.js 18+ (npm 9+).

Backend (Flask):
1) Create venv and install deps from `backend/requirements.txt`.
2) Run `backend/app.py` to start on http://127.0.0.1:5000.

Frontend (Vite React):
1) From `frontend/`, run `npm install` once.
2) `npm run dev` to start on http://localhost:5173.

Dev proxy: The frontend proxies `/api` to the Flask server during development. You can also set `VITE_API_BASE_URL` to override the default.

## API (jsonModel)

- `GET /` → text: "Backend OK"
- `GET /api/health` → `{ "status": "ok" }`
- `GET /api/stocks` → Array of rows from `stock_market_data.json`

Notes:
- Numeric fields may be strings (sometimes with commas). The frontend normalizes them for the chart.
- The chart shows Close (line, left axis) and Volume (bar, right axis) over time. Use the dropdown to filter by `trade_code`.

## What’s next (sqlModel)

- Introduce a SQLite database and an ORM model (e.g., SQLAlchemy) for stocks.
- CRUD endpoints (list/create/update/delete) replacing the JSON source.
- Editable rows on the frontend mapped to the new endpoints.
- Performance pass and additional visualizations.

## Branching and snapshots

This commit marks the jsonModel snapshot. See `docs/BRANCHING.md` for how we track jsonModel vs sqlModel going forward.

