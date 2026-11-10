/**
 * Date du tampon RECORD Claude Design : « DD · MM · YY ».
 */
export function formatShareStampDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim())
  if (!m) return null
  return `${m[3]} · ${m[2]} · ${m[1]!.slice(2)}`
}
