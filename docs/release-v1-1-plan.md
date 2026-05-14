# Release V1.1 — Plan & backlog consolidé

**Status** : Plan de référence post-V1. À mettre à jour au fil des décisions.
**Trigger V1.1** : V1 stable en prod 2-3 semaines + 0 P0 ouvert + ≥10 paying users (kill criteria pas atteint).
**Effort total estimé** : 3-4 sem solo si tout fait, mais probable trim à 1.5-2 sem avec priorisation.

## 1. Workstreams P1/P2 déférés (Approach C trim V1)

| WS | Contenu | Effort estimé | Anchor |
|---|---|---:|---|
| **WS3** Code cleanup | `knip` dead code audit (44 fichiers candidats à vérifier un par un — beaucoup de false positives `motherSession/*` et SW), `npm audit` 6 vulns transitives via `@capacitor/assets`, refactor legacy | 1-2j | Pré-V1.1 stabilisation |
| **WS4** Design polish | State matrix par page (loading/empty/error/partial/offline/cross-state), anti-pattern banlist codifiée, 3 layouts responsive (phone / TWA / tablet 2-pane), a11y coverage matrix | 3-5j | Post bêta feedback design |
| **WS5** Wording / Copy | Audit complet onboarding step headers + empty states. Voice/tone guidelines `docs/voice-and-tone.md`. **Trivial fixes V1 déjà shipped** (cf. `docs/v1-1-wording-audit.md`). Hero + CTA "Activer Premium" déjà décidés et appliqués. | 1-2j | Post bêta feedback wording |
| **WS6** Performance | Au-delà du Lighthouse pass V1 — bundle splitting fin, lazy loading images, Core Web Vitals optim (INP < 200ms target) | 2-3j | Si perf flags PostHog |
| **WS7** Observabilité | **Sentry** frontend + Edge Functions, alerting Slack (compte Sentry gratuit jusqu'à 5k events/mois) | 1-2j | Dès V1 release |
| **WS8** Tests E2E | Playwright/Cypress : signup → onboarding → 1ère séance → checkout Premium/Founding → restore | 3-4j | Post WS7 (Sentry détecte les régressions) |

## 2. Items techniques déférés des Décisions V1

| Item | Provenance | Effort | Trigger |
|---|---|---:|---|
| **iOS PWA push différé** : Server-scheduled push (Edge Function + cron table) pour rest-end notif iOS PWA | #38 / B1 review | 3-5j | Si iOS testeurs réclament |
| **Cap 100 founding hard enforce** | WS0 follow-up | 0.5-1j | **Spec §2.1** — déclencher avant vente massive ; pas seulement « si conversion ~80 » si promesse légale « 100 premiers » |
| **Email transactionnel Founding** : Resend wire-up + Edge Function `send-founding-offer` + template + DM auto | #50 / WS9 phase E | 0.5-1j | Si volume bêta > 30 testeurs |
| **hCaptcha sur `mobile_install_leads`** | F2 / WS2 watchlist | 0.5j | Si spam observé |
| **CSP `'unsafe-inline'` → nonces** : refactor build process Vite | F3 / WS2 watchlist | 1-2j | Audit sécu V1.1 |
| **COOP/COEP headers** : Cross-Origin Opener Policy + Embedder Policy | F7 / WS2 watchlist | 0.2j | Si SharedArrayBuffer requis (V1.2+) |
| **Bubblewrap RTDN** : Real-time Developer Notifications Google Play | WS10 punt | 1-1.5j | Post-WS10 Play Console stable |
| **Magic-link rate limit hardening** : custom IP/user buckets | WS2 audit | 0.5j | Si auth abuse observé |
| **Tests E2E achat Premium** : Cycle complet purchase → unlock → restore → cancel → degrade gracieux | WS1 audit | 1-2j | Cumulé avec WS8 |

### 2.1 Founding « 100 premiers » — spec d’implémentation (référence)

**État V1 (avant ce hardening)** : la promesse marketing « 100 premiers » / tarif Founding n’est **pas** appliquée côté serveur. Ni la **création de compte** ni la **seule apparition de la modale** ne consomment une place. Le plan `founding_yearly` existe en base (`plans` + `plan_entitlements`) ; `grant_billing_entitlements` accorde tout abonnement founding payant qui arrive, sans plafond.

**Définition métier recommandée (à figer avant code)** :

- Les **100 Founding** = les **100 premiers abonnements founding effectivement accordés** après paiement reconnu (entrée idempotente dans le ledger + upsert subscription / entitlements), **pas** les 100 premiers comptes créés **ni** les 100 premiers utilisateurs ayant vu la modale.
- Un panier Stripe / un clic Play **sans** événement billing aboutissant à un `grant` réussi **ne compte pas**.
- Réessais / rejoues d’événements idempotents **ne doivent pas** double-compter (déjà couvert si le garde lit l’état **après** la logique idempotence ou compte les `user_subscriptions` distinctes `plan_id = founding_yearly` en statut payant).

**Livrables techniques (ordre conseillé)** :

1. **Source de vérité du cap**  
   - Option A : `SELECT count(*)` filtré sur `user_subscriptions` où `plan_id = 'founding_yearly'` et `status in ('active','trialing')` (adapter si annulations / refunds doivent libérer une place — **décision produit** : en général **non**, on ne recycle pas les places Founding).  
   - Option B : table dédiée `founding_slots_issued` (user_id, granted_at) pour audit clair — utile si litiges.

2. **Garde dans `grant_billing_entitlements`** (ou RPC appelée **avant** upsert subscription pour `p_plan_id = 'founding_yearly'`)  
   - Si `count >= 100` **et** que l’utilisateur **n’a pas déjà** une subscription founding active : `raise exception` avec code métier stable (ex. `founding_cohort_full`) **après** les checks idempotence pour ne pas bloquer les replay légitimes du **même** user déjà founding.  
   - Documenter le comportement Stripe webhook / Play verify : erreur → retry-safe ; utilisateur voit message « Offre terminée » / redirection support.

3. **Ceinture + bretelles**  
   - Dès que `count >= 100` : **désactiver** le SKU founding côté Play Console **et** retirer / désactiver le price Stripe founding (ou arrêter `create-checkout-session` pour ce plan) pour éviter les paiements orphelins ; le garde RPC reste la vérité juridique si un paiement passe quand même.

4. **UI**  
   - Modale Founding + carte Profil + landing : état « places épuisées » (copy légale alignée). Compteur optionnel « X/100 » **uniquement** si alimenté par une requête serveur ou feature flag (pas de faux compteur client-seul).

5. **Tests**  
   - Étendre `supabase/tests/grant_billing_entitlements.test.sql` : cas founding #101 rejeté, founding même user replay OK, founding user existant upgrade path si applicable.

6. **Alignement copy**  
   - `LandingPage` / modale : préciser que la limite porte sur les **souscriptions founding**, pas sur l’inscription seule — une fois §2.1 ship.

**Références code actuelles** : migration `20260507130000_billing_idempotence_ledger.sql` (`grant_billing_entitlements`), plan `20260509150000_plan_founding_yearly.sql`.

## 3. Items emergés bêta V1 (à ajuster post-bêta)

### 3.1 i18n exercices EN/FR (nouveau — Décision V1.1)

**Contexte** : `docs/exercises-i18n-lexicon.md` compile la table EN→FR des exos mother sessions. Le champ `profiles.preferred_language: 'en' | 'fr'` existe déjà côté DB.

**Déjà partiellement ship (pré-V1.1)** : génération `motherSessionExerciseFr.ts`, helper `localizeMotherSessionExerciseName`, fichier `motherSessionDirectiveFr.ts` pour les **directives** warm-up (ramp-up, prep sets, etc.), démos vidéo via `resolveExerciseIdForDemo` + `WarmupBlock` / fiche séance — voir lexique § Notes.

**Reste V1.1 (backlog)** :
1. Parser `.md` → artefact typed unique (si on unifie lexique + overrides) ou garder le pipeline actuel documenté
2. Couverture complète des renders d’exercices hors mother session si besoin
3. Toggle / persistance UX langue (déjà champ profile — vérifier tous les flux)
4. Audit qualité des mappings (cas ambigus listés dans le `.md`)

**Effort** : ~1-1.5j (réduit vs plan initial si on considère le pipeline actuel comme base).

### 3.2 B1 push Doze validation post-empirique

Selon résultats du test plan `docs/b1-doze-validation-testplan.md` exécuté en bêta :
- **Tout PASS** sauf T6 attendu → close B1 (Décision #54 already partial SHIPPED)
- **Fails Samsung/Xiaomi** → onboarding step "désactive Sleeping apps pour RugbyForge" (1-2h)
- **Fails Pixel vanilla** → escalade P0 → architecture push-serveur (3-5j cumulé avec §3.1 iOS push)

### 3.3 Notif persistante "rest in progress" (mitigation Doze)

Pattern Spotify/YouTube Music : SW affiche une notif silencieuse "Repos: Xs left" pendant le rest qui update à la fin. Survit partiellement à Doze (si SW killed, dernière notif statique). **Effort** : 0.5j. Synergique avec B1 si fail observé.

## 4. Items UX/UI suggested (V1.1+)

- **Founding modal CTA secondaire "Voir tous les avantages"** : expand details au lieu de checkout direct
- **ProfilePage premium card refactor** : composant unifié 3 plans (Monthly/Yearly/Founding) avec selector intégré
- **/landing redirect TWA** : skip landing pour utilisateurs TWA (déjà identifié review §502, ne pas surface marketing à un user déjà installé)
- **Chat IA quota indicator** : "3/3 messages aujourd'hui" visible avant le 3e message envoyé
- **Onboarding cookie consent** : remplacer le bandeau RGPD par une étape onboarding dédiée (UX plus propre sur mobile que banner)
- **Empty states personnalisés** : HistoryPage / ProgressPage Tests / WeekPage sans match / Calendrier vide — illustrations + CTA action-oriented
- **Wording audit onboarding step-by-step** + voice/tone doc (cf. `docs/v1-1-wording-audit.md`)

## 5. Items produit / GTM

| Item | Description | Décision |
|---|---|---|
| iOS PWA reassessment | 2 semaines post V1 release, re-décider si push iOS séparé ou Android-first uniquement | Taste pending |
| Club B2B2C wedge | Pivot ou parallel track : "own pre-season conditioning for ONE club" via 1-3 club partnerships | Codex 10x reframe, explore beta phase 6 |
| ACL prevention femmes | Routing supprimé via #47 avec buildWeekProgram. Si réintroduction voulue → V1.1 via motherSession path (claim "stabilité hanche" pas médical) | #47 cleanup |
| Founding cohort tracking + DM automation | Au lieu de DM manuel, automation segment PostHog → Resend campaign | WS9/WS10 V1.1 |
| RTDN Google Play | Notifs server-side de Google sur changements abo (cancel mid-period, refund, account hold) | Taste pending V1 vs V1.1 |
| 5-user WTP interviews | Pre-launch validation pricing si conversion <30% | Subagent finding |

## 6. Dependencies externes V1.1

- **Sentry** account gratuit (5k events/mois). DSN à provisionner.
- **Resend** account (10k emails/mois gratuit) pour email transactionnel founding.
- **Playwright** setup CI (GitHub Actions ou équivalent).

## 7. Priorisation suggérée V1.1 (sprint 1 : ~1.5 sem)

**Si V1 atteint kill criteria positif** (≥10 paying, 0 P0) :

1. **WS7 Sentry** (1-2j) — observabilité prod ASAP
2. **i18n exercices EN/FR** (~1-1.5j restant, cf. §3.1) — différenciateur amateur FR
3. **WS3 code cleanup léger** (0.5j) — réduire dette technique
4. **Founding cap 100 hard enforce + counter UI** (0.5-1j) — **§2.1** ; prioriser dès que la promesse « 100 » est contractualisée ou que le volume approche le plafond, pas uniquement au signal « ~80 conversions »
5. **B1 follow-up** selon résultats test empirique (0.5-1.5j variable)

**Total sprint 1** : ~4-7j focal. Tout le reste = sprint 2-3 ou drop.

## 8. Anchors décision

- **Trigger V1.1** : V1 stable 2-3 sem + 0 P0 + ≥10 paying users + bêta feedback triagé.
- **Kill criteria atteint** : <5 paying par Aug 31 → reassess plan V1 avant V1.1.
- **Pivot signal** : si club B2B2C montre traction durant bêta (TC3 explore en beta phase 6), V1.1 GTM pivot.

## 9. Journal (pré-V1.1, extraits factuels)

- **Founding modal** : correctif bug « Plus tard » — une seule instance de `useHintVisibility` pour le hint founding (sinon `eligible` ne se mettait pas à jour) ; garde-fous tactile / safe-area / backdrop. CTA recovery : **Profil** (carte Founding) + route **`/founding`** (force-show session).
- **PlanningContextCard** : effet sync `visible` → panneau sans `setState` synchrone lint-interdit (réouverture seulement sur transition `visible` false→true).

## 10. Références

- `docs/release-v1-plan.md` — Plan V1 (54 Décisions audit trail)
- `docs/ws10-launch-checklist.md` — Ops checklist pré-release V1
- `docs/v1-1-wording-audit.md` — Audit copy V1 + propositions tone (hero + CTA déjà décidés)
- `docs/b1-doze-validation-testplan.md` — Test plan empirique B1
- `docs/ws9-lawyer-pack.md` — Pack lawyer review V1
- `docs/exercises-i18n-lexicon.md` — Lexique EN→FR + notes (directives → `motherSessionDirectiveFr.ts`)
- `src/services/motherSession/motherSessionDirectiveFr.ts` — Directives mother session FR
