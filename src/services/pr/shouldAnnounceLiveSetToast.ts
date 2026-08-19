/**
 * Une popup record / vs-dernière par exo et par séance.
 * On ne re-célèbre pas les séries suivantes à charge égale ou inférieure.
 * Une charge plus lourde plus tard dans la séance = nouveau record, nouveau toast.
 */
export function shouldAnnounceLiveSetToast(
  loadKg: number | null | undefined,
  alreadyAnnouncedKg: number | null | undefined,
): boolean {
  if (loadKg == null || loadKg <= 0) return false
  if (alreadyAnnouncedKg == null) return true
  return loadKg > alreadyAnnouncedKg
}
