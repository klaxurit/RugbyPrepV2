/**
 * Transforme les agrégats SQL admin en lectures actionnables
 * (« qu’est-ce qui décourage ? »), sans inventer de causalités médicales.
 */

export interface ProductInsightsFunnel {
  profiles_total: number
  signups_window: number
  onboarded_total: number
  onboarded_window: number
  activated_total: number
  activated_window: number
  onboarded_never_trained: number
  one_and_done: number
  returned_at_least_once: number
  active_7d: number
  active_28d: number
  dormant_14d: number
  avg_hours_to_first_session: number | null
}

export interface ProductInsightsPayload {
  windowDays: number
  generatedAt: string
  funnel: ProductInsightsFunnel
  breakdowns: {
    equipmentOnboarded: Record<string, number>
    equipmentActivated: Record<string, number>
    trainingLevelOnboarded: Record<string, number>
    trainingLevelActivated: Record<string, number>
    weeklySessionsTarget: Record<string, number>
    positionOnboarded: Record<string, number>
    sessionTypesWindow: Record<string, number>
  }
  series: {
    signupsByDay: Array<{ day: string; n: number }>
    firstSessionsByDay: Array<{ day: string; n: number }>
  }
}

export type InsightSeverity = 'critical' | 'watch' | 'ok'

export interface ProductInsightFinding {
  id: string
  severity: InsightSeverity
  title: string
  detail: string
  /** Zone produit suspectée. */
  area: 'onboarding' | 'activation' | 'retention' | 'program' | 'ux'
}

function pct(num: number, den: number): number | null {
  if (den <= 0) return null
  return Math.round((1000 * num) / den) / 10
}

function rateLabel(num: number, den: number): string {
  const p = pct(num, den)
  if (p == null) return 'n/a'
  return `${p}% (${num}/${den})`
}

function worstActivationGap(
  onboarded: Record<string, number>,
  activated: Record<string, number>,
): { key: string; onboarded: number; activated: number; rate: number } | null {
  let worst: { key: string; onboarded: number; activated: number; rate: number } | null = null
  for (const [key, nOn] of Object.entries(onboarded)) {
    if (nOn < 5) continue
    const nAct = activated[key] ?? 0
    const rate = nAct / nOn
    if (!worst || rate < worst.rate) {
      worst = { key, onboarded: nOn, activated: nAct, rate }
    }
  }
  return worst
}

/** Produit les findings classés par sévérité (critique d’abord). */
export function interpretProductInsights(data: ProductInsightsPayload): ProductInsightFinding[] {
  const f = data.funnel
  const findings: ProductInsightFinding[] = []

  const onboardRate = pct(f.onboarded_total, f.profiles_total)
  if (onboardRate != null && onboardRate < 45) {
    findings.push({
      id: 'onboarding-drop',
      severity: 'critical',
      area: 'onboarding',
      title: 'Fuite forte avant fin d’onboarding',
      detail: `Seulement ${rateLabel(f.onboarded_total, f.profiles_total)} des comptes ont terminé l’onboarding. Suspect : friction étapes (poste / matos / niveau) ou abandon post-signup.`,
    })
  } else if (onboardRate != null && onboardRate < 65) {
    findings.push({
      id: 'onboarding-soft',
      severity: 'watch',
      area: 'onboarding',
      title: 'Onboarding encore poreux',
      detail: `${rateLabel(f.onboarded_total, f.profiles_total)} terminent l’onboarding. Surveiller les steps PostHog \`onboarding_step_completed\`.`,
    })
  }

  const activateFromOnboard = pct(f.activated_total, f.onboarded_total)
  if (activateFromOnboard != null && activateFromOnboard < 50) {
    findings.push({
      id: 'activation-gap',
      severity: 'critical',
      area: 'activation',
      title: 'Onboardés qui ne lancent jamais une séance',
      detail: `${rateLabel(f.activated_total, f.onboarded_total)} des onboardés ont au moins 1 log. ${f.onboarded_never_trained} comptes restent à 0 séance — friction programme / UI séance / peur de la charge plus probable qu’un bug signup.`,
    })
  }

  if (f.one_and_done >= 5 && f.one_and_done >= f.returned_at_least_once) {
    findings.push({
      id: 'one-and-done',
      severity: 'critical',
      area: 'retention',
      title: 'Beaucoup de one-and-done',
      detail: `${f.one_and_done} athlètes n’ont fait qu’une seule séance vs ${f.returned_at_least_once} qui sont revenus. Suspect : première séance trop dure, matos mal calibré, ou manque de feedback Weakley / clarté du plan.`,
    })
  }

  if (f.dormant_14d >= 8) {
    findings.push({
      id: 'dormant',
      severity: 'watch',
      area: 'retention',
      title: 'Dormants après activation',
      detail: `${f.dormant_14d} athlètes ont déjà logué mais rien depuis ≥ 14 j. Actifs 7 j : ${f.active_7d}. Relances / ligue / pause Blessé à croiser.`,
    })
  }

  if (f.avg_hours_to_first_session != null && f.avg_hours_to_first_session > 72) {
    findings.push({
      id: 'slow-first-session',
      severity: 'watch',
      area: 'activation',
      title: 'Première séance trop tardive',
      detail: `Délai moyen signup → 1ʳᵉ séance : ~${Math.round(f.avg_hours_to_first_session)} h. Objectif produit : première séance le jour J (CTA Accueil / Semaine).`,
    })
  }

  const equipGap = worstActivationGap(
    data.breakdowns.equipmentOnboarded,
    data.breakdowns.equipmentActivated,
  )
  if (equipGap && equipGap.rate < 0.45) {
    findings.push({
      id: 'equipment-friction',
      severity: 'watch',
      area: 'program',
      title: `Activation faible — matos « ${equipGap.key} »`,
      detail: `${rateLabel(equipGap.activated, equipGap.onboarded)} activés dans ce bucket. Comparer le ressenti BW vs salle (accents, durée, exos).`,
    })
  }

  const levelGap = worstActivationGap(
    data.breakdowns.trainingLevelOnboarded,
    data.breakdowns.trainingLevelActivated,
  )
  if (levelGap && levelGap.rate < 0.45) {
    findings.push({
      id: 'level-friction',
      severity: 'watch',
      area: 'program',
      title: `Activation faible — niveau « ${levelGap.key} »`,
      detail: `${rateLabel(levelGap.activated, levelGap.onboarded)}. Possible sous/surdosage perçu pour ce palier.`,
    })
  }

  if (findings.length === 0) {
    findings.push({
      id: 'healthy',
      severity: 'ok',
      area: 'ux',
      title: 'Pas d’alarme majeure sur la fenêtre',
      detail: `Actifs 7 j : ${f.active_7d} · activés : ${f.activated_total} · onboardés : ${f.onboarded_total}. Continuer à croiser avec PostHog (funnels steps + rageclicks).`,
    })
  }

  const order: Record<InsightSeverity, number> = { critical: 0, watch: 1, ok: 2 }
  return findings.sort((a, b) => order[a.severity] - order[b.severity])
}

export function funnelRateCards(funnel: ProductInsightsFunnel): Array<{
  label: string
  value: string
  hint: string
}> {
  return [
    {
      label: 'Comptes',
      value: String(funnel.profiles_total),
      hint: `+${funnel.signups_window} sur la fenêtre`,
    },
    {
      label: 'Onboarding',
      value: rateLabel(funnel.onboarded_total, funnel.profiles_total),
      hint: `${funnel.onboarded_window} dans la fenêtre`,
    },
    {
      label: '1ʳᵉ séance',
      value: rateLabel(funnel.activated_total, funnel.onboarded_total),
      hint: `${funnel.onboarded_never_trained} jamais entraînés`,
    },
    {
      label: 'Retour ≥2',
      value: rateLabel(funnel.returned_at_least_once, funnel.activated_total),
      hint: `${funnel.one_and_done} one-and-done`,
    },
    {
      label: 'Actifs 7 j',
      value: String(funnel.active_7d),
      hint: `${funnel.active_28d} sur 28 j`,
    },
    {
      label: 'Délai 1ʳᵉ séance',
      value:
        funnel.avg_hours_to_first_session == null
          ? '—'
          : `${Math.round(funnel.avg_hours_to_first_session)} h`,
      hint: 'moyenne signup → 1er log',
    },
  ]
}
