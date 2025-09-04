# stock-app

React + Flask full‑stack app to visualize and edit stock data.

Two ways to run it locally (both work out of the box):
- jsonModel: API serves directly from `stock_market_data.json` (read‑only; used by the top chart).
- sqlModel: SQLite + SQLAlchemy with full CRUD and pagination (used by the editable table).

This README is a step‑by‑step runbook for Windows PowerShell. Copy/paste blocks should “just work”.

## Prerequisites

- Python 3.10+ (virtualenv recommended)
- Node.js 18+ and npm 9+

## Clone and install

```powershell
# 1) Clone
git clone https://github.com/AfiyaSufi/stock-app.git
cd stock-app

# 2) Python env + deps (created at repo root)
python -m venv .venv
./.venv/Scripts/Activate.ps1
pip install -r backend/requirements.txt

# 3) Frontend deps
cd frontend
npm install
cd ..
```

## Run locally (two terminals)

Open two PowerShell terminals side-by-side.

Terminal A — Backend (Flask):
```powershell
cd backend

# Optional: seed SQLite from the JSON file (creates backend/stock.db)
python import_data.py

# Start the API on http://127.0.0.1:5000
python -m flask --app app:create_app run --port 5000

# Health check (open in a browser)
# http://127.0.0.1:5000/api/health
```

Terminal B — Frontend (Vite):
```powershell
cd frontend
npm run dev

# App will open at:
# http://localhost:5173/
```

Notes
- The Vite dev server automatically proxies `/api/*` to `http://127.0.0.1:5000` (config in `frontend/vite.config.ts`).
- No extra env vars are needed for local dev.

## What you should see

- Top “Price and volume” chart (JSON API)
- “Extra insights” charts (moving averages, volume histogram)
- Editable table (SQL API with add/edit/delete, pagination + sorting)

## API quick reference

jsonModel
- GET `/` → "Backend OK"
- GET `/api/health` → `{ status: "ok" }`
- GET `/api/stocks` → array from `stock_market_data.json`

sqlModel (base: `/api/sql/stocks`)
- GET `/api/sql/stocks?trade_code=CODE&page=1&page_size=20&sort=date|-date|close|-close|volume|-volume`
	- Returns: `{ items: Stock[], total: number, page: number, page_size: number }`
- POST `/api/sql/stocks` — create
- PATCH `/api/sql/stocks/:id` — update
- DELETE `/api/sql/stocks/:id` — delete

Stock fields
- id (int), date (YYYY‑MM‑DD), trade_code (string), open, high, low, close (float), volume (int)

## Project structure

```
stock-app/
├── backend/
│   ├── app.py              # Flask app factory + JSON API + mounts SQL blueprint
│   ├── routes.py           # SQL CRUD routes (/api/sql/stocks)
│   ├── models.py           # SQLAlchemy models
│   ├── db.py               # Engine/session helpers (SQLite file: backend/stock.db)
│   ├── import_data.py      # Importer from JSON to SQLite
│   ├── tests/              # Pytest API smoke tests
│   └── requirements.txt    # Flask + CORS + SQLAlchemy + pytest
├── frontend/
│   ├── src/pages/Home.tsx  # Layout: big top chart, extra insights, editable table
│   ├── src/components/StockChart.tsx
│   ├── src/components/ExtraInsights.tsx
│   ├── src/components/EditableTable.tsx
│   ├── src/style.css       # Single-color background, cards, grid
│   ├── jest.config.cjs     # Jest + SWC + jsdom
│   ├── eslint.config.js    # ESLint v9 flat config
│   └── TESTING.md          # Frontend testing notes
├── stock_market_data.json  # Source dataset
```

## Tests and lint

Backend
```powershell
cd backend
pytest -q
```

Frontend
```powershell
cd frontend
npm test
npm run lint
npm run ci   # runs lint + tests
```

## Deploy to Render (free tier)

This repo includes a `render.yaml` blueprint for a two‑service deploy (Python backend + static frontend).

1) Connect your GitHub repo in Render → New → Blueprint → select this repo/branch → Apply.
2) Services created:
	 - Backend (Python):
		 - Build: `pip install -r requirements.txt`
		 - Start: `python import_data.py && gunicorn -w 2 -k gthread -b 0.0.0.0:$PORT app:app`
		 - Env: `FLASK_ENV=production`, `FLASK_DEBUG=0`, `PYTHON_VERSION`, `STOCK_APP_DB=/tmp/stock.db`
	 - Frontend (static):
		 - Build: `npm install && npm run build`
		 - Publish directory: `dist`
		 - Env (recommended): `VITE_API_BASE_URL = https://<your-backend>.onrender.com`

If the frontend shows “Failed to fetch”:
- Ensure `VITE_API_BASE_URL` is set and redeploy (clear build cache).
- Or use `VITE_API_HOST = <your-backend>.onrender.com` (host only, no scheme).
- Set backend `CORS_ORIGINS` to your exact frontend origin.

SQLite on free tier is ephemeral (`/tmp/stock.db`). The start command auto‑seeds via `import_data.py` each boot.

## Troubleshooting (local)

- Flask not found / module errors: make sure the venv is activated and you ran `pip install -r backend/requirements.txt`.
- Address already in use: change ports (e.g., `--port 5001` for Flask; Vite picks a new port automatically or set `--port 5174`).
- Frontend can’t reach API: confirm backend is on `http://127.0.0.1:5000` and Vite proxy is active; check DevTools → Network.
- Node/npm version issues: use Node 18+; reinstall `node_modules` if needed (`rm -r frontend/node_modules` then `npm install`).

## Architecture and features (quick)

- Flask app factory mounts JSON and SQL routes; CORS enabled for `/api/*`.
- SQLAlchemy 2 with composite index on `(trade_code, date)` for faster queries; server‑side pagination + sorting.
- React 18 + Vite + TypeScript; Chart.js via `react-chartjs-2`.
- Top chart (price+volume), extra insights (MA7/MA30, volume histogram), editable SQL table with virtualization.

## Tradeoffs and learnings

- I started with the JSON file to move fast and show value quickly. It let me get the UI and chart on screen with almost no setup. The tradeoff is that it’s read‑only and can get slow as the file grows.
- Switching to SQLite added real CRUD and faster queries. The cost was a bit more plumbing (models, importer, endpoints) and thinking about indexes.
- Chart.js was a good fit: small, flexible, and works well with React. In tests you do need a canvas/ResizeObserver shim so jsdom doesn’t crash.
- On Windows, line endings can be noisy. Enforcing LF with Prettier kept lint clean and diff noise low.
- Virtualized rows kept the table smooth with lots of data; it’s a little more code than a plain table, but worth it for responsiveness.
- An index on (trade_code, date) plus server‑side pagination made "list + filter" feel instant.

