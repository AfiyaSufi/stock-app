import { useEffect, useMemo, useState } from 'react'
import { fetchStocks } from '../api/client'
import { StockChart } from '../components/StockChart'

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

  const columns = useMemo(() => {
    if (filtered.length === 0) return [] as string[]
    return Object.keys(filtered[0])
  }, [filtered])

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

          {/* Table */}
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    style={{
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                      padding: '8px 12px',
                      background: '#fafafa',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td
                      key={c}
                      style={{ borderBottom: '1px solid #f0f0f0', padding: '8px 12px' }}
                    >
                      {String(row[c] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12, color: '#666' }}>Rows: {filtered.length}</p>
        </div>
      )}
    </div>
  )
}
