import { useEffect, useMemo, useState } from 'react'
import type { StockDTO } from '../api/stocks'
import { createStock, deleteStock, listStocks, updateStock } from '../api/stocks'

type Props = {
  tradeCode?: string
}

function validate(row: Partial<StockDTO>): string | null {
  if (!row.date || String(row.date).trim() === '') return 'Date is required'
  if (!row.trade_code || String(row.trade_code).trim() === '') return 'Trade code is required'
  return null
}

export function EditableTable({ tradeCode }: Props) {
  const [rows, setRows] = useState<StockDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sort, setSort] = useState<string>('date')

  async function load() {
    setLoading(true)
    try {
      const res = await listStocks({ trade_code: tradeCode, page, page_size: pageSize, sort })
      setRows(res.items)
      setError(null)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeCode, page, pageSize, sort])

  const columns = useMemo(() => ['date', 'trade_code', 'high', 'low', 'open', 'close', 'volume'] as const, [])

  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<Partial<StockDTO>>({})

  function startEdit(row: StockDTO) {
    setEditingId(row.id!)
    setDraft({ ...row })
  }

  function startAdd() {
    setEditingId('new')
    setDraft({ date: '', trade_code: '', high: null, low: null, open: null, close: null, volume: null })
  }

  function cancel() {
    setEditingId(null)
    setDraft({})
  }

  function onDraftChange(key: keyof StockDTO, value: string) {
    let v: any = value
    if (['high', 'low', 'open', 'close', 'volume'].includes(key)) {
      v = value === '' ? null : Number(value)
      if (Number.isNaN(v)) v = null
    }
    setDraft((d) => ({ ...d, [key]: v }))
  }

  async function save() {
    const err = validate(draft)
    if (err) {
      alert(err)
      return
    }
    try {
      if (editingId === 'new') {
        await createStock(draft as StockDTO)
        alert('Row added')
      } else if (typeof editingId === 'number') {
        await updateStock(editingId, draft)
        alert('Row saved')
      }
      cancel()
      load()
    } catch (e: any) {
      alert(e.message || 'Save failed')
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this row?')) return
    try {
      await deleteStock(id)
      alert('Row deleted')
      load()
    } catch (e: any) {
      alert(e.message || 'Delete failed')
    }
  }

  return (
    <div>
      <div style={{ margin: '12px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={startAdd}>+ Add Row</button>
        <label>
          Page size:
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ marginLeft: 6 }}>
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort:
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ marginLeft: 6 }}>
            {['date', '-date', 'close', '-close', 'volume', '-volume'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '6px 8px', background: '#fafafa' }}>
                {c}
              </th>
            ))}
            <th style={{ width: 140 }}></th>
          </tr>
        </thead>
        <tbody>
          {editingId === 'new' && (
            <tr>
              {columns.map((c) => (
                <td key={c} style={{ borderBottom: '1px solid #f0f0f0', padding: '4px 8px' }}>
                  <input
                    value={String(draft[c] ?? '')}
                    onChange={(e) => onDraftChange(c, e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
              ))}
              <td>
                <button onClick={save} style={{ marginRight: 6 }}>Save</button>
                <button onClick={cancel}>Cancel</button>
              </td>
            </tr>
          )}

          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => (
                <td key={c} style={{ borderBottom: '1px solid #f0f0f0', padding: '4px 8px' }}>
                  {editingId === r.id ? (
                    <input
                      value={String((draft as any)[c] ?? '')}
                      onChange={(e) => onDraftChange(c as any, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    String((r as any)[c] ?? '')
                  )}
                </td>
              ))}
              <td>
                {editingId === r.id ? (
                  <>
                    <button onClick={save} style={{ marginRight: 6 }}>Save</button>
                    <button onClick={cancel}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)} style={{ marginRight: 6 }}>Edit</button>
                    <button onClick={() => remove(r.id!)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}
