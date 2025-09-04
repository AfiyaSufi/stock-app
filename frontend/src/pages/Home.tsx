import { useEffect, useMemo, useState } from 'react'
import { fetchStocks } from '../api/client'
import { StockChart } from '../components/StockChart'
import { EditableTable } from '../components/EditableTable'
import { ExtraInsights } from '../components/ExtraInsights'

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
    <div className="container">
      <div className="header">
        <div>
          <div className="title">Stock Dashboard</div>
        </div>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>Error loading data: {error}</p>}
      {!loading && !error && (
        <div>
          <div className="toolbar">
            <div className="field">
              <label>Trade code</label>
              <select value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
                <option value="">All</option>
                {tradeCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top big card: Price & Volume */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title">Price and volume</div>
            <StockChart rows={filtered as any[]} height={440} />
          </div>

          {/* Below: Extra insights stay as their own section/cards */}
          <div className="spacer" />
          <div className="card">
            <div className="section-title">Extra insights</div>
            <ExtraInsights rows={filtered as any[]} />
          </div>

          <div className="spacer" />
          <div className="card">
            <div className="section-title">Editable table</div>
            <EditableTable tradeCode={selectedCode || undefined} />
          </div>
        </div>
      )}
    </div>
  )
}
