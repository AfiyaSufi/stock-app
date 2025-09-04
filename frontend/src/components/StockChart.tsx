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
import { Line } from 'react-chartjs-2'

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

type StockChartProps = {
  rows: Row[]
  height?: number
}

export function StockChart({ rows, height = 360 }: StockChartProps) {
  // Normalize and sort by date asc
  const points = [...rows]
    .filter((r) => r.date && r.close && r.volume)
    .map((r) => ({
      date: new Date(r.date),
      close: Number(String(r.close).replace(/,/g, '')),
      volume: Number(String(r.volume).replace(/,/g, '')),
    }))
    .filter(
      (p) => !Number.isNaN(p.close) && !Number.isNaN(p.volume) && !Number.isNaN(p.date.getTime()),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const data = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        type: 'line' as const,
        label: 'Close',
        data: points.map((p) => p.close),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.2,
        yAxisID: 'y1',
        pointRadius: 0,
      },
      {
        type: 'bar' as const,
        label: 'Volume',
        data: points.map((p) => p.volume),
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
        borderColor: 'rgba(16, 185, 129, 1)',
        yAxisID: 'y2',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: { unit: 'day' as const },
        ticks: { autoSkip: true, maxTicksLimit: 8 },
      },
      y1: {
        type: 'linear' as const,
        position: 'left' as const,
        grid: { drawOnChartArea: true },
        title: { display: true, text: 'Close' },
        suggestedMin: 0,
        ticks: {
          callback: (v: any) => {
            try {
              return Number(v).toLocaleString()
            } catch {
              return v
            }
          },
        },
      },
      y2: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Volume' },
        beginAtZero: true,
        ticks: {
          callback: (v: any) => {
            try {
              return Number(v).toLocaleString()
            } catch {
              return v
            }
          },
        },
      },
    },
  }

  return (
    <div>
      <div style={{ width: '100%', height }}>
        <Line data={data} options={options as any} />
      </div>
      <div className="caption">
        Line shows closing price (left axis). Bars show traded volume (right axis). Time on X.
      </div>
    </div>
  )
}
