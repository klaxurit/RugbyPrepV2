import clubFfrIds from '../../data/clubFfrIds.json'
import clubLogosAuto from '../../data/clubLogos.wikidata.json'
import clubLogosManual from '../../data/clubLogos.manual.json'

interface AutoLogoEntry {
  status?: string
  logoUrl?: string
}

interface AutoLogoDataset {
  logos?: Record<string, AutoLogoEntry>
}

const AUTO_LOGOS: Record<string, AutoLogoEntry> =
  ((clubLogosAuto as AutoLogoDataset).logos ?? {}) as Record<string, AutoLogoEntry>

const MANUAL_LOGOS: Record<string, string> = clubLogosManual as Record<string, string>
const FFR_IDS: Record<string, number> = clubFfrIds as Record<string, number>

const getFfrLogoUrl = (ffrClubId: number): string =>
  `https://api-agregateur.ffr.fr/assets/embleme/club/${ffrClubId}.jpg`

export const getClubLogoUrl = (clubCode?: string): string | null => {
  if (!clubCode) return null

  const normalizedCode = clubCode.toUpperCase()

  const manual = MANUAL_LOGOS[normalizedCode]
  if (typeof manual === 'string' && manual.length > 0) {
    return manual
  }

  const ffrId = FFR_IDS[normalizedCode]
  if (typeof ffrId === 'number' && Number.isFinite(ffrId)) {
    return getFfrLogoUrl(ffrId)
  }

  const auto = AUTO_LOGOS[normalizedCode]
  if (auto?.status === 'found' && typeof auto.logoUrl === 'string' && auto.logoUrl.length > 0) {
    return auto.logoUrl
  }

  return null
}

export const getClubMonogram = (clubName?: string): string => {
  if (!clubName) return 'RC'

  const tokens = clubName
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !['DE', 'DU', 'DES', 'LA', 'LE', 'LES', 'ET'].includes(token))

  if (tokens.length === 0) return 'RC'

  const first = tokens[0]?.[0] ?? ''
  const second = tokens[1]?.[0] ?? ''

  return `${first}${second}`.toUpperCase() || first.toUpperCase() || 'RC'
}
