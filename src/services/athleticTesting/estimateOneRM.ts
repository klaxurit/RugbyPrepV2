/**
 * Estime le 1RM à partir d'un poids soulevé sur N répétitions.
 *
 * Brzycki (1993) — recommandé pour 3–6 reps (zones force/puissance)
 *   1RM = poids / (1.0278 − 0.0278 × reps)
 *
 * Epley (1985) — valide pour 1–15 reps (zones hypertrophie)
 *   1RM = poids × (1 + 0.0333 × reps)
 *
 * Règle : si reps ≤ 6 → Brzycki par défaut, sinon Epley.
 * Éviter d'estimer au-delà de 15 reps (précision < 85%).
 */
export function estimateOneRM(
  loadKg: number,
  reps: number,
  formula?: 'brzycki' | 'epley'
): number {
  if (reps <= 0 || loadKg <= 0) return 0
  if (reps === 1) return loadKg

  const method = formula ?? (reps <= 6 ? 'brzycki' : 'epley')

  if (method === 'brzycki') {
    const denominator = 1.0278 - 0.0278 * reps
    if (denominator <= 0) return loadKg // sécurité pour reps > 36
    return Math.round(loadKg / denominator)
  }

  // Epley
  return Math.round(loadKg * (1 + 0.0333 * reps))
}
