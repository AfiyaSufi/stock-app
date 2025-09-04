const host = import.meta.env.VITE_API_HOST
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (host ? `https://${host}` : '')

export async function fetchStocks(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/stocks`)
  if (!res.ok) throw new Error(`Failed to load stocks: ${res.status}`)
  return res.json()
}
