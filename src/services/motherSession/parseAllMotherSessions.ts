import type { MotherSession } from '../../types/motherSession'
import { parseMotherSession } from './parseMotherSession'

export interface MotherSessionInput {
  filePath: string
  markdown: string
}

export interface MotherSessionDataset {
  sessions: MotherSession[]
  /** Index par `metadata.id` (unique). */
  byId: Record<string, MotherSession>
}

function compareSessionIds(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
}

/**
 * Parse une liste de fichiers mother session (pur, sans accès filesystem).
 * Tri stable par `metadata.id`. Lève si deux sessions partagent le même id.
 */
export function parseAllMotherSessions(inputs: MotherSessionInput[]): MotherSessionDataset {
  const parsed = inputs.map(({ filePath, markdown }) => ({
    filePath,
    session: parseMotherSession(markdown, filePath),
  }))

  parsed.sort((x, y) => compareSessionIds(x.session.metadata.id, y.session.metadata.id))

  const idToPaths = new Map<string, string[]>()
  for (const { filePath, session } of parsed) {
    const id = session.metadata.id
    const list = idToPaths.get(id)
    if (list) list.push(filePath)
    else idToPaths.set(id, [filePath])
  }

  const duplicates = [...idToPaths.entries()].filter(([, paths]) => paths.length > 1)
  if (duplicates.length > 0) {
    const detail = duplicates
      .map(
        ([id, paths]) =>
          `  id "${id}" → ${paths.length} fichier(s) :\n${paths.map((p) => `    - ${p}`).join('\n')}`
      )
      .join('\n\n')
    throw new Error(
      `parseAllMotherSessions: IDs mother session dupliqués (${duplicates.length}).\n${detail}`
    )
  }

  const sessions = parsed.map((p) => p.session)
  const byId: Record<string, MotherSession> = {}
  for (const s of sessions) {
    byId[s.metadata.id] = s
  }

  return { sessions, byId }
}
