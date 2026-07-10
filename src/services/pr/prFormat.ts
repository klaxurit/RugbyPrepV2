export function formatLoadKg(loadKg: number): string {
  const kg = Number.isInteger(loadKg) ? String(loadKg) : String(loadKg).replace(/\.0$/, '')
  return `${kg} kg`
}

export function formatLoadRepsLabel(loadKg: number, reps?: number): string {
  if (reps != null && reps > 0) {
    const kg = Number.isInteger(loadKg) ? String(loadKg) : String(loadKg).replace(/\.0$/, '')
    return `${kg} kg × ${reps}`
  }
  return formatLoadKg(loadKg)
}
