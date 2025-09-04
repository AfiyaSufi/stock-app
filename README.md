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

- JSON-first made it quick to get a working UI and charts; migrating to SQL unlocked CRUD and performance.
- Charting in tests requires jsdom shims (canvas + ResizeObserver) for Chart.js; added in test setup.
- On Windows, CRLF line endings can trip Prettier; enforced LF in .prettierrc to keep lint clean.
- Virtualizing table rows keeps DOM light with large datasets.
- Indexing (trade_code, date) and server-side pagination are essential for snappy queries.

## Challenges

- Handling numeric fields sometimes provided as strings with commas; normalized at the edge.
- Coordinating dual axes (price vs volume) and readable ticks/labels.
- Ensuring Jest runs smoothly with React 18 + SWC + automatic JSX runtime.

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

## Screenshots (optional)

Drop PNGs into docs/screenshots and reference them here, for example:

![Home - Price and Volume](docs/screenshots/home-top-chart.png)
![Extra Insights](docs/screenshots/extra-insights.png)
![Editable Table](docs/screenshots/editable-table.png)

## Branching and snapshots

See docs/BRANCHING.md for how jsonModel and sqlModel are tracked via branches/tags.

## Troubleshooting

- If frontend tests fail with ResizeObserver missing, ensure test setup polyfill is present (see frontend/src/test/setup.ts).
- If ESLint reports many “Delete ␍”, run `npm run format` to normalize line endings.
- If CORS issues appear in non-dev setups, verify Flask CORS is enabled for /api/*.

