// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProgramPage } from '../ProgramPage'

describe('ProgramPage', () => {
  it('redirige vers /week', () => {
    render(
      <MemoryRouter initialEntries={['/program']}>
        <Routes>
          <Route path="/program" element={<ProgramPage />} />
          <Route path="/week" element={<div data-testid="week-page">Week</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('week-page')).toBeInTheDocument()
  })
})
