// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { InlineNotice } from '../InlineNotice'

describe('InlineNotice', () => {
  it('renders title and body', () => {
    const { container } = render(
      <InlineNotice title="Titre">
        <p>Corps du message</p>
      </InlineNotice>,
    )
    const root = within(container)
    expect(root.getByRole('region', { name: 'Titre' })).toBeInTheDocument()
    expect(container.textContent).toContain('Corps du message')
  })

  it('uses aria-label when there is no title', () => {
    const { getByRole } = render(
      <InlineNotice aria-label="Annonce système">
        <span>Contenu</span>
      </InlineNotice>,
    )
    expect(getByRole('region', { name: 'Annonce système' })).toBeInTheDocument()
  })

  it('renders learn-more link when href is set', () => {
    const { container } = render(
      <InlineNotice learnMoreLabel="En savoir plus" learnMoreHref="https://example.com/help">
        Message
      </InlineNotice>,
    )
    const link = within(container).getByRole('link', { name: 'En savoir plus' })
    expect(link).toHaveAttribute('href', 'https://example.com/help')
  })

  it('calls onLearnMore when learn-more is a button', () => {
    const onLearnMore = vi.fn()
    const { container } = render(
      <InlineNotice learnMoreLabel="Pourquoi ?" onLearnMore={onLearnMore}>
        Message
      </InlineNotice>,
    )
    fireEvent.click(within(container).getByRole('button', { name: 'Pourquoi ?' }))
    expect(onLearnMore).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when dismiss control is used', () => {
    const onDismiss = vi.fn()
    const { container } = render(
      <InlineNotice title="Info" onDismiss={onDismiss} dismissLabel="Masquer">
        Corps
      </InlineNotice>,
    )
    fireEvent.click(within(container).getByRole('button', { name: 'Masquer' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('tone info utilise les classes sémantiques du thème', () => {
    const { container } = render(
      <InlineNotice tone="info" title="T" data-testid="inline-info">
        Corps
      </InlineNotice>,
    )
    const region = within(container).getByTestId('inline-info')
    expect(region.className).toMatch(/bg-info-bg/)
    expect(region.className).toMatch(/border-info-bd/)
  })
})
