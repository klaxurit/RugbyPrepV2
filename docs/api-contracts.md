# RugbyForge — Contrats API (Edge Functions Supabase)

**Date :** 2026-03-09
**Scope :** 8 Edge Functions Deno + _shared utilities

---

## Vue d'ensemble

| Fonction | Méthode | Auth | Déclencheur | Rôle |
|----------|---------|------|-------------|------|
| ai-coach | POST | JWT | Frontend | Chat coaching multi-turn (Claude) |
| create-checkout-session | POST | JWT | Frontend (premium) | Création session Stripe Checkout |
| billing-webhook | POST | Signature Stripe ou secret partagé | Stripe / backend | Sync abonnement + entitlements |
| register-push-subscription | POST | JWT | Frontend (notifications) | Enregistrer/MAJ push Web |
| unsubscribe-push | POST | JWT | Frontend (settings) | Désactiver push |
| send-training-reminders | POST | CRON secret | Cron (pas encore câblé) | Queue rappels entraînement |
| sync-checkout-session | POST | JWT | Frontend (post-paiement) | Sync Stripe checkout → subscriptions |
| notify-training | POST | Aucune (env keys) | Cron (pas encore câblé) | Envoi Web Push aux abonnés |

---

## 1. ai-coach

**Endpoint :** `supabase.functions.invoke('ai-coach')`
**Auth :** JWT Bearer (utilisateur connecté)
**Modèle :** `claude-haiku-4-5-20251001` (max_tokens: 800)

### Requête
```typescript
{
  useCase: 'deload_explain' | 'session_advice' | 'free_chat'
  userMessage?: string
  messages?: { role: 'user' | 'assistant'; content: string }[]
  context: {
    week?: string; phase?: string
    acwr?: number | null; acwrZone?: string | null
    acuteLoad?: number; chronicLoad?: number
    fatigue?: string
    recentLogs?: { sessionType: string; rpe?: number; durationMin?: number; dateISO: string; week: string }[]
    profile?: { level?: string; weeklySessions?: number; position?: string; injuries?: string[] }
  }
}
```

### Réponse
- Succès : `{ message: string }`
- Erreur API : `{ error: "Anthropic {status}: {details}" }`
- Config manquante : `{ error: "ANTHROPIC_API_KEY not configured" }` (HTTP 500)

### Cas d'usage
- `deload_explain` : explication deload (2 phrases + 1 conseil concret)
- `session_advice` : coaching pré-session selon fatigue/ACWR
- `free_chat` : chat multi-turn (10 derniers messages)

---

## 2. create-checkout-session

**Endpoint :** `supabase.functions.invoke('create-checkout-session')`
**Auth :** JWT Bearer

### Requête
```typescript
{ planId: string; successUrl: string; cancelUrl: string }
```

### Réponse (succès, Stripe configuré)
```typescript
{
  ok: true; ready: true
  plan: { id, name, billing_interval, price_cents, currency, is_active }
  entitlements: string[]
  checkoutUrl: string; sessionId: string
  message: "Checkout session created."
}
```

### Réponse (provider pas configuré)
```typescript
{ ok: false; ready: false; reason: "provider_not_configured" | "provider_not_wired"; ... }
```

### Mapping prix Stripe
- `premium_monthly` → env `STRIPE_PRICE_PREMIUM_MONTHLY`
- `premium_yearly` → env `STRIPE_PRICE_PREMIUM_YEARLY`

---

## 3. billing-webhook

**Endpoint :** `/functions/v1/billing-webhook`
**Auth :** Signature Stripe (HMAC-SHA256, tolérance 5min) OU secret partagé (`x-webhook-secret`)

### Events Stripe gérés
- `checkout.session.completed`
- `customer.subscription.created` / `updated` / `deleted`

### Opérations DB
- UPSERT `user_subscriptions` (on conflict: user_id, provider)
- DELETE + INSERT `user_entitlements` (si status actif)
- RPC `grant_default_free_entitlements()` (si status inactif)

### Mapping statuts
active, trialing, past_due, canceled, expired, inactive

---

## 4. register-push-subscription

**Endpoint :** `supabase.functions.invoke('register-push-subscription')`
**Auth :** JWT Bearer

### Requête
```typescript
{
  endpoint: string; p256dhKey: string; authKey: string
  trainingDays: number[]; timezone?: string; userAgent?: string
}
```

### Opérations DB
- UPSERT `push_subscriptions` (on conflict: endpoint)
- UPSERT `notification_preferences` (on conflict: user_id, push_enabled=true)

---

## 5. unsubscribe-push

**Requête :** `{ endpoint: string }`
**Opérations :** UPDATE `push_subscriptions` is_active=false + comptage → si 0 actif, MAJ notification_preferences push_enabled=false

---

## 6. send-training-reminders

**Auth :** Header `x-cron-secret` (env `CRON_SHARED_SECRET`)
**Status :** Queue les rappels en DB mais n'envoie PAS encore de push (infrastructure placeholder)

### Filtrage
Skip si : push_enabled=false, pas d'entitlement `notifications_basic`, mauvais jour, heure ≠ reminder_hour, quiet hours

### Templates
- `notifications_basic` → `training_reminder_standard`
- `advanced_notifications` → `training_reminder_advanced`

---

## 7. sync-checkout-session

**Requête :** `{ sessionId: string }`
**Logique :** Fetch Stripe checkout session → extrait planId (metadata → reverse price mapping) → UPSERT user_subscriptions + entitlements
**Frontend :** Polling toutes les 2.5s (max 12 tentatives = 30s timeout) après redirect Stripe

---

## 8. notify-training

**Auth :** Aucune (clés VAPID dans env)
**Status :** Infrastructure complète (RFC 8030/8188/8291/8292), attente câblage cron + tests E2E

### Payload Push
```json
{
  "title": "🏉 Jour de séance !",
  "body": "Ton programme t'attend. C'est le moment de performer.",
  "url": "/week",
  "tag": "training-reminder"
}
```

### Nettoyage
HTTP 410 (Gone) → suppression endpoint de la DB

---

## _shared utilities

| Module | Exports |
|--------|---------|
| `http.ts` | `corsHeaders` (CORS all origins), `json(body, status)` |
| `supabase.ts` | `createClients(req)` → { userClient, serviceClient }, `requireUser(req)` |
| `stripe.ts` | `getStripePriceIdForPlan()`, `getPlanIdForStripePrice()`, `stripeRequest()`, `verifyStripeWebhookSignature()` |

---

## Variables d'environnement requises

| Variable | Fonctions | Obligatoire |
|----------|-----------|-------------|
| `ANTHROPIC_API_KEY` | ai-coach | Oui |
| `STRIPE_SECRET_KEY` | create-checkout-session, sync-checkout-session | Oui |
| `STRIPE_WEBHOOK_SECRET` | billing-webhook | Oui (si Stripe) |
| `BILLING_WEBHOOK_SHARED_SECRET` | billing-webhook | Oui (si manuel) |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | create-checkout-session, billing-webhook, sync-checkout-session | Non (défaut fourni) |
| `STRIPE_PRICE_PREMIUM_YEARLY` | create-checkout-session, billing-webhook, sync-checkout-session | Non (défaut fourni) |
| `VAPID_PUBLIC_KEY` | notify-training | Oui |
| `VAPID_PRIVATE_KEY` | notify-training | Oui |
| `VAPID_CONTACT` | notify-training | Oui |
| `CRON_SHARED_SECRET` | send-training-reminders | Oui |
