import { API_BASE_URL } from './client'

export type StockDTO = {
  id?: number
  date: string
  trade_code: string
  high?: number | string | null
  low?: number | string | null
  open?: number | string | null
  close?: number | string | null
  volume?: number | string | null
}

export type ListParams = {
  trade_code?: string
  page?: number
  page_size?: number
  sort?: string // e.g., 'date' or '-date'
}

export type ListResponse = {
  items: StockDTO[]
  page: number
  page_size: number
  total: number
  sort: string
  trade_code?: string
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export function listStocks(params: ListParams = {}): Promise<ListResponse> {
  const q = new URLSearchParams()
  if (params.trade_code) q.set('trade_code', params.trade_code)
  if (params.page) q.set('page', String(params.page))
  if (params.page_size) q.set('page_size', String(params.page_size))
  if (params.sort) q.set('sort', params.sort)
  const qs = q.toString()
  return http<ListResponse>(`/api/sql/stocks${qs ? `?${qs}` : ''}`)
}

export function getStock(id: number): Promise<StockDTO> {
  return http<StockDTO>(`/api/sql/stocks/${id}`)
}

export function createStock(body: StockDTO): Promise<StockDTO> {
  return http<StockDTO>(`/api/sql/stocks`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateStock(id: number, body: Partial<StockDTO>): Promise<StockDTO> {
  return http<StockDTO>(`/api/sql/stocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteStock(id: number): Promise<void> {
  return http<void>(`/api/sql/stocks/${id}`, { method: 'DELETE' })
}
