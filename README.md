# stock-app

React + Flask full-stack app visualizing stock data. Two runnable modes:

- jsonModel: API serves directly from `stock_market_data.json` (simple read-only).
- sqlModel: Data stored in SQLite via SQLAlchemy with full CRUD and pagination; frontend table is editable.

This README is a complete runbook. A reviewer should be able to run either mode locally using only these instructions.

## Prerequisites

- Python 3.10+ (virtualenv recommended)
- Node.js 18+ and npm 9+

## Project structure

```
stock-app/
├── backend/
│   ├── app.py              # Flask app factory + JSON API + mounts SQL blueprint
│   ├── routes.py           # SQL CRUD routes (/api/sql/stocks)
│   ├── models.py           # SQLAlchemy models
│   ├── db.py               # Engine/session helpers
│   ├── import_data.py      # Importer from JSON to SQLite
│   ├── tests/              # Pytest API smoke tests
│   └── requirements.txt    # Flask + CORS + SQLAlchemy + pytest
├── frontend/
│   ├── src/pages/Home.tsx  # Layout: top chart, extra insights, editable table
│   ├── src/components/StockChart.tsx
│   ├── src/components/ExtraInsights.tsx
│   ├── src/components/EditableTable.tsx
│   ├── src/style.css       # Single-color background, cards, grid
│   ├── jest.config.cjs     # Jest + SWC + jsdom
│   ├── eslint.config.js    # ESLint v9 flat config
│   └── TESTING.md          # Frontend testing notes
├── stock_market_data.json  # Source dataset
└── docs/
	 ├── BRANCHING.md
	 ├── PERFORMANCE.md
	 └── screenshots/        # Drop images for README here (optional)
```

## Running: jsonModel (read-only)

1) Backend
	- Create a venv and install deps:
	  - Windows (PowerShell):
		 - python -m venv .venv
		 - .\.venv\Scripts\Activate.ps1
		 - pip install -r backend/requirements.txt
	- Start Flask (app factory):
	  - $env:FLASK_APP='app:create_app'
	  - python -m flask --app backend.app:create_app run --port 5000
	  - Health: http://127.0.0.1:5000/api/health

2) Frontend
	- cd frontend
	- npm install
	- npm run dev (http://localhost:5173)

Proxy: Vite dev server proxies /api to http://127.0.0.1:5000. You can override with VITE_API_BASE_URL.

## Running: sqlModel (CRUD)

1) Initialize the SQLite database from JSON
	- cd backend
	- python import_data.py  (creates or updates SQLite DB, usually backend/app.db)

2) Start the backend with SQL routes
	- Same as above. The SQL blueprint exposes /api/sql/stocks endpoints (see API below).

3) Frontend
	- Same as above. The editable table already points to /api/sql/stocks. The top chart still reads the JSON API for full dataset visualization; you can switch it to SQL if desired.

## API reference

jsonModel
- GET /              → "Backend OK"
- GET /api/health    → { status: "ok" }
- GET /api/stocks    → Array of rows from stock_market_data.json

sqlModel (base: /api/sql/stocks)
- GET    /api/sql/stocks?trade_code=CODE&page=1&page_size=20&sort=date|-date|close|-close|volume|-volume
  - Returns: { items: Stock[], total: number, page: number, page_size: number }
- POST   /api/sql/stocks               Body: Stock (without id) → creates
- PATCH  /api/sql/stocks/:id           Body: Partial<Stock>     → updates
- DELETE /api/sql/stocks/:id           → deletes

Stock fields
- id (int), date (YYYY-MM-DD), trade_code (string), open, high, low, close (float), volume (int)

## Frontend features

- Top “Price and volume” big card: Close (line, left axis) + Volume (bars, right axis) over time.
- Trade code filter dropdown.
- Extra Insights section: Moving averages (MA7, MA30) and Volume histogram with date range.
- Editable table backed by SQL API: add/edit/delete, sorting and pagination; virtualized rows for performance.

## Architecture

- Flask app factory `create_app()` mounts JSON routes and a SQL blueprint.
- SQLAlchemy 2.0 models with a composite index on (trade_code, date) to accelerate common queries.
- REST-style CRUD with pagination and sorting. CORS enabled for /api/*.
- React (Vite + TS), Chart.js via react-chartjs-2. Jest + RTL for tests. ESLint v9 (flat) + Prettier.

```
[React UI] --(fetch)--> [/api or /api/sql] --(Flask)--> [JSON file or SQLite via SQLAlchemy]
```

## Tradeoffs and learnings

- I started with the JSON file to move fast and show value quickly. It let me get the UI and chart on screen with almost no setup. The tradeoff is that it’s read‑only and can get slow as the file grows.
- Switching to SQLite added real CRUD and faster queries. The cost was a bit more plumbing (models, importer, endpoints) and thinking about indexes.
- Chart.js was a good fit: small, flexible, and works well with React. In tests you do need a canvas/ResizeObserver shim so jsdom doesn’t crash.
- On Windows, line endings can be noisy. Enforcing LF with Prettier kept lint clean and diff noise low.
- Virtualized rows kept the table smooth with lots of data; it’s a little more code than a plain table, but worth it for responsiveness.
- An index on (trade_code, date) plus server‑side pagination made "list + filter" feel instant.

## Challenges

- Some numbers came in as strings (often with commas). I cleaned them at the edges so both the chart and DB see real numbers.
- Dual axes (price vs volume) can be cluttered if labels aren’t tuned. Tightening ticks and adding captions made them readable.
- Jest + React 18 + SWC needed the automatic JSX runtime and a couple of shims (canvas, ResizeObserver) to run chart tests reliably.

## Tests and lint

Backend
- cd backend
- pip install -r requirements.txt
- pytest -q

Frontend
- cd frontend
- npm install
- npm test
- npm run lint
- npm run ci  (runs lint + tests)

## Deploying to Render (free tier)

This repo includes a `render.yaml` blueprint that creates two services: a Python backend and a static frontend. Follow these steps for a smooth deploy on the free tier.

1) Apply the blueprint
- Push to GitHub with `render.yaml` at repo root.
- Render → New → Blueprint → pick this repo/branch → Apply.
- You should see two services:
	- Backend (web, Python)
		- Build: `pip install -r requirements.txt`
		- Start: `python import_data.py && gunicorn -w 2 -k gthread -b 0.0.0.0:$PORT app:app`
		- Env: `FLASK_ENV=production`, `FLASK_DEBUG=0`, `PYTHON_VERSION`, `STOCK_APP_DB=/tmp/stock.db`
		- Importer runs automatically on start to seed SQLite (no shell needed on free tier).
	- Frontend (web, static)
		- Build: `npm install && npm run build`
		- Publish: `dist`
		- Env: `NODE_VERSION` and one of:
			- `VITE_API_BASE_URL = https://<your-backend>.onrender.com` (recommended), or
			- `VITE_API_HOST = <your-backend>.onrender.com` (host only, no scheme)

2) CORS and env vars
- Backend → Environment: set `CORS_ORIGINS = https://<your-frontend>.onrender.com` (exact origin).
- Frontend → Environment: prefer `VITE_API_BASE_URL` (full URL). If you use `VITE_API_HOST`, do not include `https://`.
- After changing frontend env vars, click “Clear build cache & deploy” so Vite rebakes them into the bundle.

3) Warm‑up order (free tier)
- Free services can sleep. First hit the backend to wake it and allow seeding:
	- `https://<your-backend>.onrender.com/api/health`
- Then open the frontend URL. Give it ~10–20s after the health check if just deployed.

4) Verify
- Backend: `/api/health`, `/api/stocks`, `/api/sql/stocks`
- Frontend: open the site and check DevTools → Network; requests should go to the backend domain over HTTPS.

5) If the frontend shows “TypeError: Failed to fetch”
- DevTools → Network → click the failing request:
	- Request URL = frontend domain → API URL wasn’t baked; set `VITE_API_BASE_URL` and redeploy (clear cache).
	- Request URL = backend domain but blocked by CORS → set `CORS_ORIGINS` to your exact frontend origin and redeploy backend.
	- Request URL starts with `https://https://` → you put a full URL into `VITE_API_HOST`; remove scheme or switch to `VITE_API_BASE_URL`.
	- Mixed content (http vs https) → use HTTPS URLs for both services.

6) Data on free tier (SQLite)
- DB lives at `/tmp/stock.db` and is ephemeral. The start command auto‑runs `import_data.py` so tables/data exist on each start.

7) Make data persistent (paid plan)
- Upgrade backend to a plan with disks, then change:
	- `STOCK_APP_DB=/var/data/stock.db` and add a `disk` block (mount `/var/data`).
	- Redeploy once; remove auto‑import at start if you don’t want it to overwrite.

Alternative: Render PostgreSQL
- Use a managed DB and update the app to read `DATABASE_URL`; migrate/import accordingly.

## Troubleshooting

- If frontend tests fail with ResizeObserver missing, ensure test setup polyfill is present (see frontend/src/test/setup.ts).
- If ESLint reports many “Delete ␍”, run `npm run format` to normalize line endings.
- If CORS issues appear in non-dev setups, verify Flask CORS is enabled for /api/*.

