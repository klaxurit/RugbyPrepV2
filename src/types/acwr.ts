/**
 * Zones ACWR (Acute:Chronic Workload Ratio).
 *
 * Extrait de `useACWR` pour rester importable depuis des modules purs
 * (Edge Functions Deno, Vitest) sans tirer React.
 */
export type ACWRZone = 'underload' | 'optimal' | 'caution' | 'danger' | 'critical'
