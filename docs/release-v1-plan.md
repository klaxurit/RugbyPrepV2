<!-- /autoplan restore point: /Users/junca/.gstack/projects/klaxurit-RugbyPrepV2/main-autoplan-restore-20260507-085149.md -->
# RugbyForge — Plan release V1 production-grade

**Owner** : Hugo (solo)
**Statut** : draft, à reviewer via gstack `/autoplan` puis exécuter
**Date création** : 2026-05-07

---

## 1. Contexte

RugbyForge est une PWA + TWA Android de préparation physique rugby pour amateurs.
Stack : React 19 / Vite / Supabase / Cloudflare Pages / Bubblewrap (Android).
État actuel : bêta avec testeurs internes, fonctionnel bout-en-bout (programme algo,
IA coach, push notifs, tests athlétiques, planning annuel, paiement Play Billing
implémenté mais bloqué par compte Play Console).

Cette release V1 est le pivot **"prêt à encaisser de vrais paiements et ouvrir
au public"**. C'est un audit complet (sécurité, code, design, copy, perf) suivi
de fixes ciblés.

## 2. Critères de succès release V1

- [ ] Premier vrai achat Play Billing en prod, déblocage features Premium fonctionnel
- [ ] Audit sécurité : 0 vulnérabilité critique ou high-risk en prod
- [ ] Lighthouse mobile : Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 90
- [ ] Bundle JS : < 500 KB gzip pour le chemin critique (login → home)
- [ ] Test coverage : ≥ 70 % sur services métier critiques (`src/services/program/`, `src/services/loadSuggestion`, `src/services/annualPlanning/`)
- [ ] 0 dead code détecté par `knip`/`ts-prune` (ou justifié et documenté)
- [ ] CGU/Privacy/Disclaimer médical à jour, accessibles avant signup
- [ ] Wording FR cohérent (audit ton, vouvoiement vs tutoiement, terminologie)
- [ ] Onboarding ≤ 2 minutes (mesure PostHog : taux complétion ≥ 75 %)
- [ ] 0 erreur Sentry critique sur 7 jours glissants en bêta finale

## 3. Workstreams

### WS1 — Paiement (P0, bloquant)

**Objectif** : un utilisateur peut acheter Premium via Play Billing, voir ses
features débloquées immédiatement, et ses droits reflétés côté backend.

**Tâches** :
- Vérifier état du blocage Play Console (cf. `memory/google-play-billing.md`)
- Tests E2E achat → unlock features → restore purchases → cancel → degrade gracieux après période en cours
- Audit Edge Function `verify-play-purchase` : signature Google, idempotence, gestion grace period
- Audit `refresh-play-subscription` : cron quotidien, renouvellements automatiques, expirations
- Audit table `subscriptions` + `user_entitlements` : RLS, intégrité, race conditions
- UX paiement : copies erreur (carte refusée, achat annulé, restore vide), loading states
- Décision : Stripe pour le web V1 ou différer V1.1 ? *(ma reco : différer, focus Play Billing)*

**Risques** :
- Compte Play Console pas validé à temps
- Bug de race entre webhook Google et refresh local

### WS2 — Sécurité (P0)

**Objectif** : aucune fuite de données, aucune escalation de privilège possible.

**Tâches** :
- **Audit RLS exhaustif** : pour chaque table dans `public.*`, vérifier politiques USING + WITH CHECK pour SELECT/INSERT/UPDATE/DELETE. Tables sensibles à prioriser : `profiles`, `exercise_set_logs`, `match_calendar`, `subscriptions`, `user_entitlements`, `push_subscriptions`, `notification_preferences`, `cancel_feedback`, `athletic_tests`
- **Audit Edge Functions** : pour chaque fonction, expliciter le modèle d'auth (verify_jwt, cron secret, anonymous, service role uniquement). Documenter dans un `supabase/functions/AUTH_MATRIX.md`
- **Audit secrets** : inventaire (`supabase secrets list` + Cloudflare Pages env + .env.local), rotation des plus anciens (VAPID a déjà été rotatée, OK), policy de rotation
- **Headers HTTP** : Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, Referrer-Policy. Cloudflare Pages permet de configurer via `_headers`
- **Dépendances** : `npm audit` clean, configurer Dependabot ou équivalent
- **Auth flow** : rate limiting (Supabase l'a par défaut, vérifier seuils), expiration magic link, validation email obligatoire
- **Storage Supabase** : RLS sur bucket avatars (un user ne peut overwrite que son propre fichier)
- **Logs** : audit `console.log` en prod (zéro PII), retirer logs verbose

**Outils** : `npm audit`, Snyk free tier, OWASP ZAP, Supabase Audit Logs

### WS3 — Code cleanup (P1)

**Objectif** : codebase propre, dead code éliminé, conventions cohérentes.

**Tâches** :
- Installer `knip` ou `ts-prune` → liste exhaustive de modules/exports non utilisés
- Trier les findings : suppression vs faux positif documenté
- Composants doublons à consolider (ex. `ScoreDeFormeCard` vs `ScoreDeFormeTeaser` — déjà touchés mais à reverifier)
- TODO/FIXME inventory : grep + résoudre ou créer issues
- Conventions : import order ESLint, naming (`*.test.ts` vs `*.spec.ts`), structure dossiers
- Service Worker : verifier que le cache strategy ne casse pas les updates
- Hooks personnalisés : audit ceux jamais consommés (ex. `useACWR` vs `useFatigue` — overlap ?)
- Tests : couvrir les services critiques manquants (cf. liste WS6)

**Sortie attendue** : un PR récap "Dead code sweep" avec les findings et le commit qui les supprime.

### WS4 — Design / UI / UX (P1)

**Objectif** : cohérence visuelle, états de chargement/erreur/vide partout, a11y.

**Tâches** :
- **Audit visuel** : palette couleurs (theme-tokens.css), typo, espacements, radius, ombres — passe-le en revue page par page
- **Loading states** : skeletons sur Home, Week, Progress, Profile (au lieu des spinners)
- **Error states** : retry sur erreur réseau, fallback offline (déjà SW)
- **Empty states** : premier user (aucun match, aucun log, aucun test athlétique) — soigner la première expérience
- **Animations** : transitions fluides, motion réduction si `prefers-reduced-motion`
- **A11y** : contrast WCAG AA partout, semantic HTML, ARIA sur tous interactifs custom (pills, accordions, sheets), navigation clavier complète, screen reader test (VoiceOver iOS / TalkBack Android)
- **Responsive** : tablette landscape pas oubliée
- **Dark mode** : décider V1 ou V1.1 (palette bordeaux marche déjà bien sur fond sombre)
- **Onboarding** : mesurer abandon par étape via PostHog, optimiser

**Outils** : axe DevTools, Lighthouse a11y, Color Contrast Analyzer

### WS5 — Wording / Copy (P1)

**Objectif** : ton cohérent, terminologie unifiée, FR irréprochable, EN propre si gardé V1.

**Tâches** :
- **Audit ton** : tutoiement partout cohérent (actuel mix tutoiement + impersonnel)
- **Audit terminologie** : "séance" vs "training" vs "workout" — un seul terme. Idem "bloc" / "exercice" / "tour"
- **Disclaimer médical** : visible et accepté à l'onboarding (cf. `src/knowledge/medical-red-flags.md`), pas juste enfoui en /legal
- **CGU / Mentions légales / Privacy** : revue par quelqu'un (toi ou un pote juriste), à jour avec Play Billing
- **Empty states & errors** : pas de "Erreur 500" brute — toujours une formulation humaine
- **Push notifs** : payload "🏉 Jour de séance !" — vérifier qu'il existe d'autres variantes selon contexte (deload, recovery, post-match)
- **i18n** : si on garde `preferredLanguage='en'` exposé, faire passer toutes les strings EN par un native ou un pro. Sinon retirer le sélecteur en V1

**Décision V1** : EN à V1 ou V1.1 ?

### WS6 — Performance (P1)

**Objectif** : Lighthouse mobile vert, Core Web Vitals dans les seuils.

**Tâches** :
- **Lighthouse audit prod** sur le tunnel critique : landing → signup → onboarding → home → week → session
- **Bundle analyse** : `ANALYZE=1 npm run build` (déjà configuré dans vite.config), identifier les chunks lourds
- **Lazy load** : pages non critiques (Progress avec recharts déjà splittée, Chat IA, MobilityPage)
- **Images** : illustrations postes en `<img loading="lazy">` + WebP
- **Service Worker** : audit cache strategy (precache 3MB max, est-ce trop ?)
- **Edge Functions cold start** : mesurer latence p50/p95 sur les fonctions chaudes (notify-training, ai-coach, register-push-subscription)
- **DB queries** : EXPLAIN sur les requêtes lentes (Supabase Performance tab)
- **PWA install prompt** : non bloquant, déclenché à bon moment

### WS7 — Observabilité (P1)

**Objectif** : voir les bugs prod avant que les users les remontent.

**Tâches** :
- **Sentry** (free tier) : config web + Edge Functions, alerts par niveau
- **PostHog** : audit events couverts (signup, onboarding step done, première séance, premier log, paiement initiated/success/error, push notif click, churn signals)
- **Dashboards Supabase** : queries lentes, RLS denials, edge function failures
- **Alertes** : email si `dispatch-push-queue` échoue plus de N fois, si `verify-play-purchase` retourne 5xx, si Edge Function timeout
- **Healthcheck** prod : un endpoint qui vérifie DB + Edge Functions + push pipeline (cron weekly)

### WS8 — Tests (P2)

**Objectif** : régressions évitées, confiance au refactor.

**Tâches** :
- **Coverage report** : `vitest run --coverage`, identifier gaps
- **Tests métier critiques** manquants : `loadSuggestion`, `safetyContracts`, `qualityGates`, `buildAthletePlanningInputs`, `detectAnnualPlanningContext`
- **Tests integration UI** : flows critiques (signup → onboarding → première séance loggée → première suggestion de charge)
- **E2E** : Playwright sur 3-4 parcours golden path (à évaluer ROI vs intégration tests)
- **Burn-in flaky tests** : déjà scheduled en CI, monitorer

### WS9 — Légal / RGPD (P0, partiellement SHIPPED 2026-05-08 — voir Décision #50)

**Status** : ⚠️ partial SHIPPED 2026-05-08 (dev hard gate + cookies banner + Play Billing CGU livrés ; lawyer review en attente). Voir Décision #50.



**Objectif** : conformité de base pour un produit payant en France/UE.

**Tâches** :
- **CGU à jour** avec Play Billing
- **Politique de confidentialité** : exhaustive (Supabase, PostHog, Stripe si on l'inclut, Sentry, FCM)
- **Cookies** : bandeau si nécessaire (PostHog est analytics → consent)
- **Droits utilisateur** : suppression compte (route `/delete-account` existe — vérifier qu'elle vide vraiment toutes les tables liées + cascade Supabase)
- **Disclaimer médical** : explicite, accepté à signup

### WS10 — Beta → release (P0, partial SHIPPED 2026-05-10 — voir Décision #53)

**Status** : ⚠️ partial SHIPPED 2026-05-10. Code-side livré (LandingPage 4 cards pricing + page /feedback). Ops-side consolidé dans `docs/ws10-launch-checklist.md` (10 sections, ~1.5j focal + 1 sem wall-clock). Voir Décision #53 ci-dessous.



**Objectif** : transition douce de bêta interne à public.

**Tâches** :
- **Phase finale bêta** : élargir à 20-50 testeurs externes (clubs amateurs FFR), recueillir feedback structuré (form PostHog)
- **Triage feedback** : P0/P1/P2, fix avant release
- **Play Store listing** finalisé (cf. `docs/google-play-store-listing.md`) : screenshots récents (post-refonte v4-pro), description optimisée mots-clés, vidéo démo
- **Reviews seeding** : demander 5-10 testeurs satisfaits de poster un avis dès l'ouverture publique
- **Communication launch** : post LinkedIn personnel, FFR comm, clubs amateurs, forums rugby, reddit /r/rugby_union (si pertinent)
- **Pricing page** finalisée sur le site (landing rugbyforge.fr) avec CTA clair

## 4. Plan d'exécution proposé

| Phase | Durée | Contenu | Sortie |
|---|---|---|---|
| 1. Audits diagnostiques | 1 sem | WS2 (sec scan), WS3 (knip), WS4 (a11y/lighthouse), WS5 (audit copy), WS6 (perf scan) en parallèle | 5 rapports findings |
| 2. Fix P0 | 2 sem | Findings sécu + paiement (WS1+WS2+WS9) | Premier paiement Play en prod |
| 3. Polish P1 | 2 sem | WS3 (cleanup) + WS4 (design polish) + WS5 (wording) | UX et copy figées |
| 4. Perf + obs | 1 sem | WS6 + WS7 | Sentry live, Lighthouse vert |
| 5. Bêta finale | 1 sem | WS10 | 0 P0 sur 7 jours |
| 6. Release | 0 | Submit Play Store | Public |

**Total** : ~7 semaines

## 5. Décisions à trancher

1. **Stripe web V1 ou différer ?** — ma reco : différer V1.1, focus Play Billing
2. **EN à V1 ou différer ?** — ma reco : différer V1.1, FR irréprochable d'abord
3. **Dark mode V1 ou V1.1 ?** — bonus, pas bloquant, mais charte bordeaux fonctionne déjà bien
4. **Sentry ou alternative (Rollbar, Bugsnag, free Cloudflare) ?**
5. **iOS V1 ou jamais ?** — limitation tech : pas de Web Push iOS Safari, TWA inexistant. Capacitor scaffolding existe (`ios/`) mais non finalisé. Ma reco : V1 = Android only, iOS dans un V2 majeur

## 6. Risques connus / hors-scope

- **Compte Play Console** : peut bloquer release entière (cf. `memory/google-play-billing.md`)
- **Concurrent direct** : surveiller Strava, MyJump, etc. (différenciation = sport-spécifique rugby + IA coach + ACWR algo)
- **Saisonnalité** : releaser idéalement avant pré-saison (juillet/août France) pour capter le pic de motivation
- **Hors-scope V1** : Mode coach équipe (#28), tracking équipe ACWR collectif, vidéos exercices (#27), Stripe web, EN, iOS, mode dark

## 7. Annexes

- Memory projet : `~/.claude/projects/-Users-junca-Projets-RugbyPrepV2/memory/MEMORY.md`
- KB scientifique : `src/knowledge/`
- Specs séances : `docs/training/mother-sessions/`
- Play Store : `docs/google-play-store-listing.md`, `docs/google-play-launch-checklist.md`
- Tests matrix : `docs/testing/ec-traceability-matrix.md`

## 8. Bugs identifiés à fixer en V1 (post-autoplan, REVIEWED via /autoplan v2 — 2026-05-07 12:28)

> ⚠️ **Section réécrite après dual-voice review** : la version initiale contenait des chemins de fichiers inventés (`src/services/restTimer/`), des noms de fonctions inexistantes (`getEffectivePhase`/`applyAnnualPlanningOverride`), et un scope mal sizé sur 3/4 bugs. Cette version est calibrée sur le code réel et la KB.

### Section 8 — Dual-Voice Consensus

```
══════════════════════════════════════════════════════════════════════
  Bug   Issue trouvé                          Subagent  Codex   Verdict
  ────  ────────────────────────────────────  ────────  ──────  ───────────
  B1    Code already shipped, spec wrong       FLAG       FLAG    CONFIRMED
  B2    548 entries / 13 intents (not 6)       FLAG       FLAG    CONFIRMED
  B2    "0-30s activation" not KB-supported    FLAG       FLAG    CONFIRMED
  B2    Missing restBetweenRounds field         FLAG       FLAG    CONFIRMED
  B3    Eye buttons exist, real bug = wiring   FLAG       FLAG    CONFIRMED
  B3    Per-exo gating needed (115/208 vidéos) PARTIAL    FLAG    CONFIRMED
  B4    Function names wrong in spec           FLAG       FLAG    CONFIRMED
  B4    Matrix 900 cases unrealistic           FLAG       FLAG    CONFIRMED
  B4    Priority P0 vs P1                      P0         P1      DISAGREE → keep P1
══════════════════════════════════════════════════════════════════════
8/9 dimensions converge. Section 8 specs corrected below.
```

### B1 — Push notif fin de temps de repos en background (P2, partial SHIPPED 2026-05-10 — voir Décision #54)

**Status** : ⏳ partial SHIPPED 2026-05-10 — audit code + test plan empirique livrés (`docs/b1-doze-validation-testplan.md`). Validation empirique sur ≥2 devices Android = côté user. Voir Décision #54 ci-dessous.



**Verdict review** : Le mécanisme est **DÉJÀ IMPLÉMENTÉ**. [`SessionRunContext.tsx:183-223`](src/contexts/SessionRunContext.tsx) avec `SCHEDULE_REST_END`/`CANCEL_REST_END`, [`sw.ts:36-74`](src/sw.ts) avec `setTimeout` + `registration.showNotification`. Limitation iOS PWA explicitement documentée comme accepted V1.

**Symptôme réel** : SW `setTimeout` peut être tué par Android Doze ou battery optim agressives (Samsung One UI, Xiaomi MIUI). À valider empiriquement, pas à reconstruire.

**Travail réel V1** :
- Test empirique sur ≥2 devices Android TWA (Pixel 7+ vanilla + Samsung Galaxy battery-optim ON) : timer 60s, 90s, 180s, 300s avec écran verrouillé
- Vérifier `useNotifications.ts:106` permission prerequisite (déjà géré ailleurs, vérifier l'ordre dans le flow)
- Documenter résultat dans test plan
- **Effort** : 0.5 jour validation

**iOS PWA (V1.1 séparé)** : nécessite **server-scheduled push** (Edge Function + setTimeout côté serveur ou cron table), pas un patch client. Effort 3-5j, **non chiffrable dans V1**.

**Files** : `src/contexts/SessionRunContext.tsx:183-223` (existant), `src/sw.ts:36-74` (existant), `src/hooks/useNotifications.ts:106` (permission)
**Slot timeline** : Week 6 bêta finale (test devices)

### B2 — Audit des temps de repos vs KB science (P0 maintenu, RE-SIZED 3-4 jours)

**Symptôme** : les temps de repos dans `blocks.v1.json` ne sont pas tous alignés avec les recommandations scientifiques. Risque crédibilité commerciale + sécurité (rest insuffisant en force lourde = perte de force).

**Scope correct (review-validated)** :
- **548 entries `restSeconds`** au niveau `versions[]` (pas 549, pas par bloc)
- **13 intents distincts** : activation, prehab, neural, contrast, force, hypertrophy, core, neck, carry, conditioning, mobility, warmup, cooldown — pas 6
- **Champ manquant data model** : pas de `restBetweenRounds` ni `restBetweenSupersets`. Pour blocs contrast/neural (pairs jumps après squats avec `restSeconds: 0` intra-pair), le 2-3min entre paires est UNMODELED. → **Bloque test contractuel propre.**

**Calibration KB-validated** (sources vérifiées par dual voice) :
- **Force max / 1RM proche** : 3-5 min ([`strength-methods.md:218`](src/knowledge/strength-methods.md))
- **Dynamic / Power** : 60-90s ([`strength-methods.md:245`](src/knowledge/strength-methods.md)) — *correction : pas 2-5min*
- **Repeated-effort / Hypertrophy** : 60-120s ([`strength-methods.md:276`](src/knowledge/strength-methods.md)) — *correction : pas 60-90s*
- **DUP endurance** : 60s ([`periodization.md:122`](src/knowledge/periodization.md))
- **Activation / Prehab / Mobility** : **NO HARD KB RULE** — current 30/45/60s activation, 180s prehab valides. *Correction : "0-30s" du spec initial était inventé, pas KB-supported. Activation 45-60s reste valide.*
- **Conditioning** : protocole-specific (HIIT 1:1, lactate 1:2-3, aérobie 1:1-2)
- **Contrast/Neural** : intra-pair 0s + inter-pair 2-3min (réclame nouveau champ data)

**Travail réel** :
1. ✅ **Décision data model tranchée (Décision #40 v2 — révisée 2026-05-07 J1)** : pas de nouveau champ. `restSeconds` au niveau `versions[]` = **rest entre vraies séries** (entre exécutions complètes du contenu de `scheme`). La structure intra-pair / intra-triplet / intra-superset est encodée par `scheme.kind` (`emom` pour time-bound) ou par la notation composite dans `scheme.reps` (`"5 / 5 / 6"`, `"5 + 5"`). Convention canonique `(intent × scheme.kind) → range` documentée dans [`src/data/README-rest-times.md`](../src/data/README-rest-times.md).
   - `intent: contrast` reps → `restSeconds` 120-180s = rest **après triplet complet** (heavy + plyo + accessoire). Aucune entry à 0s — la v1 du #40 était fondée sur lecture théorique fausse, corrigée à J1.
   - `intent: neural` emom → `restSeconds = 0` strict (EMOM gère son timing)
   - `intent: neural` reps → 60-150s (dynamic effort + tolérance olympic complex)
   - `intent: conditioning` → ratio work:rest dérivé du tag protocole (`hiit`, `aerobic`, `vo2max`, `lactate`, `rsa`) — tous les blocs actuels ont déjà ce tag, audit J1 confirmé
   - `intent: force/hypertrophy/etc.` → `restSeconds` = rest entre séries selon table KB
2. Tableau version-level : 548 entries × 13 intents → audit par paire (intent, restSeconds)
3. Identifier mistags suspects : prehab 180s (force-zone numbers), conditioning sans tag de protocole clair
4. Test contractuel : `src/data/__tests__/restTimes.contract.test.ts` qui assert restSeconds in range par `(intent × scheme.kind)`. Pour contrast/neural, valider que `restSeconds === 0` (intra-pair) → la convention dit qu'on sait déjà que le 2-3min inter-pair est implicite.
5. Corrections data sur les véritables mistags uniquement (pas sur les "0-30s activation" qui n'étaient pas KB-supported)
6. Documenter la convention dans `src/knowledge/strength-methods.md` ou un README data — "comment lire restSeconds par intent"

**Files** : `src/data/blocks.v1.json` (548 entries), `src/data/__tests__/restTimes.contract.test.ts` (nouveau), `src/knowledge/strength-methods.md` (vérification source), schema TypeScript pour `versions[]` si data model change

**Effort CC** : **3-4 jours** (review +1d : data model decision + 13 intents au lieu de 6)
**Slot timeline** : Week 1-2 P0 (intégrité scientifique du Founding 49€/an)

### B3 — Restaurer accès vidéos d'explication exos (P1, RE-SIZED 1-1.5 jour)

**Verdict review** : ce n'est PAS un wire-up de prop simple. Le système entier `ExerciseDemoSheet` n'a pas été migré au nouveau stack session.

**État du code (review-validated)** :
- Eye buttons UI **EXISTENT** dans [`ToursBlock.tsx:419-428,494-503`](src/components/session/blocks/ToursBlock.tsx) — gated sur prop `onPlayDemo`
- Prop `onPlayDemo` exposée et forwardée par [`SessionBlocks.tsx:37,62,211`](src/components/session/SessionBlocks.tsx)
- **MAIS** : `SessionDetailPage.tsx` lignes 875, 908, 926 ne passent JAMAIS `onPlayDemo` → boutons cachés (callback undefined)
- Ancien stack ([`MotherSessionBlock.tsx:90,182,210,243`](src/components/motherSession/MotherSessionBlock.tsx) + [`exercises.ts:93`](src/data/exercises.ts) `hasExerciseDemo` + [`ExerciseDemoSheet.tsx:34`](src/components/motherSession/ExerciseDemoSheet.tsx)) avait **per-exercise gating** + sheet — pas migré au nouveau stack
- Filename data : **`exercices.v1.json`** (orthographe française) — pas `exercises.v1.json`
- Couverture vidéo : **115/208 exercices** (~55%) ont un `videoUrl` → gating par exo nécessaire pour ne pas afficher l'œil sur des exos sans vidéo

**Travail réel** :
1. Wire `onPlayDemo` depuis `SessionDetailPage` → `SessionBlocks` (3 spots : 875, 908, 926)
2. Migrer ou réutiliser `ExerciseDemoSheet` dans le nouveau stack (réutilisation `motherSession/ExerciseDemoSheet.tsx` recommandée — DRY)
3. État local sheet `demoExerciseId` dans SessionDetailPage
4. Per-exercise gating : utiliser `hasExerciseDemo(exerciseId)` ([`exercises.ts:93`](src/data/exercises.ts))
5. ToursBlock + PreviewExerciseRow doivent recevoir l'info "cet exo a une vidéo" (mapper helper, ou prop `canShowDemo` par exo)

**Files** : `src/pages/SessionDetailPage.tsx:875,908,926`, `src/components/session/SessionBlocks.tsx`, `src/components/session/blocks/ToursBlock.tsx`, `src/components/motherSession/ExerciseDemoSheet.tsx` (réutiliser), `src/data/exercises.ts` (`hasExerciseDemo` helper), `src/data/exercices.v1.json` (read-only)

**Effort CC** : **1-1.5 jour** (review +0.5 : migration sheet + per-exo gating, pas juste wire-up)
**Slot timeline** : Week 4-5 (WS4 states + a11y)

### B4 — Hardening transitions programme annuel (P1, SHIPPED 2026-05-08 — voir Décision #49)

**Status** : ✅ SHIPPED 2026-05-08. Cible originale supprimée par #47 → re-scopée sur `src/services/season/*`. Voir [`docs/b4-transitions-hardening-plan.md`](b4-transitions-hardening-plan.md) et Décision #49 ci-dessous.

**Verdict review** : noms de fonctions corrigés, scope ramené à du test-hardening ciblé sur invariants manquants. **Pas un bug prod reproduit** — c'est du test-hardening, donc reste P1 (escalade P0 si l'audit révèle un défaut concret).

**Noms réels (review-validated)** :
- ❌ `getEffectivePhase()` → ✅ [`getSessionPhase()`](src/services/program/programPhases.v1.ts:43) (DUP per-session)
- ❌ `applyAnnualPlanningOverride()` → ✅ overrides dans [`buildWeekProgram.ts:127,166,272`](src/services/program/buildWeekProgram.ts)
- ✅ [`getPhaseForWeek()`](src/services/program/programPhases.v1.ts:64), [`getNextWeekForProfile()`](src/services/program/programPhases.v1.ts:122) (gère in-season 3:1 vs off-season 4:1)
- ✅ [`resolveMicrocycleArchetype.ts:117`](src/services/program/resolveMicrocycleArchetype.ts)

**Couverture existante** (déjà solide, à étendre, pas refaire) :
- [`waveA.test.ts:537,612`](src/services/program/waveA.test.ts) — wave transitions
- [`buildWeekProgram.test.ts:224`](src/services/program/buildWeekProgram.test.ts) — base routing
- [`buildWeekProgramEdgeCases.test.ts:337`](src/services/program/buildWeekProgramEdgeCases.test.ts) — edge cases
- [`seasonLifecycle.integration.test.ts:40`](src/services/season/__tests__/seasonLifecycle.integration.test.ts) — season layer
- [`detectSeasonTransitions.test.ts:24`](src/services/season/__tests__/detectSeasonTransitions.test.ts) — transition detection

**Travail réel (50-80 fixtures, pas 900)** :
- 8 frontières critiques × ~5-10 profils représentatifs = ~50-80 fixtures hand-picked
- Frontières critiques (inchangées vs spec initiale, valides) :
  - S2→S3 récup→transition, S4→S5 transition→hypertrophie, S8→S9 H4 deload→force-puissance W1, S10→S11 force-puissance→pré-saison, S12→S13 pré-saison→in-season DUP, in-season W4/W8 deload, rehab P1→P2→P3, season switch mid-cycle
- Property-based via `fast-check` sur invariants `getNextWeekForProfile` (monotonie semaine, pas de saut > 1 micro-cycle, deload présent dans la fenêtre attendue)
- Réutiliser harness existant `src/services/program/__tests__/`
- Vérifier `shouldRecommendDeload()` couvre H4+W4+W8+transitions
- Cross-layer integration avec `src/services/season/*` (Codex unique finding)

**Files** : `src/services/program/__tests__/annualTransitions.test.ts` (nouveau, ~50-80 cases), `src/services/season/__tests__/` (extension intégration), `src/services/program/programPhases.v1.ts` (read-only), `src/services/program/buildWeekProgram.ts` (read-only sauf fix de bugs trouvés)

**Effort CC** : **1.5 jour** (review -1 à -1.5j : test hardening ciblé, infra existante réutilisée)
**Priorité** : reste P1 — Codex argument : pas de défaut prod reproduit, c'est du hardening. Subagent argumentait P0 sur principe correctness ; si la matrix révèle un bug concret, escalade P0 immédiate.
**Slot timeline** : Week 3 (post-WS1 idempotence ledger, parallèle WS2)

### Impact timeline (récap RE-SIZED après review)

| Bug | Priorité v1 | Priorité v2 | Effort v1 | Effort v2 (review) | Slot |
|---|---|---|---:|---:|---|
| B1 valid Android + iOS V1.1 séparé | P1 | **P2** | 1-2j | **0.5j** | Week 6 |
| B2 audit rest times | P0 | **P0** | 2-3j | **3-4j** | Week 1-2 → ✅ DONE 2026-05-08 |
| B3 vidéos demo restore | P1 | **P1** | 0.5-1j | **1-1.5j** | Week 4-5 → ✅ DONE 2026-05-07 |
| B4 transitions hardening | P1 | **P1** | 2-3j | **1.5j** | Week 3 → ✅ DONE 2026-05-08 |
| **Total** | | | **7-10j** | **6.5-7.5j** | **+1 sem max** |

**Net effort** : v2 économise 0.5-2.5 jours sur v1 (B4 -1 à -1.5j, B1 -0.5 à -1.5j) tout en ajoutant 0.5-1j sur B2/B3 mieux scopés. Timeline V1 trim reste **~9 semaines** (June 30 anchor tenable, départ lundi 11 mai).

### Décisions audit Section 8 review (suite à #37)

| # | Source | Décision | Class | Principe |
|---|---|---|---|---|
| 38 | B1 review | Reclassifier B1 P1 → P2 (validation seulement V1) ; iOS V1.1 nécessite server-scheduled push (3-5j séparé) | Mechanical | P5 explicit |
| 39 | B2 review | Conserver 45-60s pour activation (KB-supported), drop la règle "0-30s" inventée | Mechanical | P1 KB truth |
| 40 | B2 review | **TRANCHÉ (b) — révisé v2 2026-05-07 J1** : pas de nouveau champ. `restSeconds` = rest entre vraies séries ; structure intra-pair encodée par `scheme.kind=emom` ou notation composite `scheme.reps`. v1 ("intra-pair=0, inter-pair 2-3min implicite") corrigée — aucune entry contrast à 0s, le triplet est exécuté en série. Voir [`src/data/README-rest-times.md`](../src/data/README-rest-times.md) | Mechanical | P5 explicit + P1 KB truth |
| 46 | B2 J1 audit | Retag à J3 : `BLK_FORCE_UPPER_REHAB_BAND_STRENGTH_01` (4 versions) + `BLK_FORCE_LOWER_REHAB_STABILITY_01` (4 versions) → `intent: force → hypertrophy` ou `prehab` (charge band sub-maximale, pas du force max). `BLK_PREHAB_COPENHAGEN_01` (4 versions) → réduire 180→60-90s. Allowlist : `BLK_FORCE_UPPER_OHP_PENDLAY_01` (3 versions, superset antagoniste OHP+Pendlay row, légitime). Impact routing `selectEligibleBlocks` à vérifier pour les retags. | Mechanical | P1 KB truth |
| 41 | B3 review | Réutiliser `motherSession/ExerciseDemoSheet.tsx` au lieu d'en créer un nouveau (DRY) | Mechanical | P4 |
| 42 | B3 review | Per-exercise gating obligatoire (115/208 vidéos seulement) | Mechanical | P5 |
| 43 | B4 review | Corriger noms fonctions plan : `getSessionPhase`, `getPhaseForWeek`, `getNextWeekForProfile`, `resolveMicrocycleArchetype` | Mechanical | P5 |
| 44 | B4 review | Cible 50-80 fixtures (pas 900), property-based via fast-check sur invariants | Mechanical | P3 |
| 45 | B4 review | B4 reste P1 sauf découverte d'un bug concret pendant l'audit | TASTE | — |
| 47 | B2 audit findings | **SHIPPED 2026-05-07** — Cleanup legacy stack + medical content (branch `chore/decision-47-cleanup`, 6 phases A-F, **-17 426 lignes nettes**). Supprimé : `buildWeekProgram` + `blocks.v1.json` (548 entries) + `qualityGates` rehab + `sessionRecipes.v1` + `microcycleArchetypes.v1` + `buildMobilitySession` + `MobilityPage` (route `/mobility`) + chaîne `buildSessionFromRecipe` + types `RehabZone`/`Phase`/`Injury` + `UserProfile.rehabInjury` + DB column drop migration. Active stack inchangé (motherSessions). #24 Mobilité et #25 Rehab obsolètes. ACL prevention femmes : routing supprimé avec buildWeekProgram (V1.1 si réintroduction voulue, claim athlétique pas médical). Plan détaillé : `docs/decision-47-cleanup-plan.md`. Audit trail commits : fd18e03 → 7d7812e. | TASTE | P3+P5 |
| 48 | B2 audit rest times | **SHIPPED 2026-05-08** — Audit rest times motherSessions vs KB (7 phases A-F, ~4.5j ; main commits ba819c8 → 337edf1). Pipeline : `parseRestSeconds` (free-text → range, qualifier precedence Décision #40 v2) + `inferBlockIntent` (11 règles spécifique→générique, hypertrophy-before-force) + `auditBlock` + `kbRanges` (sources strength-methods.md/periodization.md). Dry-run sur 155 blocks : 138 PASS / 16 SKIP / 1 FAIL → triage révèle "Pull Contrast Strength" est un misnomer (pair force lourde, pas un vrai contrast) → renommé en "Pull Strength Pair" dans 2 MDs in-season → audit clean **139 PASS / 16 SKIP / 0 FAIL**. Phase B' : 22 sessions inline (in-season + pre-season) migrées vers MD → MD = single source of truth pour les 39 sessions. Strict contract test CI gate `restTimes.contract.test.ts` (62 tests audit total : 42 parser + 14 heuristique + 6 contract). Plan : `docs/b2-rest-times-audit-plan.md` ; findings : `docs/b2-rest-times-findings.md` ; corrections triage : `docs/b2-rest-times-corrections.md`. | TASTE | P1 KB truth |
| 54 | B1 push fin-de-repos validation Doze (partial) | **SHIPPED 2026-05-10** — Audit code statique + test plan empirique livrés (3 phases A-C, ~0.2j vs 0.5j budgété, le reste = exécution user empirique sur devices). Main commit e9955ad. Phase A audit `SessionRunContext.tsx:183-223` + `sw.ts:36-74` + `useNotifications.ts:102-117` : mécanisme cohérent pour Android Chrome vanilla sur rest ≤5 min. 7 risques R1-R7 catalogués (Doze, Samsung One UI, Xiaomi MIUI, Oppo/Huawei agressifs, OOM Chrome, sw.controller null, permission). Aucune mitigation code V1 prioritaire — résolution OEM-agressifs côté user (config OS). Phase B test plan `docs/b1-doze-validation-testplan.md` : matrix devices D1-D4 × 6 tests T1-T6 (60s/90s/180s/300s × état écran × battery optim) avec tables résultats pré-formatées + critères pass/fail + décisions selon outcomes (clôture, onboarding step "désactive Sleeping apps", escalade P0 push-serveur V1.1 si fail >30%). Phase C mitigations code skipped (audit "reasonable", pas de fix possible avant exécution empirique). Wall-clock pending : exécution user du test plan sur ≥2 devices (Pixel + Samsung min) ; clôture Décision #54 selon résultats. iOS PWA push différé reste V1.1 séparé (3-5j, server-scheduled push). | TASTE | P5 explicit |
| 53 | WS10 bêta → release publique (partial) | **SHIPPED 2026-05-10** — Code-side WS10 livré (5 phases A-E, ~0.5j) ; ops-side consolidé. Main commits 6310225 (B+C) → 99e2a5e (D) → ce commit (E). Phase A discovery : checklists Play Store existantes (`docs/google-play-launch-checklist.md` 61L, `docs/google-play-store-listing.md` 189L) ne mentionnaient ni Founding ni nouveaux tarifs. Phase B : LandingPage 4 cards pricing (Free 0€ / Mensuel 5,99€ / Annuel 64,99€ / **Founding 49€/an à vie** highlighted), grid responsive 2/4 cols, note explicative sur trigger Founding post-D2+session. Phase C : migration `20260510120000_beta_feedback.sql` (table feedback + RLS insert-own + indexes) + page `/feedback` accessible depuis ProfilePage avec form (kind bug/feature/usability/other + textarea 5-4000c + persist Supabase + PostHog event `feedback_submitted` + redirect /profile). Phase D : `docs/ws10-launch-checklist.md` (173L, 10 sections) consolidant Bubblewrap keystore backup (Décision #34 EXISTENTIEL), Supabase Pro upgrade + PITR, Auth dashboard config (rate limits + hCaptcha + leaked passwords), Stripe 3 Prices à créer, Play Console 3 SKU + RTDN, listing assets manquants, recrutement 20-50 testeurs (LinkedIn DM + clubs FFR), DM Founding aux testeurs (PostHog cohort), critères release publique (0 P0 7j + ≥1 conversion). Wall-clock pending : (i) `npx supabase db push` migration 20260510120000_beta_feedback ; (ii) ops-side §1-9 par user (~1.5j focal + 1 sem wall pour recrutement testeurs). Suite : 1235 PASS / 28 SKIP. | TASTE | P5 explicit |
| 52 | WS0 pre-sale Founding offer | **SHIPPED 2026-05-09** — Mécanisme pre-sale Founding 49€/an à vie (Décision #52, 6 phases A-F, ~0.5j vs 1 sem budgété grâce à la stack billing déjà câblée #23 + #25). Trigger composé (Décision #15) : `created_at + 24h ≤ now` + ≥1 session_log + pas premium/founding + pas dismissed. Pure-function `evaluateFoundingEligibility()` extraite + couverte par 10 unit tests (D2 boundary, priority order, etc.). Modal `FoundingOffer` mountée globalement dans App.tsx, dismissible via `useHintVisibility('founding_offer_2026')`. PostHog events : `founding_offer_shown` (1× par session), `founding_offer_clicked`, `founding_offer_dismissed`. Routing checkout transparent via `usePremiumCheckout` étendu (Android TWA → Play Billing SKU `founding.yearly`, iOS PWA / web → Stripe price `STRIPE_PRICE_FOUNDING_YEARLY`). Migration `20260509150000_plan_founding_yearly.sql` (plan tier=founding lifetime + 10 entitlements alignés sur premium_yearly). Décision skip email V1 (modal in-app + DM perso user pour les 20 testeurs initiaux, conforme à la review "amateur rugby = word of mouth"). Wall-clock pending : (i) `npx supabase db push` ; (ii) **Stripe** : créer Price object `founding_yearly_49` (4900 EUR recurring annual) dans dashboard, copier price_id dans secret Supabase `STRIPE_PRICE_FOUNDING_YEARLY` ; (iii) **Play Console** : créer subscription `rugbyforge.founding.yearly` (annual base plan, 49€ EUR). Suite : 1235 PASS / 28 SKIP. | TASTE | P5 explicit |
| 51 | WS2 sécurité / RLS audit | **SHIPPED 2026-05-09** — Audit sécu V1 (6 phases A-F, ~0.5j vs 2-4j budgété). Main commits c1604c1 (A) → 64e4b74 (C+D) → ce commit (E+F). Phase A : carto 20 tables `public.*` toutes RLS-enabled, 19/20 avec policies (`processed_billing_events` service-role-only canonique), Edge Functions `verify_jwt` matrix codifiée (#27), push_subscriptions legacy permissive policies droppées 2026-04-15, `_headers` Cloudflare HSTS+CSP+frame-ancestors solides. **Aucun P0 trouvé** (les audits #23-#27 antérieurs avaient déjà sécurisé la surface critique). 3 gaps P1 mineurs corrigés : (i) migration `20260509110000_storage_avatars_policies.sql` rend déclaratif les RLS sur `storage.objects` bucket `avatars` (path `{user.id}/{ts}.ext` matche `(storage.foldername(name))[1]`) ; (ii) CSP cleanup — drop `googletagmanager.com` non utilisé ; (iii) CSP defense-in-depth — ajout `manifest-src 'self'`, `worker-src 'self' blob:`, `object-src 'none'`. V1.1 watchlist : F2 `mobile_install_leads` spam vector → hCaptcha, F3 CSP `'unsafe-inline'` → nonces (refactor non trivial), F7 COOP/COEP optionnel. Wall-clock pending : (i) `npx supabase db push` ; (ii) dashboard Supabase Auth rate limits + hCaptcha à activer manuellement. Audit complet : `docs/ws2-security-audit.md`. | TASTE | P5 explicit |
| 50 | WS9 légal / RGPD (partial) | **SHIPPED 2026-05-08** — Phase WS9 dev partiellement livrée (lawyer review wall-clock pending). 6 phases A-F (~1.5j) ; main commits 4391ba7 → ce commit. Phase A discovery : SignupPage 1 checkbox combinée (18+/CGU/privacy) sans gate médical, LegalPage avec CGU+Privacy mais pas de Play Billing, PostHog init au boot sans bandeau cookies. Phase B `docs/ws9-lawyer-pack.md` (237 LOC) : verbatim CGU+Privacy+Disclaimer actuels + propositions disclaimer hard gate + Play Billing addendum CGU + cookies banner copy + 9 questions ciblées avocat·e (€500 HT, échéance 2 sem). Phase C migration `20260508120000_profiles_medical_consent.sql` (colonne `medical_consent_accepted_at timestamptz`) + SignupPage checkbox médical séparée + authService persist via options.data.medical_consent_accepted_at (mirror raw_user_meta_data) + upsert profiles immédiat si session + LegalPage anchor `#disclaimer`. Phase D `cookieConsent.ts` service + `CookieConsentBanner.tsx` (RGPD CNIL 2020 opt-in PostHog) + main.tsx replace `initPostHog()` par `initAnalyticsIfConsented()` + LegalPage section CookieSettings réversible. Phase E LegalPage CGU §6 Abonnements et paiements (Play Billing + Stripe + L221-28 rétractation 14j). Phase F 8 tests intégration (3 SignupPage hard gate + 5 CookieConsentBanner). Suite : 1225 PASS / 28 SKIP. **Wall-clock pending** : (i) user envoie pack lawyer pour revue €500 ; (ii) `npx supabase db push` migration 20260508120000. | TASTE | P5 explicit |
| 49 | B4 transitions hardening | **SHIPPED 2026-05-08** — B4-redux post-#47. Cible originale (`buildWeekProgram` + `waveA` + `resolveMicrocycleArchetype`) supprimée par #47 → re-scope sur `src/services/season/*` (854 LOC source, dont `detectAnnualPlanningContext` 847 LOC, le module non trivial le plus complexe du repo). 6 phases A-F, ~1j (vs 1.5j initial). Phase A discovery : carto invariants ; Phase B : `npm i -D fast-check@4.7.0` + scaffold ; Phase C : 13 property tests à 250 runs/property dans `seasonInvariants.property.test.ts` (P1-P12, P12 splittée a/b) couvrant `detectAnnualPlanningContext` (never-throws, well-formed, mesocycle 4·(b-1)+w, pre-season deload, off-season never-deload, monotonie +7d avec filtre anchor stable, playoffs month guard, firstMatchOverride priority), `deferralRules` (pass-through, purge no-filter, eventId filter), `transitionJournal` (cap 3, restore left-inverse) ; Phase D : 15 fixtures hand-picked dans `seasonBoundaries.fixtures.test.ts` aux frontières off/pre/in-season + treve subModes + auto season-end + onboarding grace ; Phase E : 2 counter-examples sur P6 documentés (no-match fallback + lower-clamp avant offSeasonStart, comportements intentionnels, properties scopées) — aucun bug code, Décision #45 P0-escalation non déclenchée. Stress 1000 runs/property vert. Suite : 1217 PASS / 28 SKIP. Commits main : d203f9d → 32765bb → b0587b7 → 4f768dc → 468d389. Plan : `docs/b4-transitions-hardening-plan.md`. | TASTE | P1 |

**Section 8 review terminée**. Subagent : 4 critiques + corrections fichiers/fonctions. Codex : 3 high + corroboration spécifique avec citations KB. Convergence quasi-totale (B1/B2/B3/B4 specs corrigées). Discordance unique : B4 priority (Codex P1, Subagent P0). Décision : reste P1 par défaut, escalade P0 si l'audit révèle un bug.

---

# /autoplan REVIEW REPORT — Phase 1 CEO Findings (2026-05-07)

## CEO Dual Voices — Consensus

```
══════════════════════════════════════════════════════════════════════
  Dimension                              Claude   Codex   Consensus
  ─────────────────────────────────────  ──────   ──────  ──────────────
  1. Premises valid?                     NO       NO      DISAGREE → user
  2. Right problem to solve?             NO       NO      CONFIRMED NO
  3. Scope calibration correct?          NO       NO      CONFIRMED NO
  4. Alternatives explored?              NO       NO      CONFIRMED NO
  5. Competitive/market risks covered?   NO       NO      CONFIRMED NO
  6. 6-month trajectory sound?           NO       NO      CONFIRMED NO
══════════════════════════════════════════════════════════════════════
0/6 confirmed valid. 6 high-confidence DISAGREE (both models).
```

## Top Findings (both voices converge)

1. **CRITICAL: Plan optimizes for shipping infrastructure, not validating WTP.** Success criteria (Section 2) are 7/10 engineering vanity (Lighthouse, coverage, dead code, bundle, Sentry, RGPD compliance), 3/10 onboarding/disclaimer/wording, 0/10 commercial proof. You can hit every one and ship to crickets. **Fix**: Add 3 commercial criteria — ≥30 paying FR users by August 31, D7 retention ≥40%, trial-to-paid ≥10%.
2. **CRITICAL: 7 weeks solo / 10 workstreams is fiction.** Phase 1 alone runs 5 audits "en parallèle" — realistic solo throughput is 1 WS/week deep focus. Realistic at current scope: 12-14 weeks. May 7 + 7w = June 25, zero buffer for pre-saison July anchor. **Fix**: Cut to 4 P0 tracks (WS1+WS2+WS9+WS10) + add WS0. Defer WS3/WS4 polish/WS6 perf beyond Lighthouse pass/WS7 Sentry/WS8 E2E to V1.1.
3. **CRITICAL: Play Billing as single point of failure.** Decision 1 ("différer Stripe V1.1") = if Play Console doesn't unblock, V1 cannot ship. **Fix**: Add minimal Stripe web fallback (3 days, landing+pricing+Stripe Checkout+email capture) — decouples release from Google.
4. **HIGH: Wrong competitive cohort.** Plan names Strava/MyJump. Real threats: free coach plans, WhatsApp groups, generic strength apps (TrainHeroic, Future), inertia. "Rugby-specific + IA + ACWR" is feature differentiation, not durable WTP reason. **Fix**: 4-hour competitive teardown; identify defensible moat (data network effect? club partnerships? FFR endorsement?).
5. **HIGH: GTM is not a plan.** WS10 lists 6 channels in 1 bullet, no budget, no CAC target. Solo B2C in niche sport, no marketing budget = 30-100 paid users year 1. **Fix**: Pick ONE channel (likely: club partnerships via FFR contacts), commit pre-launch, measure CAC.
6. **HIGH: No demand validation step.** Both models recommend WS0 pre-sale: Founding offer (49€/an) to 20 beta testers in week 0. <30% conversion = plan is wrong, not late.
7. **HIGH: No kill criteria.** What metric/date triggers "this isn't working, pivot or stop"? Without it, sunk-cost continues indefinitely. **Fix**: Add — "<5 paying users by August 31 → reassess product-market fit before scaling marketing spend".
8. **MEDIUM: iOS dismissed too fast.** iOS PWA Web Push works since iOS 16.4 (when added to home screen, March 2023). Capacitor scaffolding exists. ~50% French smartphone share. Reassess as 2-3 weeks not "V2 majeur".
9. **MEDIUM: Disclaimer médical RGPD risk understated.** WS9 is 5 bullets. Algo prescribing physical loads to amateurs + weak medical disclaimer + knee injury claim = existential. **Fix**: Pay €500 for real lawyer review.
10. **MEDIUM: cancel_feedback table unused.** D30 churn likely >50%. **Fix**: Add cohort retention dashboard to WS7 PostHog scope.

## Findings unique to one voice
- **Subagent only**: pricing experiment plan missing (7-9€/mo vs 59-79€/an wide range — 5-user WTP interviews pre-launch); 1-week final beta too short.
- **Codex only**: B2B2C wedge framing — "own pre-season conditioning for one club" as 10x reframing.

## Implementation Alternatives

| # | Approach | Effort | Risk | Pros | Cons |
|---|---|---|---|---|---|
| A | Plan as-is (10 WS / 7w) | 7w solo | HIGH | Saisonnalité target | 12-14w realistic, no demand proof |
| B | Trimmed: 4 P0 WS in 7w | 7w solo | MEDIUM | Pre-saison launch | WS3/4/5/6/7/8 deferred |
| C ★ | B + WS0 pre-sale + Stripe fallback | 8w solo | LOWEST | Validates demand before sunk cost | +1w, requires landing+Stripe minimal |
| D | Club pivot: 1-3 club partnerships | 4-6w | MED-HIGH | Distribution moat | Persona/scope change, needs coach views |

★ Auto-recommended (P1+P2): C combines scope discipline with demand validation. Surfaced at Final Gate as TASTE DECISION (A/B/C/D).

## NOT in scope (auto-decided to defer to V1.1)
- Mode coach équipe (#28), iOS V1 *(TASTE — may elevate)*, full Stripe web UX (keep minimal fallback only), EN locale, dark mode, WS3 dead code sweep, WS4 palette/typo/animation polish, WS6 bundle <500KB obsession, WS7 Sentry install, WS8 E2E Playwright, ASO

## Error & Rescue Registry (V1 user-facing copy gaps)

| Error | Where | Required action |
|---|---|---|
| Carte refusée | Play Billing | WS1 — copy + retry CTA |
| Achat annulé | Play Billing | WS1 — silent return |
| Restore vide | Play Billing | WS1 — empty state |
| Onboarding skip | UserProfile | WS5 — block + explain |
| Disclaimer médical refusé | Onboarding | WS9 — block signup |
| Magic link expired | Login | WS5 — humanize error |
| Email validation pending | Post-signup | WS5+WS9 — explicit screen |
| Network offline | Any page | WS4 — verify SW fallback per page |

## Failure Modes Registry

| Mode | Severity | Mitigation |
|---|---|---|
| Play Console blocked indefinitely | CRITICAL | Stripe web fallback (auto-decided in) |
| <30 paying users by August 31 | CRITICAL | WS0 pre-sale + kill criteria (auto-decided in) |
| D7 retention <40% | HIGH | PostHog funnels live pre-launch (auto-decided in) |
| Onboarding completion <75% | HIGH | WS4 trimmed scope (states only) |
| Disclaimer médical insufficient → injury claim | EXISTENTIAL | Real lawyer review (€500) (auto-decided in) |
| Solo burnout 5+ weeks in | HIGH | Scope cut to 4 WS + 20% buffer |
| RLS policy gap → data leak | EXISTENTIAL | WS2 exhaustive audit P0 |
| Race Google webhook + local refresh | MEDIUM | Idempotence on verify-play-purchase |
| FCM regression mid-bêta | HIGH | Monitor send-training-reminders cron |

## Decision Audit Trail

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | CEO | Reframe success criteria → 3 commercial metrics | Mechanical | P1 | Both voices: 0/10 commercial currently |
| 2 | CEO | Reclassify WS3/4/6/7/8 polish → V1.1 | Mechanical | P3+P5 | 10 WS / 7w solo = unreal |
| 3 | CEO | Add minimal Stripe web fallback | Mechanical | P1 | Decouples release from Play Console |
| 4 | CEO | Remove EN sélecteur from V1 | Mechanical | P5 | Explicit > clever |
| 5 | CEO | Defer dark mode to V1.1 | Mechanical | P3 | Pragmatic, not bloquant |
| 6 | CEO | Defer Sentry install to V1.1, focus PostHog first | Mechanical | P3 | Conversion funnels > error monitoring at 0 paying users |
| 7 | CEO | Add kill criteria (<5 paying by Aug 31 = reassess) | Mechanical | P1 | Risk coverage gap |
| 8 | CEO | Add WS0 pre-sale Founding (49€/an, 20 testers) | TASTE | P1+P2 | C-pattern recommended; user choice at gate |
| 9 | CEO | Approach selection (A/B/C/D) | TASTE | — | At Final Gate |
| 10 | CEO | iOS V1 reassessment (PWA Web Push 16.4+) | TASTE | — | At Final Gate |
| 11 | CEO | Club partnership wedge (Codex unique) | TASTE | — | At Final Gate |

**Phase 1 complete.** Consensus: 0/6 dimensions confirmed valid. 11 auto-decisions logged. 4 surfaced as TASTE/USER CHALLENGE at gate. Passing to **Phase 2 (Design Review)** after Premise Gate.

**Premise Gate result**: User chose **C** (validate-then-polish: 4 P0 WS + WS0 pre-sale + Stripe fallback + commercial criteria + kill criteria). Phase 2/3 review the trimmed scope.

---

# /autoplan REVIEW REPORT — Phase 2 Design Findings

## Design Litmus Scorecard (consensus)

```
══════════════════════════════════════════════════════════════════════
  Dimension                              Subagent  Codex   Consensus
  ─────────────────────────────────────  ─────────  ──────  ──────────────
  1. Information hierarchy specified?    NO         NO      CONFIRMED NO
  2. State matrix complete?              NO         NO      CONFIRMED NO
  3. User journey emotional arc clear?   NO         —       Subagent flag
  4. A11y coverage (not just tools)?     NO         NO      CONFIRMED NO
  5. Specific UI vs generic patterns?    NO         NO      CONFIRMED NO (SaaS slop risk)
  6. Terminology locked?                 NO         NO      CONFIRMED NO
  7. Disclaimer placement decided?       PARTIAL    NO      CONFIRMED NO (contradictory)
══════════════════════════════════════════════════════════════════════
0/7 dimensions clean. 7 high-confidence DISAGREE.
```

## Top Findings (both voices converge)

1. **CRITICAL: Medical disclaimer placement is contradictory + must be hard gate at signup.** Plan says "before signup" + "accepted at onboarding" + "accepted at signup" in different bullets. Codex: "sloppy and legally dangerous". Both voices: **single short plain-French checkbox at signup, blocking, link to full text. Onboarding = only progressive safety reminders, never primary consent.** Copy proposed: *"Je comprends que RugbyForge propose des programmes basés sur des règles générales et ne remplace pas l'avis d'un médecin ou d'un kiné. Je m'engage à arrêter en cas de douleur."* Combined with WS9 €500 lawyer review.

2. **CRITICAL: Critical path hierarchy unspecified per screen.** Plan names funnel (landing → signup → onboarding → home → week → session → checkout) but not order of attention per step. Without spec, implementation defaults to "whatever's already there". **Fix (Codex spec)**: Landing = pain/outcome + Founding 49€/an + Android/Stripe availability + proof. Signup = form + medical consent + email-confirmation expectation. Onboarding = season/rhythm + weekly frequency + club cadence + optional morphology. Home = today's state + CTA, next match, week context. Week = today/next séance, match conflicts, reschedule. Session = start/continue + active bloc/timer + logging. Checkout = annual offer + what unlocks now + provider reassurance. **Also: TWA skips landing entirely → define web vs TWA entry split.**

3. **CRITICAL: State matrix incomplete.** Trimmed WS4 says "loading/empty/error" — real gaps are PARTIAL and CROSS-STATE combinations. **Fix**: page × state matrix:
   - Home: profile loaded + premium unresolved, no next match, no ACWR data, offline cache, stale data
   - Week: program unavailable, no match, sync success + stale schedule, recovery override
   - Progress: logs yes + tests no (most-common new-user state), premium locked partial, empty history with poste baseline ranges as intent CTA
   - Profile/Checkout: Play unavailable + Stripe fallback, restore empty, purchase success + entitlements stale, Play Billing limbo 30s+
   - Session: offline logging queued, save partly failed, completed without final sync
   - Onboarding: resume after refresh, finish failed, email pending
   - Checkout: pending state, declined card, cancel mid-flow, restore empty

## Remaining Findings

4. **HIGH: WS0 pre-sale narrative arc broken (subagent unique).** Plan never says where Founding offer fires in journey. Cold landing-page Founding burns trust and won't convert in amateur rugby (small, suspicious, word-of-mouth). **Fix**: trigger = `first_session_completed === true && D2 active` → email + private LinkedIn DM. The "<5 paying = pivot" kill criteria is meaningless if the offer fires at wrong narrative beat.

5. **HIGH: Responsive strategy = afterthought (Codex).** "Tablet landscape pas oubliée" = forgotten. **Fix**: 3 explicit layouts — phone single-column, TWA/large-phone with sticky bottom actions, tablet landscape two-pane for Week/Session/Profile with capped sheet widths.

6. **HIGH: A11y coverage matrix, not tool checklist.** Plan names axe/Lighthouse/CCA without coverage. **Fix**: explicit coverage for tabs/pills, accordions, bottom sheets, timer overlays, coach dialog, session trackers; keyboard order + focus trap/return; TalkBack/VoiceOver scripts; live announcements for timer/state changes; reduced-motion override on score-de-forme animation; `aria-current` on active week day; screen-reader labels for emoji-only badges (🌿🔥⚡); TWA TalkBack swipe order on FAB CoachCompanion.

7. **HIGH: AI-slop / generic SaaS aesthetic risk INCREASES with trimmed polish.** Both voices: trimming WS4 doesn't remove the aesthetic risk, it raises it. **Anti-pattern banlist** (codify in WS4):
   - No fake KPI walls, no trophy spam, no neon-gym clichés, no overblurred premium bait, no interchangeable feature cards
   - No gradient-purple cards, no glassmorphism, no Lottie celebrations on log-saved
   - No "Crush your goals" / "Let's go champion" copy
   - No 💪🔥⚡ emoji stacks
   - Aesthetic anchor: club shirt, chalk on a tactics board, FFR program sheet. If a screen could ship to a yoga app unchanged, it's wrong.
   - Editorial, grounded, match-aware, slightly rough around the edges. Not cloned wellness dashboard.

8. **HIGH: Canonical UX rules missing.** No single rule for paywall entry, restore-purchase placement, post-purchase destination, email-pending screen, sheet patterns. **Fix**: one primary CTA per screen + one sheet pattern + one premium-lock pattern + one post-purchase success route + one offline/resume behavior.

9. **MEDIUM: Push notif copy bland-trainer, not rugby club culture.** "🏉 Jour de séance !" generic. Tone target = coéquipier, dry, peer-to-peer, slightly chambreur, not Instagram coach. **Variants codified** (synthesis subagent + Codex):
   - Séance jour: "Ta séance du jour est prête. Propre, dense, puis tu passes à autre chose."
   - Deload: "Cette semaine on lève le pied. Récupérer = progresser." OR "Semaine plus légère. On garde du rythme, pas de dette."
   - Recovery/post-match: "Match fini. Hydrate, dors, on se voit jeudi." OR "Match fini. Aujourd'hui, récup sérieuse: eau, marche, mobilité."
   - Veille match: "Pas de chantier aujourd'hui. Activation courte, jambes fraîches."

10. **MEDIUM: Terminology glossary needed (both voices).** Codebase leaks `session`, `training`, `block`, `tour`, `round`. **V1 glossary (lock now in WS5)**:
    - `séance` (user-facing) — never `training`, `workout`
    - `bloc` (structural) — never `block` in FR UI
    - `exercice` (atomic) — never `exercise` in FR UI
    - `tour` (circuit repetition)
    - `intervalle` (timed work) — never `round`
    - `série` (sets within an exercice)
    - Grep audit + ESLint rule on FR strings

11. **MEDIUM: Empty Progress = most-seen new-user screen (subagent unique).** Lasts weeks. Plan groups it with skeletons but it's a real state. **Fix**: spec = "Pas encore de tests. Le CMJ se mesure en 30 secondes. {CTA: lancer le test}" + show baseline ranges for their poste so they know targets.

12. **MEDIUM: Hierarchy rules rugby-specific (Codex).** No dashboard clutter above "séance du jour". No analytics before action. Match context always outranks vanity stats. Premium teasers never block primary workout CTA.

## Decision Audit Trail (Phase 2 additions)

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 12 | Design | Disclaimer médical = hard gate at signup, single checkbox, blocking | Mechanical | P1+P5 | Both voices CRITICAL, legal risk |
| 13 | Design | Add "above the fold" hierarchy spec per screen to WS4 | Mechanical | P1 | Both voices CRITICAL |
| 14 | Design | Page × state matrix (loading/empty/error/partial/offline/cross) replaces "skeletons everywhere" | Mechanical | P1 | Both voices CRITICAL |
| 15 | Design | WS0 trigger = first_session_completed + D2 (not cold landing) | Mechanical | P1 | Subagent narrative arc |
| 16 | Design | 3 responsive layouts (phone / TWA / tablet 2-pane) | Mechanical | P1 | Codex flag |
| 17 | Design | A11y coverage matrix per component, not tool list | Mechanical | P1 | Both voices |
| 18 | Design | Anti-pattern banlist codified in WS4 (no glassmorphism, no Lottie, no gradient-purple, no emoji stacks, no English-fitness slop) | Mechanical | P5 | Both voices |
| 19 | Design | One primary CTA / one sheet pattern / one paywall pattern / one post-purchase route | Mechanical | P5 | Codex |
| 20 | Design | Push notif copy: 4 variants locked (séance jour / deload / récup / veille match) | Mechanical | P1 | Both voices |
| 21 | Design | V1 FR glossary: séance / bloc / exercice / tour / intervalle / série; grep+lint enforce | Mechanical | P5 | Both voices |
| 22 | Design | Define TWA vs web landing entry split (TWA skips landing) | Mechanical | P1 | Codex unique |

**Phase 2 complete.** Subagent: 11 findings (3 critical, 4 high, 4 medium). Codex: 10 findings (3 critical, 4 high, 3 medium). Consensus: 0/7 dimensions confirmed clean. 11 auto-decisions logged, all mechanical (no Phase 2 taste decisions). Passing to **Phase 3 (Eng Review)**.

---

# /autoplan REVIEW REPORT — Phase 3 Eng Findings

## Already-discovered facts (correcting plan inaccuracies)

- **Stripe scaffolding EXISTS already** : `billing-webhook`, `create-checkout-session`, `sync-checkout-session` Edge Functions are present. Plan said "Stripe différer V1.1" — wrong, it's already partially built. WS0 + Approach C "Stripe fallback" is **wiring + idempotence**, not greenfield (**~3-5j CC effort, not 3 weeks**).
- **113 test files exist in `src/`**. Plan WS8 named 5 services as "missing tests": all 5 already have test files (`loadSuggestion.test.ts`, `qualityGates.test.ts`, `safetyContracts.test.ts`, `buildAthletePlanningInputs.test.ts`, `detectAnnualPlanningContext.test.ts`). **WS8 stale, drop entirely from V1.**
- **Real test gap = zero coverage on billing Edge Functions** (verify-play-purchase, billing-webhook, refresh-play-subscription, sync-checkout-session). That's the V1 coverage hole.
- **`/delete-account` route exists** (`src/pages/DeleteAccountPage.tsx`) but **has a critical RLS bug** — see Finding #4.
- **PostHog already integrated** in 5 places (main.tsx, AuthContext, useProgramFeatureFlags, WeekPage, SessionDetailPage). WS7 framing "config PostHog" is wrong — it's audit/extend coverage.
- **`mobile_install_leads`** waitlist + **`cancel_feedback`** churn tables exist; both unused for analytics.

## Eng Dual Voices — Consensus Table

```
══════════════════════════════════════════════════════════════════════
  Dimension                              Subagent  Codex   Consensus
  ─────────────────────────────────────  ─────────  ──────  ──────────────
  1. Architecture sound for V1 trim?     NO         NO      CONFIRMED NO (billing not transactional)
  2. Test coverage sufficient?           NO         NO      CONFIRMED NO (billing Edge Funcs uncovered)
  3. Performance risks addressed?        PARTIAL    NO      CONFIRMED NO (SW 3MB, OAuth per call)
  4. Security threats covered?           NO         NO      CONFIRMED NO (notify-training, RLS DELETE gap)
  5. Error paths handled?                NO         NO      CONFIRMED NO (Stripe period_end null, race)
  6. Deployment risk manageable?         NO         NO      CONFIRMED NO (--no-verify-jwt operator memory)
══════════════════════════════════════════════════════════════════════
0/6 dimensions confirmed clean. CRITICAL bugs present in current shipped code.
```

## CRITICAL findings (must fix before any paid user)

1. **CRITICAL — `notify-training` Edge Function is a privilege escalation vector.** [`supabase/functions/notify-training/index.ts:203`](supabase/functions/notify-training/index.ts) has NO `requireUser`, NO `cron-secret` check, and uses `SUPABASE_SERVICE_ROLE_KEY` to fetch all push subscriptions and broadcast. If JWT verification ON: any authenticated user can broadcast push to all users. If deployed `--no-verify-jwt`: fully public broadcast. **Fix**: hard-gate with `cron-secret` only, or remove from prod and use `dispatch-push-queue` exclusively. Codex flagged this as #1 critical; subagent corroborates auth matrix gap.

2. **CRITICAL — Billing state changes are not serialized, no idempotence ledger.** [`verify-play-purchase/index.ts:96-104`](supabase/functions/verify-play-purchase/index.ts), [`billing-webhook/index.ts:209-242`](supabase/functions/billing-webhook/index.ts), [`sync-checkout-session/index.ts:85`](supabase/functions/sync-checkout-session/index.ts), [`refresh-play-subscription/index.ts:42`](supabase/functions/refresh-play-subscription/index.ts) all do *DELETE entitlements WHERE source='billing'* → *INSERT* as separate statements. Race window = zero entitlements mid-transaction. No `purchaseToken` UNIQUE constraint → same token can be re-verified by another user (account takeover). Stripe `event.id` stored in metadata but not used for dedup → 3-day Stripe replay window grants Premium repeatedly. **Fix (single highest-ROI 1-day task)**:
   - Add `processed_billing_events(event_id PRIMARY KEY, provider, processed_at)` table
   - Add UNIQUE index on `metadata->>'purchase_token'` in `user_subscriptions`
   - Wrap DELETE+INSERT in single Postgres function (`grant_billing_entitlements()` RPC) called from all 4 Edge Functions
   - Reject if `purchaseToken` already bound to different `user_id`

3. **CRITICAL — `billing-webhook` `checkout.session.completed` grants entitlements with `expires_at = null`.** [`billing-webhook/index.ts:209`](supabase/functions/billing-webhook/index.ts) — when this event arrives before `subscription.created` (Stripe order not guaranteed), entitlements activate without a period end → infinite Premium. **Fix**: gate checkout.session.completed on expanded subscription data; rely on `customer.subscription.created/updated` for activation; persist customer mapping at `create-checkout-session` time, not after.

4. **CRITICAL — `/delete-account` RLS bug — the route silently fails for billing tables.** [`src/pages/DeleteAccountPage.tsx:77-79`](src/pages/DeleteAccountPage.tsx) does `supabase.from('user_entitlements').delete()` and `from('user_subscriptions').delete()` directly from client. Migration [`20260306000000_backend_foundation.sql`](supabase/migrations/20260306000000_backend_foundation.sql) lines 144 and 184 only expose `SELECT` policies. **DELETE silently RLS-fails — user thinks they deleted their account, billing data remains.** This is an RGPD violation existential risk (Codex unique finding). **Fix**: route DELETE through service-role Edge Function with cascade logic, OR add RLS DELETE policy on user-owned rows.

## HIGH findings

5. **HIGH — Edge Function auth matrix not codified.** Cron-target functions (`send-training-reminders`, `dispatch-push-queue`) require `--no-verify-jwt` deploy flag (operator memory only). Same for `billing-webhook` (Stripe must reach it). Today: either broken or exposed, depending on operator memory. **Fix**: commit `supabase/functions/AUTH_MATRIX.md` + deploy script with explicit per-function `--no-verify-jwt` flags. WS2 mandate.

6. **HIGH — RLS coverage asymmetric.** With 50+ migrations, classic failure = SELECT policy added, UPDATE/DELETE forgotten. [`20260415000000_drop_permissive_push_subscriptions_policies.sql`](supabase/migrations) shows you've already shipped one fix. **Fix**: SQL audit query — `SELECT tablename, COUNT(*) FROM pg_policies GROUP BY tablename HAVING COUNT(*) < 4`. Any table with <4 policies = manual review required. Specifically suspect: `mobile_install_leads`, `cancel_feedback`, `user_entitlements` (DELETE missing — see #4), `user_subscriptions` (DELETE missing — see #4).

7. **HIGH — `mobile_install_leads` anon write surface.** [`20260428200000_mobile_install_leads.sql:13`](supabase/migrations/20260428200000_mobile_install_leads.sql) `WITH CHECK (true)` → anyone can insert unlimited rows. [`SignupOrInstallCTA.tsx:270`](src/components/SignupOrInstallCTA.tsx) writes directly. **Fix**: add IP rate limit (Cloudflare Turnstile or Supabase rate limiter) + length caps on email/source fields.

8. **HIGH — SW/TWA mixed-version risk.** [`src/sw.ts:49`](src/sw.ts) uses `registerType: 'prompt'` + [`UpdatePrompt.tsx:63`](src/components/UpdatePrompt.tsx) lets user dismiss indefinitely. In TWA (tab never closes), stale JS lives against new DB/function contracts for days. At 200 concurrent users post-migration this means mixed schema versions hitting Edge Functions. **Fix**: forced reload after 7-day grace, OR backward-compatible API contract discipline (mandatory).

9. **HIGH — `send-training-reminders` no uniqueness guard.** [`send-training-reminders/index.ts:229`](supabase/functions/send-training-reminders/index.ts) — replays/double-cron can spam users. **Fix**: UNIQUE constraint on `notification_delivery_logs(user_id, scheduled_for, kind)` + INSERT ON CONFLICT DO NOTHING.

10. **HIGH — Cron migration hardcodes project URL.** [`20260507000000_schedule_training_reminders_cron.sql:49`](supabase/migrations/20260507000000_schedule_training_reminders_cron.sql) — hardcoded `https://...supabase.co/functions/v1/...`. Breaks staging/restore/clone environments. **Fix**: read from vault secret or pg_settings.

11. **HIGH — `verifyPlayPurchase` fetches Google OAuth token on every call.** [`_shared/playBilling.ts:33`](supabase/functions/_shared/playBilling.ts) — adds 200-500ms p50 latency on cold-path purchase verify. **Fix**: cache access_token in Deno KV with 50-min TTL.

12. **HIGH — Stripe webhook signature timestamp tolerance.** Verify `_shared/stripe.ts` enforces 5-min timestamp tolerance — without it, replay attack trivial.

## MEDIUM findings

13. **MEDIUM — `playBilling.ts` `btoa(JSON.stringify(...))` will break on unicode.** [`_shared/playBilling.ts:39-48`](supabase/functions/_shared/playBilling.ts) — service account email is ASCII today; if rotated to unicode metadata, signature fails silently. Replace with `TextEncoder` UTF-8 path.

14. **MEDIUM — `cancel_feedback` table write-only.** No PostHog dashboard, no weekly query. **Fix (WS7 trimmed scope)**: cron weekly query → email Hugo top 3 cancel reasons.

15. **MEDIUM — Bubblewrap signing key drift.** `android.keystore` in `.gitignore`. Lost = locked out of Play Console updates forever. **Fix**: encrypted backup to 1Password + offline drive **before** first paid release. Plan doesn't mention.

16. **MEDIUM — Supabase free-tier 7-day pause.** Cron functions don't count as activity for pause timer. **Fix**: keepalive + upgrade to Pro ($25/mo) before public launch (SLA matters with paying users).

17. **MEDIUM — Magic-link rate limit Supabase default = 4/hour/IP.** Clubhouse of testers behind one NAT will lock each other out. **Fix**: configure dashboard limit + bypass for known IPs during beta.

## What the plan misses on architecture

- **Event ledger**: critical for billing reliability. Not mentioned anywhere.
- **AUTH_MATRIX.md**: plan says "documenter dans `supabase/functions/AUTH_MATRIX.md`" — good, must include `--no-verify-jwt` flags + deploy script.
- **RTDN (Real-Time Developer Notifications)** for Google Play renewals: relies on client opening app per [`useEntitlements.ts:78`](src/hooks/useEntitlements.ts). This is "WS1 production-grade" missing piece.
- **Load test plan** for 200 concurrent: missing.
- **Schema-compatible migration discipline**: not mentioned; required given TWA stale-version risk.

## Architecture ASCII Diagram (V1 trimmed scope)

```
                  ┌────────────────────────────────────────┐
                  │   Client (React 19 SPA / TWA Android)  │
                  │  • Onboarding + signup hard-gate       │
                  │  • Home / Week / Session / Progress    │
                  │  • Checkout (Play Billing OR Stripe)   │
                  │  • PostHog events                      │
                  └──────┬────────────┬─────────────┬──────┘
                         │            │             │
              JWT auth   │            │ JWT auth    │ anon (rate-limited)
                         ▼            ▼             ▼
            ┌────────────┐ ┌─────────────────┐ ┌──────────────────┐
            │ Edge Funcs │ │ Direct table    │ │ mobile_install_  │
            │ (RPC-style)│ │  (RLS-gated)    │ │     leads        │
            └────────────┘ └─────────────────┘ └──────────────────┘
                  │
   ┌──────────────┼─────────────────┬────────────────┬─────────────────┐
   ▼              ▼                 ▼                ▼                 ▼
verify-play-  billing-webhook   sync-checkout-   ai-coach         register-push
purchase     (Stripe sig+ts)    session          (entitlement     subscription
(JWT)         (--no-verify-jwt) (JWT)             gate)
   │              │                 │
   ▼              ▼                 ▼
  ┌─────────────────────────────────────────────┐
  │  *** NEW: grant_billing_entitlements RPC *** │ ← single source of truth
  │  with processed_billing_events ledger        │
  │  + UNIQUE(purchase_token) + UNIQUE(event_id) │
  └─────────────────────────────────────────────┘
                       │
                       ▼
       ┌──────────────────────────────────┐
       │  user_subscriptions (RLS)         │
       │  user_entitlements (RLS — fix     │
       │     DELETE policy for delete acct)│
       │  processed_billing_events (NEW)   │
       └──────────────────────────────────┘

Cron pipeline (--no-verify-jwt + x-cron-secret):
   pg_cron (hourly) ──► send-training-reminders ──► dispatch-push-queue ──► FCM
                                  │
                                  └─► notification_delivery_logs (NEW UNIQUE constraint)

External:
   Google Play RTDN ──► [MISSING] webhook handler ──► billing event ledger
   Stripe webhooks  ──► billing-webhook (verify ts + dedup event_id)

LEGACY / TO-REMOVE:
   notify-training (auth gap — gut or hard-gate)
```

## Failure Modes Registry (Eng additions)

| Mode | Severity | Mitigation |
|---|---|---|
| Concurrent verify+webhook race grants double Premium | CRITICAL | Idempotence ledger + RPC |
| Account takeover via leaked purchaseToken | CRITICAL | UNIQUE constraint on purchase_token + user_id binding |
| Stripe replay (3-day retry window) grants extra months | CRITICAL | event_id ledger |
| checkout.session.completed before subscription.created → infinite Premium | CRITICAL | Gate activation on expanded subscription data |
| /delete-account silently fails on billing tables (RGPD) | CRITICAL | Service-role Edge Function OR RLS DELETE policy |
| notify-training abuse (broadcast spam) | CRITICAL | Hard-gate cron-secret OR remove |
| send-training-reminders 2am Friday spam (replay) | HIGH | UNIQUE on (user_id, scheduled_for, kind) |
| TWA stale JS hits new schema | HIGH | Forced reload after grace OR backward-compat discipline |
| mobile_install_leads anon insert spam | HIGH | Rate limit + length caps |
| Lost Bubblewrap signing key | EXISTENTIAL | Encrypted backup 2 locations |
| Supabase free-tier project pause | HIGH | Upgrade to Pro before public launch |

## Decision Audit Trail (Phase 3 additions)

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 23 | Eng | Add `processed_billing_events` ledger + `grant_billing_entitlements` RPC + UNIQUE(purchase_token) + UNIQUE(stripe event_id) — 1 day CC | Mechanical | P1 critical | Both voices CRITICAL #1 ROI |
| 24 | Eng | ✅ DONE 2026-05-07 — `notify-training` deleted entirely (no callers, redundant with dispatch-push-queue) | Mechanical | P1 | Both voices privilege escalation |
| 25 | Eng | Fix `billing-webhook` checkout.session.completed period_end null path | Mechanical | P1 | Codex: infinite Premium |
| 26 | Eng | ✅ DONE 2026-05-07 — `delete-account` Edge Function (service-role auth.admin.deleteUser + explicit set-null cleanups) replaces client-side DELETEs | Mechanical | P1 | Codex: RGPD bug |
| 27 | Eng | Codify `supabase/functions/AUTH_MATRIX.md` + deploy script with per-function `--no-verify-jwt` | Mechanical | P5 | Operator memory failure mode |
| 28 | Eng | RLS audit query (count policies per table <4 = review) | Mechanical | P2 | Both voices |
| 29 | Eng | Rate limit `mobile_install_leads` anon write | Mechanical | P1 | Codex unique |
| 30 | Eng | UNIQUE constraint on `notification_delivery_logs` | Mechanical | P1 | Codex |
| 31 | Eng | Cache Google OAuth access_token (Deno KV, 50min TTL) | Mechanical | P3 | Cold-path latency |
| 32 | Eng | Drop WS8 entirely (113 tests already cover claimed services) | Mechanical | P4 | Both voices: stale claim |
| 33 | Eng | Replace WS8 with billing Edge Function tests (verify-play-purchase, billing-webhook, sync-checkout, refresh-play) | Mechanical | P1 | Real coverage gap |
| 34 | Eng | Encrypted Bubblewrap keystore backup (1Password + offline) before first paid release | Mechanical | P1 | Subagent unique |
| 35 | Eng | Upgrade Supabase to Pro before public launch | Mechanical | P3 | Subagent: free-tier pause |
| 36 | Eng | Configure magic-link rate limit (NAT-aware) | Mechanical | P3 | Subagent unique |
| 37 | Eng | Implement Google Play RTDN webhook handler | TASTE | P1 | Surfaced at gate (was outside scope, but Codex flags as "production-grade" gap) |

## NOT in scope (Eng additions to V1.1 deferral list)

- Load testing infrastructure (200 concurrent simulation) — defer V1.1
- React 19 bundle splitting beyond current Vite chunks — defer
- Edge Function performance baselines (p50/p95 dashboards) — partial in WS7 PostHog scope
- Schema-compatible migration discipline framework — adopt as practice, no infra build

**Phase 3 complete.** Subagent: 12 findings (3 critical, 4 high, 5 medium). Codex: 11 findings (3 critical, 5 high, 3 medium). Consensus: 0/6 dimensions confirmed clean. **4 CRITICAL bugs in shipped code** (notify-training auth, billing race + idempotence missing, Stripe period_end null path, /delete-account RLS DELETE silent fail). 14 mechanical auto-decisions. 1 TASTE (RTDN scope). Test plan artifact written separately. **Phase 3.5 (DX) skipped — RugbyForge is B2C consumer app, no developer audience. DX heuristic triggered on incidental Edge Function vocabulary; eng review covered Edge Function quality.**

---

# /autoplan REVIEW REPORT — Cross-Phase Themes

**Theme 1 (HIGH-CONFIDENCE)**: **V1 has tactical execution gaps that compound** — flagged in CEO (no kill criteria, no demand validation), Design (state matrix incomplete, hierarchy unspecified), Eng (no idempotence ledger, no AUTH_MATRIX). Pattern: plan describes intent without enforceable contracts. Mitigation: 14 of 37 auto-decisions add explicit contracts (UNIQUE constraints, ledgers, state matrices, glossaries).

**Theme 2 (HIGH-CONFIDENCE)**: **Specificity gaps invite drift to generic** — flagged in CEO (GTM is not a plan, 6 channels in 1 bullet), Design (SaaS slop risk, "skeletons everywhere" generic), Eng (operator memory failure mode for `--no-verify-jwt` flags). Pattern: when V1 trims polish, ambiguity defaults to generic. Mitigation: anti-pattern banlists (Design Decision #18), glossary (#21), AUTH_MATRIX (#27).

**Theme 3 (CRITICAL)**: **Plan optimizes for known unknowns, misses known knowns** — Eng phase found 4 bugs in SHIPPED CODE that the plan doesn't acknowledge: notify-training privilege escalation, /delete-account RLS DELETE silent fail (RGPD), billing race condition, Stripe checkout.session.completed grants infinite Premium. Pattern: 7-week diagnostic phase doesn't help if you don't know what to look for. Mitigation: critical fix list (Decisions #23, #24, #25, #26) precedes all polish.

# /autoplan REVIEW REPORT — Final Gate

## Plan Summary
RugbyForge V1 — Android-first PWA + TWA fitness app for amateur rugby. Solo founder Hugo. Original plan: 10 workstreams, 7 weeks, audit-then-fix. **Reframed at Premise Gate to Approach C**: 4 P0 WS (paiement, sec, légal, beta) + WS0 pre-sale Founding 49€/an + Stripe fallback + commercial success criteria + kill criteria. **Phase 3 found 4 CRITICAL bugs in shipped code that take precedence over polish.**

## Decisions Made: 37 total (33 auto-decided mechanical, 3 taste, 1 user-challenge resolved at Premise Gate)

## Review Scores
- **CEO**: 3.4/10 (engineering vs commercial misframing — resolved at Premise Gate by C choice)
- CEO Voices: Codex 7 concerns / Subagent 14 concerns / Consensus 0/6 confirmed valid → resolved
- **Design**: 0/7 dimensions clean → 11 mechanical auto-decisions added contracts (state matrix, hierarchy, anti-pattern banlist, glossary, push variants, disclaimer hard gate)
- Design Voices: Codex 10 / Subagent 11 / Consensus 0/7 confirmed clean
- **Eng**: 0/6 dimensions clean → **4 CRITICAL bugs in shipped code** + 14 mechanical fixes
- Eng Voices: Codex 11 / Subagent 12 / Consensus 0/6 confirmed clean
- **DX**: skipped (B2C product, no developer audience)

## Surfaced TASTE / USER CHALLENGE decisions

### TC1 — Google Play RTDN webhook (production-grade gap)
Decision #37 (Eng phase). Plan WS1 "production-grade" claim is incomplete without RTDN — currently renewals only sync when client opens app. Codex flagged. Adding RTDN = +1 day CC effort, new Edge Function `play-rtdn-webhook` + Pub/Sub config. **Recommendation: ADD to V1 P0** (same priority as billing-webhook for Stripe).

### TC2 — iOS reassessment (Subagent factual claim)
Plan defers iOS to "V2 majeur" citing "no Web Push iOS Safari, TWA inexistant". Subagent counter (factually correct): iOS 16.4 (March 2023) ships Web Push for **installed PWAs** (added to home screen). ~50% French smartphone share. Capacitor scaffolding exists in repo (`ios/`). Realistic effort: 2-3 weeks PWA-with-push (not "V2 majeur"). **Recommendation: defer V1.1, but reassess in 2 weeks** rather than write off entirely.

### TC3 — Club B2B2C wedge (Codex unique reframing)
Codex 10x reframing: "own pre-season conditioning for ONE club" via 1-3 club partnerships. Major persona/scope change. NOT in current Approach C. **Recommendation: do NOT pivot now**, but include "talk to 3 clubs in week 7-8 beta" as exploratory parallel track to inform V1.1 GTM decision.

## Critical Path (revised V1, Approach C + critical fixes)

| Week | Focus | Critical deliverables |
|---|---|---|
| 0 | WS0 + idempotence ledger | Founding 49€/an pre-sale to 20 testers + `processed_billing_events` table + `grant_billing_entitlements` RPC + UNIQUE constraints |
| 1-2 | WS1 + WS2 critical fixes | notify-training fix, /delete-account RLS fix, Stripe period_end fix, AUTH_MATRIX, RLS audit, headers |
| 3-4 | WS9 légal + UI states | Lawyer review, disclaimer hard gate, state matrix per page, hierarchy spec, push variants |
| 5 | WS6 perf + WS7 obs | Lighthouse pass, PostHog funnels (signup→checkout→D7), cancel_feedback wired, healthcheck |
| 6 | Bêta finale 20-50 | 0 P0 sur 7d, Bubblewrap key backup, Supabase Pro upgrade |
| 7 | Release + Stripe fallback | Play Store submit + Stripe web live (decouple from Play Console) |
| 8 (buffer) | Launch + Founding kill criteria check | If <5 paying by Aug 31 → reassess |

**Anchor: Pre-saison FR rugby = July/August. June 30 = hard scope-cut deadline. June 25 + 1 week buffer = realistic launch July 7.**

## Deferred to V1.1 / V2

- WS3 dead code sweep (zero buyer impact pre-revenue)
- WS4 palette/typo/animation/dark mode (states + a11y kept in V1 trim)
- WS6 bundle <500KB obsession (Lighthouse pass kept)
- WS7 Sentry full install (PostHog funnels first)
- WS8 E2E Playwright (113 unit/integration tests sufficient)
- EN locale (selector removed in V1)
- iOS V1 (TC2 reassess in 2w)
- Mode coach équipe #28 (V2 differentiator)
- Stripe full UX beyond checkout fallback
- Load testing infrastructure
- Club B2B2C pivot (TC3 explore in beta phase 6)

## Final Gate Result

**APPROVED AS-IS** (2026-05-07 09:38 UTC, commit bdec645). User accepted all 33 mechanical auto-decisions + 3 taste recommendations as approved direction. Plan ready for execution.

**Next step recommended**: start with the single highest-ROI 1-day task — Decision #23 (idempotence ledger + grant_billing_entitlements RPC). Once shipped, the 3 other CRITICAL bugs (notify-training, /delete-account RLS, Stripe period_end) become 1-2 day fixes each. Total Week 0 = idempotence ledger + WS0 pre-sale launch.

After Week 0 ships, run `/ship` to bundle commits into a clean PR series.


