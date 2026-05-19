/** Postgres raise from grant_billing_entitlements when founding cohort is full (§2.1). */
export function isFoundingCohortFullError(rpcError: { message?: string; code?: string }): boolean {
  const msg = rpcError.message ?? ''
  return msg.includes('founding_cohort_full') || (rpcError.code === 'P0001' && msg.includes('founding_cohort'))
}
