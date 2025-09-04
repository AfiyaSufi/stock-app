# Performance notes

## Database
- Added composite index: `CREATE INDEX ix_stocks_trade_code_date ON stocks(trade_code, date);`
- Server-side pagination and sorting are applied in `/api/sql/stocks`.

## API usage
- Keep `page_size` reasonable (e.g., 20–100).
- Use `trade_code` filter to narrow result sets for charts and tables.

## Frontend
- Table is paginated; prefer small `page_size` for responsiveness.
- For extremely large pages, consider row virtualization (e.g., react-window or react-virtualized).
- Debounce text inputs/filters if adding free-text search later.
