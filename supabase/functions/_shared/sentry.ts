/**
 * Sentry pour Edge Functions (Deno). Optionnel : sans `SENTRY_DSN`, les appels sont no-op.
 *
 * @see https://supabase.com/docs/guides/functions/examples/sentry-monitoring
 * Scopes : `defaultIntegrations: false` + tags par requête (pas d’isolation native Deno.serve).
 */
import * as Sentry from 'npm:@sentry/deno@10.53.1'

let initAttempted = false
let sentryEnabled = false

function ensureSentryInit(): boolean {
  if (initAttempted) return sentryEnabled
  initAttempted = true
  const dsn = Deno.env.get('SENTRY_DSN')?.trim()
  if (!dsn) return false

  Sentry.init({
    dsn,
    environment: Deno.env.get('SENTRY_ENVIRONMENT')?.trim() || 'edge',
    defaultIntegrations: false,
    tracesSampleRate: 0,
  })
  sentryEnabled = true
  return true
}

/** Envoie l’exception à Sentry puis flush (important avant fin du worker Edge). */
export async function captureEdgeException(
  error: unknown,
  ctx: { function: string; extraTags?: Record<string, string> },
): Promise<void> {
  if (!ensureSentryInit()) return

  const tags: Record<string, string> = {
    edge_function: ctx.function,
    ...ctx.extraTags,
  }
  const region = Deno.env.get('SB_REGION')
  const executionId = Deno.env.get('SB_EXECUTION_ID')
  if (region) tags.sb_region = region
  if (executionId) tags.sb_execution_id = executionId

  Sentry.captureException(error, { tags })
  await Sentry.flush(2000)
}
