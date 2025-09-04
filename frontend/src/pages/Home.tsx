import { useEffect, useMemo, useState } from 'react'
import { fetchStocks } from '../api/client'

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

  const columns = useMemo(() => {
    if (data.length === 0) return [] as string[]
    return Object.keys(data[0])
  }, [data])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>Stocks</h1>
      {loading && <p>Loading…</p>}
      {error && (
        <p style={{ color: 'red' }}>Error loading data: {error}</p>
      )}
      {!loading && !error && (
        <div style={{ overflowX: 'auto' }}>
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
              {data.map((row, i) => (
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
          <p style={{ marginTop: 12, color: '#666' }}>Rows: {data.length}</p>
        </div>
      )}
    </div>
  )
}
