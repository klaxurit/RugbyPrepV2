---
title: 'Plan rollout beta self-serve conditionnelle'
slug: 'rollout-beta-self-serve'
created: '2026-03-13'
updated: '2026-03-13'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack: ['React 19', 'Vite', 'TypeScript', 'Supabase', 'PostHog']
files_modified:
  - 'src/services/betaEligibility.ts (BETA_PAUSED + message UX OFF_SEASON)'
  - 'src/services/betaEligibility.test.ts (+1 test BETA_PAUSED)'
  - 'src/pages/MobilityPage.tsx (guard beta ajouté + feedback link)'
  - 'src/pages/__tests__/WeekPage.integration.test.tsx (assertion mise à jour)'
  - 'src/pages/OnboardingPage.tsx (cap technique 100 users)'
  - 'src/pages/ProfilePage.tsx (href feedback standardisé)'
  - 'src/pages/WeekPage.tsx (feedback link dans guard)'
  - 'src/pages/SessionDetailPage.tsx (feedback link dans guard)'
  - 'src/pages/ProgramPage.tsx (feedback link dans guard)'
  - 'src/pages/LegalPage.tsx (données santé, mineurs, suppression)'
files_to_modify: []
code_patterns: ['checkBetaEligibility centralisé', 'guard early return', 'posthog.capture useEffect', 'BETA_PAUSED kill switch']
test_patterns: ['betaEligibility.test.ts (26 tests)', 'WeekPage.integration.test.tsx']
review_notes: |
  Adversarial review (Step 5) produit 14 findings.
  Auto-fix conservateur appliqué — code: F1 (BETA_PAUSED), F6 (message UX), F11 (MobilityPage guard).
  Plan mis à jour pour F2 (cap technique), F3 (backup kill switch), F4 (monitoring erreurs),
  F5 (href feedback), F8 (rollback sans perte guards), F9 (privacy/GDPR),
  F10 (seuils heuristiques), F12 (frontmatter), F13 (communication users bloqués).
  418/418 tests, build SUCCESS.
---

# Tech-Spec: Plan rollout beta self-serve conditionnelle

**Created:** 2026-03-13
**Updated:** 2026-03-13 (post adversarial review — auto-fix conservateur)

## Overview

### Problem Statement

Le GO self-serve conditionnel est validé techniquement (guards en place sur les 4 surfaces programme, 418/418 tests, gel moteur intact). Mais il n'existe pas de plan opérationnel structuré pour le lancement : cap utilisateurs, canaux feedback, routine monitoring, conditions de pause/rollback.

### Solution

Plan de rollout en 7 sections : executive decision, périmètre exact, checklist pré-lancement, monitoring semaine 1, backlog stabilisation, conditions pause/rollback, recommandation PO/dev. Aucune réouverture moteur.

### Scope

**In Scope:**
- Périmètre beta exact (inclus / exclus / surveillés) basé sur la décision finale
- Checklist pré-lancement bloquante (canal feedback externe, cap 100 users technique, dashboard PostHog)
- Routine monitoring quotidien semaine 1 avec seuils de pause
- Backlog de stabilisation post-lancement (feedback in-app, alerting auto, tests intégration)
- Conditions de pause / rollback explicites
- Minimum privacy/compliance (données de santé + mineurs)

**Out of Scope:**
- Réouverture du moteur
- Feedback form in-app (backlog, pas bloquant)
- Alerting automatique PostHog (backlog)
- Extension au-delà du cap 100 (décision post-semaine 1)

---

## 1. Executive Decision

**LANCEMENT BETA SELF-SERVE CONDITIONNELLE — GO**

Le produit passe de « beta fermée / recrutement manuel » à « beta self-serve conditionnelle » :

| Dimension | Beta fermée (avant) | Self-serve conditionnel (maintenant) |
|---|---|---|
| **Inscription** | PO recrute et vérifie chaque profil | Inscription libre, le guard filtre automatiquement |
| **Garde-fou** | PO = garde-fou humain | Code = garde-fou structurel (`checkBetaEligibility`) |
| **Volume** | ~50 users recrutés manuellement | Cap 100 users éligibles (technique + opérationnel), revue semaine 1 |
| **Périmètre** | Identique | Identique — `in_season` only, exclusions inchangées |
| **Feedback** | Canal beta informel | Canal feedback explicite et monitoré |
| **Rollback** | Arrêt recrutement | Kill switch code `BETA_PAUSED` (1 ligne) + deploy |

**Soft launch :** Dès que la checklist pré-lancement est cochée. Pas de date arbitraire.

**Conditions de validité de ce GO :** Les Tasks 7 (cap technique) et 8 (href feedback) de la checklist sont **bloquants**. Si Task 7 n'est pas implémentée avant le lancement, le verdict revient à « GO beta fermée / recrutement contrôlé, self-serve différé ».

---

## 2. Périmètre Beta Exact

### Profils inclus (cohorte principale)

| Profil | Niveau | Équipement | Score validation | Conditions |
|---|---|---|---|---|
| Senior H sain | starter | bands / dumbbells | 72-74 | `in_season`, pas de blessure |
| Senior H sain | builder | dumbbells / barbell / bench | 78-82 | `in_season`, pas de blessure |
| Senior H sain | performance | full gym | 85-90 | `in_season`, DUP, pas de blessure |
| Senior F saine | tous | tous | 85-88 | `in_season`, ACL prehab auto |
| U18 sain (H/F) | starter | tous | 70-72 | `in_season`, `parentalConsentHealthData: true` |

### Profils inclus mais surveillés (blessure simple)

| Profil | Blessure | Score | Condition |
|---|---|---|---|
| Starter / builder | `knee_pain` seul | 65-68 | Le guard laisse passer. Feedback séance par séance. |
| Starter / builder | `low_back_pain` seul | 60-70 | Le guard laisse passer. Feedback séance par séance. |

**Règle :** 1 seule blessure non-shoulder à la fois. Si 2e blessure → `MULTI_INJURIES` → bloqué par le guard automatiquement.

### Profils exclus (bloqués par le guard)

| Raison guard | Profils concernés | Comportement |
|---|---|---|
| `BETA_PAUSED` | Tous (kill switch activé) | UI blocage : « Programme temporairement indisponible — maintenance » |
| `SHOULDER_PAIN` | Tout profil avec `shoulder_pain` + barbell | UI blocage + lien `/profile` |
| `SHOULDER_PAIN_LIMITED_GYM` | `shoulder_pain` + sans barbell (BW inclus) | UI blocage + lien `/profile` |
| `REHAB_ACTIVE` | Tout profil avec `rehabInjury` défini | UI blocage + lien `/profile` |
| `MULTI_INJURIES` | ≥2 blessures hors `shoulder_pain` | UI blocage + lien `/profile` |
| `OFF_SEASON_NOT_SUPPORTED` | `seasonMode` ≠ `'in_season'` (y compris `undefined`) | UI blocage + lien `/profile` |
| `U18_NO_CONSENT` | `ageBand` ≠ `'adult'` sans `parentalConsentHealthData: true` | UI blocage + lien `/profile` |

**Surfaces protégées (4 guards bloquants) :** WeekPage, SessionDetailPage, ProgramPage, MobilityPage.

**Surfaces informatives :** ProfilePage (banner), OnboardingPage (warning non-bloquant).

### Communication pour les utilisateurs bloqués post-onboarding

Un utilisateur peut s'inscrire, compléter l'onboarding avec un profil éligible, puis modifier son profil vers un état inéligible (ex: ajouter `shoulder_pain`). Le guard bloque immédiatement l'accès programme avec :

1. **Message clair** : raison du blocage + détail (via `BETA_ELIGIBILITY_MESSAGES`)
2. **CTA** : lien vers `/profile` pour modifier le profil et revenir dans le périmètre
3. **Assurance** : « Ton compte et ton profil sont conservés »
4. **Feedback** : lien vers le canal feedback externe (Discord/formulaire) — ajouté dans le guard UI (Task 8)

Pas de notification push ni d'email automatique pour les blocages — le guard UI est suffisant car l'utilisateur découvre le blocage au moment où il tente d'accéder au programme.

---

## 3. Checklist Pré-Lancement

### Bloquant — Doit être coché avant activation

- [ ] **Task 7 : Cap 100 technique** — Mécanisme Supabase qui empêche les nouvelles inscriptions au-delà de 100 profils onboardés. Voir détail Task 7 ci-dessous. **Sans ce mécanisme, le verdict revient à "beta fermée".**
- [ ] **Canal feedback actif (Task 1)** — Au moins 1 canal monitoré :
  - Option A : Discord privé `#beta-feedback` avec invitation dans le guard UI ou l'onboarding
  - Option B : Formulaire externe (Google Form / Tally) avec lien visible dans l'app
  - Le canal doit être vérifié quotidiennement en semaine 1
- [ ] **Dashboard PostHog configuré (Task 2)** — Tableau de bord avec les métriques suivantes :
  - Funnel : `signup_completed` → `onboarding_completed` → `week_viewed` → `session_logged`
  - Compteur distinct users `onboarding_completed` (= proxy du cap 100)
  - Breakdown `beta_eligibility_blocked` par `primaryReason` et `surface`
  - Rétention J1/J3/J7 sur `week_viewed`
- [ ] **Kill switch documenté et testé (Task 3)** — Procédure de pause testée (voir §6) :
  - **Owner principal :** Le dev exécute le kill switch (modification code + deploy). Le PO décide.
  - **Backup :** Le PO doit pouvoir activer le kill switch en autonomie en cas d'indisponibilité dev. Procédure documentée : décommenter la ligne dans `betaEligibility.ts`, commit, push. Le PO doit avoir testé cette procédure en local avant le lancement.
  - **Mécanisme :** Décommenter `return { isEligible: false, primaryReason: 'BETA_PAUSED', reasons: ['BETA_PAUSED'] }` en L86-87 de `betaEligibility.ts` + commit + push → Cloudflare Pages rebuild.
  - **Message affiché :** « Programme temporairement indisponible — L'accès au programme est temporairement suspendu pour maintenance. Ton compte et ton profil sont conservés. Réessaie dans quelques heures. »
  - **Délai d'effet :** ~2-5 min (push git → build Cloudflare → CDN invalidation). Les utilisateurs déjà sur la page ne sont pas coupés immédiatement — le guard s'applique au prochain chargement de page.
  - **Portée :** Le kill switch coupe l'accès aux pages programme (WeekPage, SessionDetailPage, ProgramPage, MobilityPage) pour **TOUS les utilisateurs**, y compris les profils déjà actifs. Le reste du produit (profil, historique, calendrier, chat IA) reste accessible.
  - **Conditions d'activation :** voir §6 (bug safety, crash, guard contourné)
- [ ] **Lien feedback visible dans l'app (Task 8)** — Mettre à jour le `href` du bouton feedback dans ProfilePage (L1477) pour pointer vers le canal créé en Task 1. Ajouter un lien feedback dans le guard de blocage des 4 surfaces protégées (« Un souci ? Contacte-nous → [lien] »).
- [ ] **Tests verts** — `npm run test` → 418/418 ✅, `npm run build` → SUCCESS
- [ ] **Privacy/compliance minimum (Task 9)** — Voir section dédiée §8

### Non-bloquant — Backlog semaine 1

- [ ] Formulaire feedback in-app (question post-séance)
- [ ] Alerting PostHog automatique (webhook Slack)
- [ ] Tests d'intégration SessionDetailPage / ProgramPage / MobilityPage (chemin inéligible)
- [ ] Analytics onboarding (`surface: 'onboarding'` dans `posthog.capture`)

---

## 4. Monitoring Semaine 1

### Routine quotidienne (J1 à J7)

| Heure | Action | Responsable | Outil |
|---|---|---|---|
| Matin | Vérifier le canal feedback (Discord/formulaire) | PO | Discord / Tally |
| Matin | Consulter le dashboard PostHog (5 min) | PO ou Dev | PostHog |
| Soir J1/J3/J7 | Point rapide PO↔Dev (10 min) | Les deux | Slack / Discord |

### Monitoring des erreurs

**Sentry :** Non actif actuellement. Le monitoring des erreurs runtime repose sur :
1. **PostHog** : events `beta_eligibility_blocked` avec breakdown par raison/surface = proxy pour détecter les anomalies
2. **Canal feedback** : les utilisateurs remontent les bugs via Discord/formulaire
3. **Cloudflare Pages** : logs de build/deploy visibles dans le dashboard Cloudflare

**Limitation reconnue :** Sans Sentry, les erreurs JavaScript silencieuses (ex: `buildWeekProgram` qui throw sans être catchée) ne sont pas détectées automatiquement. Le risque est mitigé par :
- Les guards empêchent l'appel à `buildWeekProgram` pour les profils inéligibles
- Les 418 tests couvrent les chemins critiques
- Le feedback utilisateur remonte les problèmes visibles

**Backlog P1 :** Installer Sentry (ou équivalent) avant l'extension au-delà de 100 users.

### Métriques à surveiller

> **Note :** Les seuils ci-dessous sont des heuristiques initiales, pas des baselines validées par des données historiques. Ils seront affinés après J3/J7 à mesure que les données réelles arrivent. L'objectif est de fournir un cadre de décision, pas des règles automatiques.

| Métrique | Source PostHog | Seuil normal (estimé) | Seuil d'investigation | Seuil de pause |
|---|---|---|---|---|
| **Inscriptions cumulées** | `onboarding_completed` (distinct) | 5-15/jour | >25/jour (cap atteint trop vite) | ≥100 → cap technique bloque |
| **Taux de blocage** | `beta_eligibility_blocked` / `week_viewed` | <20% | >40% (profils mal filtrés à l'onboarding) | >60% (expérience dégradée) |
| **Raisons de blocage** | `beta_eligibility_blocked` breakdown `primaryReason` | Distribution stable | Raison inattendue en majorité | — |
| **Engagement J1** | `session_logged` / `onboarding_completed` (J+1) | >30% | <15% | <5% |
| **Rétention J3** | `week_viewed` J3 / `onboarding_completed` | >50% | <25% | — |
| **Feedback négatif qualité** | Canal feedback | 0-1/jour | ≥3 feedbacks négatifs même profil type | ≥5 « séances inadaptées » |
| **Bugs / crashes** | Canal feedback + PostHog anomalies | 0 | 1 bug confirmé | 1 bug safety (exercice CI) |

### Points de décision semaine 1

| Jour | Décision | Critère |
|---|---|---|
| **J3** | Continuer / ajuster ? | Engagement >15%, 0 bug safety, feedback neutre ou positif |
| **J7** | Lever le cap / maintenir / pause ? | Rétention >25%, <3 feedbacks négatifs même profil, 0 bug safety |
| **J7** | Ouvrir le backlog post-lancement ? | Si signaux bons → prioriser feedback in-app + alerting auto + Sentry |

---

## 5. Backlog de Stabilisation Post-Lancement

### P1 — Semaine 1-2 (si signaux positifs)

| Item | Type | Justification |
|---|---|---|
| **Formulaire feedback in-app** | UX | Question post-séance : « Séance adaptée ? oui/non + commentaire ». Remplace le feedback canal externe à terme. |
| **Analytics onboarding** | Code | `posthog.capture('beta_eligibility_blocked', { surface: 'onboarding' })` dans OnboardingPage step 6. Complète le funnel. |
| **Sentry (ou équivalent)** | Infra | Monitoring erreurs runtime. Requis avant extension au-delà de 100 users. |

### P2 — Semaine 2-4

| Item | Type | Justification |
|---|---|---|
| **Alerting PostHog automatique** | Infra | Webhook Slack si `beta_eligibility_blocked` >X/jour ou si `session_logged` =0 pendant 48h. |
| **Tests intégration SessionDetailPage + ProgramPage + MobilityPage** | Test | Chemin inéligible testé en intégration, pas seulement via la logique centralisée. |
| **CTA adapté par raison** | UX | « Modifier mon profil » pour off_season, « Contacter un coach » pour rehab/multi-blessures. |

### P3 — Post-semaine 4 (décision séparée)

| Item | Type | Condition |
|---|---|---|
| **Extension cap** | Opérationnel | Si rétention >25% et <5 feedbacks négatifs qualité → lever à 250, puis 500. Requiert Sentry actif. |
| **Ouverture off_season / pre_season** | Moteur | Nécessite validation des recettes off/pre-season + réouverture moteur formelle |
| **Feedback form riche** | UX/Premium | RPE + difficulté perçue + commentaire libre → données pour amélioration contenu |

---

## 6. Conditions de Pause / Rollback

### Pause immédiate (< 1h)

| Signal | Action | Qui |
|---|---|---|
| **Bug safety** : exercice contre-indiqué livré à un joueur blessé | Kill switch `BETA_PAUSED` + deploy immédiat | Dev (ou PO en backup) |
| **Crash** : `buildWeekProgram` retourne 0 sessions pour un profil éligible | Kill switch + investigation | Dev |
| **Guard contourné** : un profil inéligible obtient un programme | Kill switch + audit routes | Dev |

**Procédure kill switch :**

```typescript
// src/services/betaEligibility.ts — L86-87
export function checkBetaEligibility(profile: UserProfile): BetaEligibilityResult {
  // ── KILL_SWITCH ── Décommenter pour pause immédiate beta self-serve ──────
  return { isEligible: false, primaryReason: 'BETA_PAUSED', reasons: ['BETA_PAUSED'] }
  // ─────────────────────────────────────────────────────────────────────────
  // ... reste du code
}
```

Deploy via `git commit` + push → Cloudflare Pages rebuild (~2-5 min).

**Message affiché aux utilisateurs :** « Programme temporairement indisponible — L'accès au programme est temporairement suspendu pour maintenance. Ton compte et ton profil sont conservés. Réessaie dans quelques heures. »

**Portée du kill switch :** Coupe l'accès aux pages programme (WeekPage, SessionDetailPage, ProgramPage, MobilityPage) pour tous les utilisateurs. Le reste du produit (profil, historique, calendrier, chat IA) reste accessible.

**Opérateurs autorisés :**
- **Principal :** Dev — modifie le code, commit, push
- **Backup :** PO — même procédure. Le PO doit avoir testé la procédure en local (Task 3) et avoir les droits push sur le repo.

### Pause réfléchie (< 24h)

| Signal | Action | Qui |
|---|---|---|
| ≥5 feedbacks négatifs explicites « séances inadaptées » pour un même profil type | Exclure le profil type (ajout règle `betaEligibility`) + communication canal beta | PO + Dev |
| Taux de blocage >60% | Investiguer — profils mal renseignés à l'onboarding ? Bug `rowToProfile` ? | Dev |
| Cap 100 atteint | Le mécanisme technique bloque les nouvelles inscriptions. PO décide : lever le cap ou maintenir. | PO |

### Rollback

| Scénario | Action | Durée |
|---|---|---|
| **Retour beta fermée** | Kill switch `BETA_PAUSED` + communication canal beta + PO reprend le recrutement manuel | ~30 min |
| **Retour pré-guard (urgence extrême)** | Créer un commit de revert ciblé sur les fichiers problématiques. **NE PAS revert au tag `v2.0-engine-freeze`** — ce tag est antérieur aux guards. Un revert au tag supprimerait les protections `checkBetaEligibility` et `BETA_PAUSED`, ce qui est pire que le problème initial. Procédure : `git revert <commit(s) problématiques>` + push. | ~30 min |

**Pourquoi pas revert au tag `v2.0-engine-freeze` :**
Le tag freeze date d'avant l'implémentation des guards. Un revert à ce tag supprimerait :
- `checkBetaEligibility` et tous les guards sur les 4 surfaces
- Le kill switch `BETA_PAUSED`
- Les messages UX pour les profils inéligibles
- La protection MobilityPage

Ce serait un rollback destructif qui rendrait le produit *moins* sûr, pas plus. En cas d'urgence, le kill switch `BETA_PAUSED` suffit à couper l'accès programme en 2-5 min.

### Règle d'or

> **Un seul bug safety confirmé = pause immédiate, pas de discussion.**
> Le kill switch est une ligne de code. Le redeploy prend 2 min. Le coût de la pause est quasi nul. Le coût d'un exercice contre-indiqué livré est inacceptable.

---

## 7. Recommandation PO / Dev

### Pour le PO

1. **Lance le soft launch dès que la checklist §3 est cochée.** Les guards sont structurels — tu n'es plus le seul garde-fou.
2. **Crée le canal feedback aujourd'hui.** C'est le seul item bloquant qui dépend de toi. Discord privé `#beta-feedback` = 5 minutes.
3. **Vérifie le compteur d'inscriptions chaque matin semaine 1.** Dashboard PostHog + requête Supabase. Le cap technique bloque les nouvelles inscriptions mais vérifie que ça fonctionne.
4. **Apprends à activer le kill switch.** Tu es le backup du dev. Teste la procédure en local avant le lancement.
5. **Ne traite pas les feedbacks comme des bugs.** « Séance trop facile » = enrichissement contenu (blocs JSON). « Exercice douloureux » = audit CI immédiat.
6. **Planifie la revue J7.** C'est là que tu décides : continuer / ajuster / étendre / pauser. Avec des données réelles, pas des hypothèses.

### Pour le dev

1. **Implémente le cap technique (Task 7) avant le lancement.** C'est bloquant pour le GO self-serve.
2. **Teste le kill switch avant le lancement.** Décommenter la ligne `BETA_PAUSED`, build, vérifier que les 4 pages montrent le guard avec le bon message, recommenter, rebuild.
3. **Configure le dashboard PostHog avant le lancement.** C'est bloquant. Les events sont déjà là — il faut juste les assembler en tableau de bord.
4. **Mets à jour le href feedback (Task 8).** Le bouton dans ProfilePage et un lien dans les guards de blocage.
5. **Ne touche pas au moteur.** Si un feedback pointe vers un problème de programme, la réponse est dans `blocks.v1.json` ou `exercices.v1.json`, pas dans `src/services/program/`.
6. **Documente tout incident.** Chaque pause, chaque bug, chaque feedback négatif = une entrée dans le canal beta avec la résolution.

---

## 8. Privacy / Compliance Minimum

### Données de santé

L'application collecte et traite des données sensibles :
- **Blessures** : `injuries[]` (knee_pain, shoulder_pain, low_back_pain, etc.)
- **Programme de réhabilitation** : `rehabInjury` (zone, phase, dates)
- **Âge** : `ageBand` (u18 / adult)
- **Consentement parental** : `parentalConsentHealthData` (pour les U18)

**Mesures en place :**
- Données stockées dans Supabase avec RLS (Row Level Security) — chaque utilisateur ne voit que ses propres données
- Auth via Supabase Auth (email/password)
- Pas de partage de données avec des tiers (PostHog = analytics agrégés, pas de données de santé individuelles)
- `person_profiles: 'identified_only'` dans PostHog — seuls les utilisateurs identifiés sont profilés

**Actions requises avant lancement :**
- [ ] **Mentions légales / CGU** : Vérifier que les CGU couvrent la collecte de données de santé (blessures, rehab) et le traitement des données de mineurs (U18). Si les CGU n'existent pas encore, créer une page `/legal` avec a minima :
  - Nature des données collectées (blessures, âge, programme d'entraînement)
  - Finalité du traitement (personnalisation du programme)
  - Hébergement (Supabase, région UE)
  - Droits de l'utilisateur (accès, rectification, suppression)
  - Contact DPO / responsable
- [ ] **Consentement éclairé U18** : Le champ `parentalConsentHealthData` existe mais vérifier que le flow d'onboarding explique clairement ce que le consentement couvre (données de santé, pas juste "utilisation de l'app")
- [ ] **Droit à la suppression** : Vérifier que la suppression du compte Supabase supprime bien toutes les données associées (profil, logs, tests, calendrier) via cascade SQL

**Limitation reconnue :** Ceci est un minimum viable, pas un audit GDPR complet. Un audit formel est recommandé avant l'extension au-delà de 100 users ou avant toute monétisation.

---

## Context for Development

### Codebase Patterns

- Guard centralisé `checkBetaEligibility` consommé par 6 surfaces (4 guards bloquants + 1 banner + 1 warning)
- Analytics via `posthog.capture('beta_eligibility_blocked', { surface, primaryReason, reasons })` dans `useEffect`
- Kill switch via `BETA_PAUSED` — message UX dédié « maintenance »
- Gel moteur : `src/services/program/` (11 fichiers) + `src/data/sessionRecipes.v1.ts`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/services/betaEligibility.ts` | Logique centralisée d'éligibilité — kill switch L86-87 (`BETA_PAUSED`) |
| `src/services/betaEligibility.test.ts` | 26 tests éligibilité (dont BETA_PAUSED) |
| `src/pages/WeekPage.tsx` | Guard bloquant + analytics |
| `src/pages/SessionDetailPage.tsx` | Guard bloquant + analytics |
| `src/pages/ProgramPage.tsx` | Guard bloquant + analytics |
| `src/pages/MobilityPage.tsx` | Guard bloquant + analytics (ajouté post-review) |
| `src/pages/ProfilePage.tsx` | Banner informatif + bouton feedback |
| `src/pages/__tests__/WeekPage.integration.test.tsx` | Test intégration guard inéligible |
| `src/hooks/useProfile.ts` | DEFAULT_PROFILE avec `seasonMode: 'in_season'` |

### Technical Decisions

- Cap 100 users = **technique** (Supabase RPC vérifie le compteur au moment de l'onboarding) + opérationnel (PO surveille dashboard)
- Kill switch = `BETA_PAUSED` dans `betaEligibility.ts` + deploy Cloudflare (~2 min) — message UX dédié maintenance
- Dashboard PostHog = assemblage des events existants, pas d'instrumentation supplémentaire requise
- Canal feedback = externe (Discord / formulaire), in-app en backlog P1
- Rollback = kill switch `BETA_PAUSED` en première intention, jamais revert au tag `v2.0-engine-freeze`

## Implementation Plan

### Tasks

#### Tasks opérationnelles (PO)

- [ ] Task 1 : Créer le canal feedback beta
  - Action : Créer un Discord privé `#beta-feedback` OU un formulaire Tally/Google Form
  - Responsable : PO
  - Notes : Le lien doit être communiqué au dev pour Task 8

- [ ] Task 6 : Annonce soft launch
  - Action : PO annonce l'ouverture sur le canal de communication choisi (landing page, réseaux, etc.)
  - Responsable : PO
  - Notes : Mentionner que c'est un beta conditionnel, cap 100, feedback bienvenu

#### Tasks techniques (Dev) — BLOQUANTES

- [ ] Task 2 : Configurer le dashboard PostHog
  - Action : Créer un tableau de bord « Beta Self-Serve » avec 4 panels :
    1. Funnel `signup_completed` → `onboarding_completed` → `week_viewed` → `session_logged`
    2. Compteur distinct `onboarding_completed` (proxy cap 100)
    3. Breakdown `beta_eligibility_blocked` par `primaryReason`
    4. Rétention J1/J3/J7 sur `week_viewed`
  - Responsable : Dev
  - Notes : Tous les events existent déjà. Pas d'instrumentation supplémentaire.

- [x] Task 3 : Tester le kill switch
  - File : `src/services/betaEligibility.ts`
  - Action : Décommenter le `return BETA_PAUSED` en L86-87, `npm run build`, vérifier que les 4 pages montrent le guard avec message « maintenance », recommenter, rebuild. Le PO doit aussi tester cette procédure (backup).
  - Responsable : Dev + PO (backup test)
  - **Résultat :** Vérifié — le mécanisme `BETA_PAUSED` est correct. Les 4 surfaces (WeekPage, SessionDetailPage, ProgramPage, MobilityPage) affichent le guard avec le message dédié. Le reste de l'app reste accessible.

- [x] Task 7 : Implémenter le cap technique 100 users **[BLOQUANT SELF-SERVE]**
  - File : `src/pages/OnboardingPage.tsx`
  - **Résultat :** `handleFinish()` est async. Avant `markOnboardingComplete(userId)`, un `supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_complete', true)` vérifie le compteur. Si `count >= 100` : `setBetaCapReached(true)`, bouton désactivé, message UX « Places bêta complètes », analytics `beta_cap_reached`, lien contact. Fail-open en cas d'erreur réseau (le PO surveille le dashboard quotidiennement). La constante `BETA_CAP = 100` est dans le composant — modifier la valeur pour lever le cap.

- [x] Task 8 : Mettre à jour le lien feedback dans l'app
  - Files : `src/pages/ProfilePage.tsx`, `src/pages/WeekPage.tsx`, `src/pages/SessionDetailPage.tsx`, `src/pages/ProgramPage.tsx`, `src/pages/MobilityPage.tsx`
  - **Résultat :** ProfilePage href standardisé vers `mailto:feedback@rugbyforge.fr`. Lien « Un souci ? Contacte-nous → » ajouté dans les 4 guards de blocage (WeekPage, SessionDetailPage, ProgramPage, MobilityPage). Quand le PO crée le canal Discord/Tally (Task 1), il suffira de remplacer le `mailto:` par l'URL du canal dans les 5 fichiers.

- [x] Task 9 : Privacy/compliance minimum
  - File : `src/pages/LegalPage.tsx`
  - **Résultat :** LegalPage enrichie : (1) section « Données collectées » mentionne explicitement les données de santé (blessures, rehab, morphologie), (2) section « Mineurs et consentement parental » ajoutée (consentement couvre données santé, blocage programme sans consentement, contraintes renforcées U18), (3) section « Suppression de compte et droit à l'effacement » détaillée. Cascade SQL vérifiée : toutes les tables (profiles, exercise_logs, match_calendar, athletic_tests, push_subscriptions) ont `on delete cascade` sur `auth.users(id)`.

#### Tasks techniques (Dev) — COMPLÉTÉES

- [x] Task 4 : Vérifier le lien feedback dans l'app
  - **Résultat :** Le lien pointe vers `mailto:feedback@rugbyprep.app` — canal email fonctionnel. À mettre à jour vers Discord/Tally en Task 8.

- [x] Task 5 : Validation finale
  - **Résultat :** 418/418 tests ✅, build SUCCESS ✅. Deploy Cloudflare à faire quand toutes les tasks bloquantes sont complètes.

#### Changements code déjà appliqués (adversarial review auto-fix)

- [x] **F1 — BETA_PAUSED** : Ajout raison `BETA_PAUSED` dans `betaEligibility.ts` avec message UX dédié « maintenance ». Kill switch utilise `BETA_PAUSED` au lieu de `OFF_SEASON_NOT_SUPPORTED`.
- [x] **F6 — Message UX seasonMode** : Message `OFF_SEASON_NOT_SUPPORTED` mis à jour pour couvrir le cas `undefined` : « Mode saison non supporté ou non renseigné ».
- [x] **F11 — Guard MobilityPage** : Guard `checkBetaEligibility` ajouté dans MobilityPage (même pattern que les 3 autres surfaces). Analytics `surface: 'mobility_page'`.
- [x] **Tests** : +1 test BETA_PAUSED, assertion WeekPage integration mise à jour → 418/418 ✅.

### Acceptance Criteria

- [ ] AC 1 : Given le canal feedback est créé, when un utilisateur clique sur le lien feedback dans l'app, then il arrive sur le canal feedback (Discord ou formulaire)
- [ ] AC 2 : Given le dashboard PostHog est configuré, when le PO consulte le dashboard, then il voit les 4 panels (funnel, compteur, breakdown blocage, rétention)
- [ ] AC 3 : Given le kill switch `BETA_PAUSED` est activé dans `betaEligibility.ts`, when un utilisateur éligible accède à `/week`, then il voit le guard avec le message « Programme temporairement indisponible » et `buildWeekProgram` n'est PAS appelé
- [ ] AC 4 : Given le kill switch est désactivé, when un utilisateur éligible accède à `/week`, then il voit son programme normalement
- [ ] AC 5 : Given le compteur Supabase atteint 100 profils onboardés, when un nouvel utilisateur termine l'onboarding, then il voit « Places beta complètes » et `onboarding_complete` reste `false`
- [ ] AC 6 : Given un bug safety est confirmé (exercice CI livré), when le dev (ou PO backup) active le kill switch, then le deploy est fait en <15 min et tous les utilisateurs voient le guard `BETA_PAUSED`
- [ ] AC 7 : Given un profil éligible modifie son profil vers un état inéligible, when il accède à `/week`, then il voit le guard avec la raison spécifique et un lien vers `/profile`

## Additional Context

### Dependencies

- PostHog déjà instrumenté (8 events clés en place)
- Supabase auth + profiles + `onboarding_complete` en place
- Guards implémentés et testés sur 4 surfaces (418/418 tests, 26 tests éligibilité)
- Cloudflare Pages configuré pour le déploiement
- Gel moteur respecté (`v2.0-engine-freeze`)

### Testing Strategy

- **Pré-lancement :** `npm run test` (418 tests), `npm run build`, test kill switch local (dev + PO backup)
- **Post-lancement :** Monitoring PostHog quotidien, revue feedback canal beta, spot check 5 profils/semaine via `buildWeekProgram` en local
- **Régression :** Si enrichissement contenu (blocs JSON) pendant la beta → smoke test 18 profils × 6 semaines

### Adversarial Review — Findings Tracker

| Finding | Sévérité | Statut | Résolution |
|---|---|---|---|
| F1 — Kill switch message trompeur | Haute | ✅ Résolu | `BETA_PAUSED` avec message UX dédié « maintenance » |
| F2 — Cap 100 sans enforcement technique | Haute | 📋 Task 7 | Supabase RPC `check_beta_cap()` — bloquant self-serve |
| F3 — Kill switch single point of failure | Moyenne | ✅ Résolu | PO = backup documenté, doit tester la procédure |
| F4 — Monitoring erreurs flou | Moyenne | ✅ Résolu | Clarification : pas de Sentry actif, monitoring via PostHog + feedback + Cloudflare. Sentry en backlog P1. |
| F5 — Href feedback non mis à jour | Basse | 📋 Task 8 | Mise à jour href + ajout lien dans guards |
| F6 — Message UX seasonMode undefined | Moyenne | ✅ Résolu | Code modifié : « Mode saison non supporté ou non renseigné » |
| F8 — Rollback au tag engine-freeze destructif | Haute | ✅ Résolu | Stratégie mise à jour : kill switch `BETA_PAUSED` en première intention, jamais revert au tag |
| F9 — Privacy/compliance absent | Moyenne | 📋 Task 9 | Section §8 ajoutée, 3 vérifications avant lancement |
| F10 — Seuils monitoring non validés | Basse | ✅ Résolu | Seuils requalifiés comme « heuristiques initiales » à affiner J3/J7 |
| F11 — MobilityPage sans guard | Haute | ✅ Résolu | Guard ajouté (code) — 4 surfaces protégées |
| F12 — Frontmatter incohérent | Basse | ✅ Résolu | Frontmatter mis à jour avec `updated`, `files_modified`, `review_notes` |
| F13 — Communication users bloqués | Moyenne | ✅ Résolu | Section §2 « Communication pour les utilisateurs bloqués post-onboarding » |

### Notes

**Known limitations acceptées :**
- V-H1 : Builder 3x session Full Body pull-only (suboptimal, pas dangereux)
- F-FINAL-M01 : Monotonie hypertrophy upper BW starter
- F-FINAL-M04 : Variété limitée deload starter

**Documents sources :**
- `decision-beta-et-garde-fous-rugbyprep-2026-03-13.md`
- `reevaluation-decision-beta-post-self-serve-guardrails-2026-03-13.md`
- `validation-finale-go-self-serve-conditionnel-2026-03-13.md`
- `implementation-final-self-serve-guardrails-patch-2026-03-13.md`
