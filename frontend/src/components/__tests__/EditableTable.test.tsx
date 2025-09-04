import React from 'react'
import { render, screen } from '@testing-library/react'
import { EditableTable } from '../../components/EditableTable'

jest.mock('../../api/stocks', () => ({
  listStocks: jest.fn().mockResolvedValue({ items: [], page: 1, page_size: 20, total: 0 }),
  createStock: jest.fn(),
  updateStock: jest.fn(),
  deleteStock: jest.fn(),
}))

describe('EditableTable', () => {
  it('renders toolbar controls', async () => {
    render((<EditableTable />) as any)
    expect(await screen.findByText(/Add Row/i)).toBeInTheDocument()
  })
})
