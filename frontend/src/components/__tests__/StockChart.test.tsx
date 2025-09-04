import React from 'react'
import { render, screen } from '@testing-library/react'
import { StockChart } from '../../components/StockChart'

describe('StockChart', () => {
  it('renders caption and legend', () => {
    const rows = [
      { date: '2020-01-01', close: '100', volume: '1000' },
      { date: '2020-01-02', close: '110', volume: '900' },
    ]
    render(<StockChart rows={rows as any} />)
    expect(screen.getByText(/closing price/i)).toBeInTheDocument()
  })
})
