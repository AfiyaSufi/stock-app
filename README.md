# stock-app

A full-stack take-home app scaffold with Flask (backend) and React (frontend).

## Structure

```
stock-app/
├── backend/              # Flask API (JSON model first, then SQLite)
│   ├── app.py            # Flask entrypoint
│   ├── config.py         # Settings
│   └── requirements.txt  # Backend deps
├── frontend/             # React app (to be generated)
├── stock_market_data.json# Provided dataset
└── .gitignore
```

## Run - Backend

1. Create a virtual environment and install deps.
2. Start the Flask server on port 5000.

Endpoints:
- `GET /` -> "Backend OK"
- `GET /api/health` -> `{ status: "ok" }`

## Run - Frontend

The React app will be added under `frontend/` using Vite and will proxy API calls to the backend during development.

## Next

- Generate the React app scaffold.
- Add an API that serves `stock_market_data.json`.
- Render a data table and chart on the frontend.
