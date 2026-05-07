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

### WS9 — Légal / RGPD (P0)

**Objectif** : conformité de base pour un produit payant en France/UE.

**Tâches** :
- **CGU à jour** avec Play Billing
- **Politique de confidentialité** : exhaustive (Supabase, PostHog, Stripe si on l'inclut, Sentry, FCM)
- **Cookies** : bandeau si nécessaire (PostHog est analytics → consent)
- **Droits utilisateur** : suppression compte (route `/delete-account` existe — vérifier qu'elle vide vraiment toutes les tables liées + cascade Supabase)
- **Disclaimer médical** : explicite, accepté à signup

### WS10 — Beta → release (P0)

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
