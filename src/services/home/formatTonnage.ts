/**
 * Formate un tonnage en kg en notation compacte type fitness apps.
 *
 * Exemples :
 *   980    → "980 kg"
 *   1500   → "1.5K kg"
 *   12345  → "12K kg"
 *   123456 → "123K kg"
 *   1500000 → "1.5M kg"   (rare, mais cohérent)
 *
 * - Au-dessous de 1000 kg : valeur entière + " kg"
 * - 1K → 999K : 1 décimale si <10K, sinon entier
 * - >= 1M : décimale puis "M"
 */
export function formatTonnage(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) return '0 kg'
  if (kg < 1000) return `${Math.round(kg)} kg`
  if (kg < 1_000_000) {
    const k = kg / 1000
    if (k < 10) {
      // 1.0K → 9.9K (1 décimale)
      return `${k.toFixed(1).replace(/\.0$/, '')}K kg`
    }
    return `${Math.round(k)}K kg`
  }
  const m = kg / 1_000_000
  return `${m.toFixed(1).replace(/\.0$/, '')}M kg`
}
