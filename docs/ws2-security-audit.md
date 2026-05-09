# WS2 — Security audit V1 (RLS + headers + auth)

**Status** : ✅ SHIPPED 2026-05-09 — Décision #51 dans `docs/release-v1-plan.md`.
**Commits main** : c1604c1 (A) → 64e4b74 (C+D) → [E+F].

## Wall-clock pending pour clore intégralement WS2

**Action user (dashboard Supabase)** :
1. Vérifier les rate limits Auth (Project Settings → Auth → Rate limits) :
   - Magic Link : ≤ 10 / heure / IP recommandé
   - OTP : ≤ 60 / heure / IP recommandé
   - Signup : ≤ 30 / heure / IP recommandé
2. **Activer hCaptcha** sur Auth (Project Settings → Auth → CAPTCHA) — limite spam signup ; couvre aussi le risque mobile_install_leads si on l'étend en V1.1.
3. **Vérifier bucket `avatars`** existe (Storage → Buckets) avec public bucket = ON. Les policies viennent de la migration 20260509110000.
4. `npx supabase db push` pour appliquer la migration storage avatars.



## Périmètre

- **RLS audit** : 20 tables `public.*` + storage buckets
- **Cloudflare _headers** : CSP, HSTS, X-Frame, Referrer-Policy, Permissions-Policy
- **Auth rate limit** : magic-link, signup, OTP (Supabase dashboard side)
- **Storage RLS** : bucket `avatars`

## Phase A — Findings

### A.1 RLS / Policies (DB)

**Inventaire** : 20 tables `public.*`, **toutes ont RLS enabled**, 19/20 ont au moins 1 policy. `processed_billing_events` a RLS sans policy = **service-role-only** (canonique pour ledger).

**Patterns observés** :
- ✅ Tables user-data (`athletic_tests`, `block_logs`, `exercise_set_logs`, `match_calendar`, `notification_preferences`, `profiles`, `session_logs`, `user_dismissed_hints`) : `auth.uid() = user_id` cohérent (`for all using/with check`).
- ✅ Tables read-only catalogue (`plans`, `plan_entitlements`) : `using (true)` sur SELECT — public catalog.
- ✅ Tables service-side (`user_subscriptions`, `user_entitlements`) : SELECT policy pour user, INSERT/UPDATE via Edge Functions service role.
- ✅ Multi-tenancy (`club_athlete_memberships`, `club_staff_memberships`, staff read sur `match_calendar` + `session_logs`) : sous-requêtes correctes via `club_staff_memberships`.
- ✅ `push_subscriptions` legacy permissive policies (`allow_insert/upsert/delete` avec `using/check (true)`) **droppées par migration `20260415000000`**. Reste seulement `Users read own push subscriptions` SELECT — toutes les écritures passent par Edge Functions service role.
- ✅ `mobile_install_leads` : `with check (true)` sur INSERT only (anon → marketing leads). Lecture restreinte service-role. Comportement voulu.
- ✅ `cancel_feedback` : INSERT user-scoped, SELECT service-role. Correct.
- ✅ `delete-account` Edge Function (#26) : `verify_jwt = true`, lit `user_id` du JWT pour scope cascade.
- ✅ Auth matrix `supabase/config.toml` (#27) : verify_jwt par fonction codifié, plus d'operator-memory bug.

**Gaps DB identifiés** :

| # | Table / surface | Trouvaille | Severity |
|---|---|---|---|
| F1 | Storage bucket `avatars` | **Aucune migration ne crée de policies sur `storage.objects` pour le bucket avatars**. Policies probablement en place via dashboard Supabase mais non déclaratives → drift potentiel + non-auditable depuis le repo. | P1 |
| F2 | `mobile_install_leads` | `with check (true)` sur INSERT anon → vecteur de spam (insertion massive d'emails par bot). Pas de captcha ni de rate limit explicite. | P2 watchlist |

### A.2 Cloudflare `_headers`

Fichier `public/_headers` existe (1 fichier, ~70 lignes). Couvre :

- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `Permissions-Policy` : camera/mic/geo/payment/usb correctement restreints
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- ✅ `Content-Security-Policy` : `default-src 'self'` + allowlist Supabase, Anthropic, PostHog, Google APIs, Play Store
- ✅ `frame-ancestors 'none'` (clickjacking protection)
- ✅ `X-Robots-Tag: noindex, follow` sur routes auth/app
- ✅ Cache-Control immutable sur assets/icons/images

**Gaps `_headers` identifiés** :

| # | Élément | Trouvaille | Severity |
|---|---|---|---|
| F3 | `script-src` | `'unsafe-inline'` autorisé → surface XSS élargie. Ne peut être supprimé que via nonces ou strict-dynamic, refactor non trivial. | P2 V1.1 |
| F4 | `script-src` | `https://www.googletagmanager.com` autorisé alors qu'aucun GTM n'est utilisé dans le code → permissivité gratuite. | P1 |
| F5 | CSP | Pas de `manifest-src 'self'` (PWA) ni `worker-src 'self'` (service worker) ni `object-src 'none'` (XSS via &lt;object&gt;/&lt;embed&gt;). Defense-in-depth manquante. | P1 |
| F6 | Stripe | Pas d'entrée Stripe en CSP — vérifié non-bloquant car Stripe Checkout est un redirect navigation, pas un script chargé. | RAS |
| F7 | XSS avancé | Pas de `Cross-Origin-Opener-Policy` ni `Cross-Origin-Embedder-Policy`. Optionnel sauf si SharedArrayBuffer requis. | P3 |

### A.3 Auth rate limits

Supabase gère ses propres rate limits côté gateway (magic link, OTP, signup). Configuration dashboard uniquement, pas dans `config.toml`. Defaults Supabase 2024-2026 :

- Magic link : 10 / heure / IP
- OTP : 60 / heure / IP
- Signup : 30 / heure / IP

Pas de config explicite à pousser sauf si on veut durcir. Pour V1, les defaults sont raisonnables. **Action** : vérifier sur dashboard les valeurs actuelles + activer "Enable hCaptcha" sur Auth si pas déjà fait (limite spam signup).

### A.4 Edge Functions auth

- ✅ Tous les `verify_jwt = false` (billing-webhook, send-training-reminders, dispatch-push-queue) ont une auth body-level explicite (Stripe HMAC, x-cron-secret).
- ✅ Tous les `verify_jwt = true` (verify-play-purchase, sync-checkout-session, create-checkout-session, refresh-play-subscription, register-push-subscription, unsubscribe-push, ai-coach, ffr-sync, delete-account) lisent `user_id` du JWT, jamais d'un paramètre.
- ✅ `notify-training` (Décision #24) supprimée.

**Gap** : pas de rate limit explicite sur les Edge Functions side (Supabase Edge a un rate limit gateway global mais pas par-fonction). Pour V1, défaut acceptable. Surveiller `ai-coach` (coût Anthropic) si abuse.

## Phase B — Triage final

### À corriger en V1 (phases C-E)

**P0** : aucun.

**P1** :
- F1 — créer migration `storage.objects` pour bucket `avatars` (declarative).
- F4 — drop `googletagmanager.com` de `script-src` (cleanup).
- F5 — ajouter `manifest-src 'self'`, `worker-src 'self' blob:`, `object-src 'none'` au CSP.

### À documenter / V1.1

**P2** : F2 (spam vector mobile_install_leads → hCaptcha), F3 (CSP unsafe-inline → nonces).

**P3** : F7 (COOP/COEP).

## Phase C-E — Plan d'action

| Phase | Tâche | Effort |
|---|---|---:|
| C | Migration `20260509110000_storage_avatars_policies.sql` (storage.objects RLS pour `avatars`) | 0.1j |
| D | Update `public/_headers` : drop GTM, ajout manifest-src/worker-src/object-src | 0.1j |
| E | Vérification dashboard Supabase rate limits + hCaptcha + audit signups récents (manuel user) | 0.1j |
| F | Tests SQL ciblés storage avatars + Décision #51 + close | 0.2j |

**Total estimé** : ~0.5j (vs ~2-4j initialement budgété). La surface DB s'avère solide grâce aux audits précédents (Décisions #23, #24, #25, #26, #27).
