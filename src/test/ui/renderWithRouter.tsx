import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { InitialEntry } from 'react-router-dom'

export const renderWithRouter = (
  element: ReactElement,
  options?: {
    initialEntries?: InitialEntry[]
  }
) =>
  render(
    <MemoryRouter initialEntries={options?.initialEntries ?? ['/']}>
      {element}
    </MemoryRouter>
  )

