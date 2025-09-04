import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
)

type Row = Record<string, any>

function toNum(val: any): number | null {
  if (val == null) return null
  const n = Number(String(val).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function formatDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ExtraInsights({ rows }: { rows: Row[] }) {
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const sorted = useMemo(() => {
    return [...rows]
      .filter((r) => r.date)
      .map((r) => ({
        ...r,
        _date: new Date(r.date),
        _close: toNum(r.close),
        _volume: toNum(r.volume),
      }))
      .filter((r) => !Number.isNaN(r._date.getTime()))
      .sort((a, b) => a._date.getTime() - b._date.getTime())
  }, [rows])

  const defaultFrom = useMemo(() => (sorted[0]?._date ? formatDateInput(sorted[0]._date) : ''), [sorted])
  const defaultTo = useMemo(() => (sorted.at(-1)?._date ? formatDateInput(sorted.at(-1)!._date) : ''), [sorted])

  const [rangeFrom, rangeTo] = [from || defaultFrom, to || defaultTo]

  const ranged = useMemo(() => {
    if (!rangeFrom && !rangeTo) return sorted
    const start = rangeFrom ? new Date(rangeFrom) : new Date(-8640000000000000)
    const end = rangeTo ? new Date(rangeTo) : new Date(8640000000000000)
    return sorted.filter((r) => r._date >= start && r._date <= end)
  }, [sorted, rangeFrom, rangeTo])

  // Moving averages (MA7, MA30) over close
  const maSeries = useMemo(() => {
    const win7 = 7
    const win30 = 30
    const close: Array<number | null> = ranged.map((r) => r._close)
    const ma7: Array<number | null> = new Array(ranged.length).fill(null)
    const ma30: Array<number | null> = new Array(ranged.length).fill(null)
    let sum7 = 0
    let count7 = 0
    const q7: number[] = []
    let sum30 = 0
    let count30 = 0
    const q30: number[] = []
    for (let i = 0; i < close.length; i++) {
      const v = close[i]
      // MA7
      if (v != null) {
        q7.push(v)
        sum7 += v
        count7 += 1
      } else {
        q7.push(0)
      }
      if (q7.length > win7) {
        const removed = close[i - win7]
        if (removed != null) {
          sum7 -= removed
          count7 -= 1
        }
        q7.shift()
      }
      if (count7 === win7) ma7[i] = sum7 / win7

      // MA30
      if (v != null) {
        q30.push(v)
        sum30 += v
        count30 += 1
      } else {
        q30.push(0)
      }
      if (q30.length > win30) {
        const removed30 = close[i - win30]
        if (removed30 != null) {
          sum30 -= removed30
          count30 -= 1
        }
        q30.shift()
      }
      if (count30 === win30) ma30[i] = sum30 / win30
    }
    return { ma7, ma30 }
  }, [ranged])

  // Volume histogram (10 bins)
  const volumeHist = useMemo(() => {
    const vols = ranged.map((r) => r._volume).filter((v): v is number => v != null)
    if (vols.length === 0) return { labels: [] as string[], counts: [] as number[] }
    const min = Math.min(...vols)
    const max = Math.max(...vols)
    const bins = 10
    const step = (max - min) / bins || 1
    const counts = new Array(bins).fill(0) as number[]
    const labels = new Array(bins).fill('') as string[]
    for (let i = 0; i < bins; i++) {
      const a = Math.round(min + i * step)
      const b = Math.round(min + (i + 1) * step)
      labels[i] = `${a.toLocaleString()}–${b.toLocaleString()}`
    }
    vols.forEach((v) => {
      let idx = Math.floor((v - min) / step)
      if (idx >= bins) idx = bins - 1
      if (idx < 0) idx = 0
      counts[idx]++
    })
    return { labels, counts }
  }, [ranged])

  const maData = {
    labels: ranged.map((r) => r._date),
    datasets: [
      {
        type: 'line' as const,
        label: 'Close',
        data: ranged.map((r) => r._close),
        borderColor: '#334155',
        backgroundColor: 'rgba(51,65,85,0.15)',
        yAxisID: 'y',
        pointRadius: 0,
        tension: 0.2,
      },
      {
        type: 'line' as const,
        label: 'MA7',
        data: maSeries.ma7,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        yAxisID: 'y',
        pointRadius: 0,
        tension: 0.2,
      },
      {
        type: 'line' as const,
        label: 'MA30',
        data: maSeries.ma30,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.15)',
        yAxisID: 'y',
        pointRadius: 0,
        tension: 0.2,
      },
    ],
  }

  const maOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { position: 'top' as const } },
    scales: {
      x: { type: 'time' as const, time: { unit: 'day' as const } },
      y: { type: 'linear' as const, position: 'left' as const, title: { display: true, text: 'Price' } },
    },
  }

  const volData = {
    labels: volumeHist.labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Volume distribution',
        data: volumeHist.counts,
        backgroundColor: 'rgba(99,102,241,0.5)',
        borderColor: 'rgba(99,102,241,1)',
      },
    ],
  }

  const volOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { maxRotation: 0, autoSkip: true } }, y: { beginAtZero: true } },
  }

  return (
    <div>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <div className="field">
          <label>From</label>
          <input type="date" value={rangeFrom} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={rangeTo} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Close and moving averages</div>
          <div style={{ width: '100%', height: 320 }}>
            <Line data={maData} options={maOptions as any} />
          </div>
          <div className="caption">Close with 7-day and 30-day moving averages (time on X, price on Y).</div>
        </div>
        <div className="card">
          <div className="section-title">Volume histogram</div>
          <div style={{ width: '100%', height: 260 }}>
            <Bar data={volData} options={volOptions as any} />
          </div>
          <div className="caption">Histogram of daily traded volume (bucketed into 10 ranges).</div>
        </div>
      </div>
    </div>
  )
}
