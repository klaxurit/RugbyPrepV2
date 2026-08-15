// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ClubContactProxyControl } from '../ClubContactProxyControl'

describe('ClubContactProxyControl', () => {
  it('sélectionne dur et appelle onChange', () => {
    const onChange = vi.fn()
    render(<ClubContactProxyControl value="normal" lang="fr" onChange={onChange} />)
    expect(screen.getByTestId('club-contact-proxy')).toBeTruthy()
    fireEvent.click(screen.getByTestId('club-contact-hard'))
    expect(onChange).toHaveBeenCalledWith('hard')
  })
})
