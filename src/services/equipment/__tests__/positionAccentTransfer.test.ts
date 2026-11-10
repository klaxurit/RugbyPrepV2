import { describe, expect, it } from 'vitest'
import {
  buildPositionAccentTransferLine,
  positionAccentPackDomain,
} from '../positionAccentTransfer'

describe('positionAccentTransfer', () => {
  it('extrait le domaine avant le tiret long', () => {
    expect(
      positionAccentPackDomain('Plaquage / ruck — pull+T Upper ; farmer+COD Lower'),
    ).toBe('Plaquage / ruck')
  })

  it('compose un transfer depuis les slots réellement choisis', () => {
    const pack = {
      transferFr: 'Plaquage / ruck — pull+T Upper ; farmer+COD Lower',
      transferEn: 'Tackle / ruck — pull+T Upper; farmer+COD Lower',
    }
    expect(
      buildPositionAccentTransferLine(
        pack,
        ['Push rotatif (T / archer)', 'Poigne / carry iso'],
        'fr',
      ),
    ).toBe('Plaquage / ruck — Push rotatif (T / archer) + Poigne / carry iso')
    expect(buildPositionAccentTransferLine(pack, [], 'fr')).toBe(pack.transferFr)
  })
})
