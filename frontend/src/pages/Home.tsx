import { useEffect, useMemo, useState } from 'react'
import { fetchStocks } from '../api/client'
import { StockChart } from '../components/StockChart'
import { EditableTable } from '../components/EditableTable'

type StockRow = Record<string, string | number | null>

export function Home() {
  const [data, setData] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchStocks()
      .then((rows) => {
        if (!mounted) return
        setData(Array.isArray(rows) ? rows : [])
        setError(null)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const tradeCodes = useMemo(() => {
    const set = new Set<string>()
    data.forEach((r) => {
      if (r.trade_code) set.add(String(r.trade_code))
    })
    return Array.from(set).sort()
  }, [data])

  const [selectedCode, setSelectedCode] = useState<string>('')

  const filtered = useMemo(() => {
    if (!selectedCode) return data
    return data.filter((r) => String(r.trade_code) === selectedCode)
  }, [data, selectedCode])

  // columns no longer needed here; EditableTable defines its own columns

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>Stocks</h1>
      {loading && <p>Loading…</p>}
      {error && (
        <p style={{ color: 'red' }}>Error loading data: {error}</p>
      )}
      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <label>
              Trade code:
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                <option value="">All</option>
                {tradeCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Chart */}
          <StockChart rows={filtered as any[]} />
          <div style={{ height: 16 }} />

          {/* Editable SQL-backed Table */}
          <EditableTable tradeCode={selectedCode || undefined} />
        </div>
      )}
    </div>
  )
}
