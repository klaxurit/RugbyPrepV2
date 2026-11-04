# Product analytics — RugbyForge

Source de vérité pour l’instrumentation. Modifier ici **avant** d’ajouter un event
dans le code.

## Définition d’activation (figée)

Un utilisateur est **activé (fenêtre)** s’il a au moins un `session_logs` dans les
**7 jours** suivant `profiles.created_at`.

- KPI admin : `activated_within_7d` / `onboarded_total`
- KPI « jamais entraîné » : onboardé + 0 log (hors fenêtre)
- Ne pas renommer sans bump `PRODUCT_ANALYTICS_SCHEMA_VERSION` et note ici

## Funnel canonique

1. `signup_completed`
2. `onboarding_step` (`n`)
3. `onboarding_completed`
4. `session_started`
5. `session_completed` → derive `first_session_completed`
6. 2ᵉ `session_completed` (rétention)

Fenêtre funnel PostHog conseillée : 14 jours, ordre séquentiel.

## Events cœur (product)

| Event | Quand | Props clés |
| --- | --- | --- |
| `signup_completed` | compte créé | attribution |
| `onboarding_step` | step affiché | `n` |
| `onboarding_completed` | profil onboardé persisté | niveau, matos… |
| `session_viewed` | ouverture fiche | `index` |
| `session_started` | run lancé | `index`, `sessionId` |
| `session_abandoned` | quit mid-run | `index`, `reason` |
| `friction_feedback` | réponse survey friction | `trigger`, `reason`, `note?` |
| `session_completed` | log persisté | `index`, type… |
| `first_session_completed` | 1er log (once) | attribution |

Landing / pricing / stores restent dans `activationEvents.ts` (acquisition).

## Où lire quoi

| Question | Source |
| --- | --- |
| Combien décrochent ? | `/admin/insights` (SQL first-party) |
| Pourquoi UX ? | PostHog session replay + `friction_feedback` |
| Acquisition landing | PostHog events `landing_*` / `app_first_open` |

Projet PostHog EU : voir lien dans `AdminInsightsPage` — filtrer les events
RugbyForge ; le projet peut contenir d’autres surfaces.

## Règles

- Faits persistés, pas clics décoratifs (`session_completed` ≠ bouton Finish)
- Pas de poids, notes médicales, free-text profil dans les props PostHog
- Consentement cookies obligatoire (`cookieConsent.ts`) avant init
- Nouveaux events : ajouter au tableau ci-dessus + `productTaxonomy.ts`
