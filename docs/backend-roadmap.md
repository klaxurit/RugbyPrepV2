# RugbyPrep V2 — Backend Roadmap

## Objective

Move the product from a client-led prototype to a backend-governed platform without
breaking the fast deterministic training engine.

The backend should become the source of truth for:

- security and access control
- free vs premium entitlements
- push notification orchestration
- billing state
- auditable safety decisions

The training engine can remain deterministic and TypeScript-based, but the backend
must govern when and how it is used.

## Safety Rules

These rules are product constraints, not optional implementation details:

- Safety logic is never premium-gated. Premium can unlock convenience and analysis,
  never bypass red flags, deload rules, or rehab safeguards.
- Notification content must respect workload state. A player in ACWR `danger` or
  `critical` must not receive a normal “hard session” reminder.
- Premium logic must be enforced server-side. The client can display premium UI,
  but only server entitlements decide access.
- All sensitive state transitions (subscription changes, entitlement grants,
  notification sends) should be logged.

## Target Schema

### Core commercial model

- `plans`
  - Catalog of sellable offers (`free`, `premium_monthly`, `premium_yearly`)
  - Holds billing interval and current price
- `plan_entitlements`
  - Maps each plan to the product capabilities it unlocks
- `user_subscriptions`
  - Stores the billing provider state for each player
- `user_entitlements`
  - Stores the effective server-authoritative permissions used by the app
  - Default `free` entitlements should be granted automatically when a profile is created

### Notification model

- `notification_preferences`
  - Per-user settings (enabled, quiet hours, reminder hour, safety alert opt-in)
- `push_subscriptions`
  - Device-level push endpoints
  - Extended with `user_id`, `is_active`, `last_seen_at`, `user_agent`
- `notification_delivery_logs`
  - Audit trail for scheduled and sent notifications

### Existing domain tables kept

- `profiles`
- `session_logs`
- `block_logs`
- `match_calendar`
- `athletic_tests`

## Entitlement Model

Recommended initial entitlement keys:

- `program_basic`
- `notifications_basic`
- `calendar_basic`
- `athletic_tests_basic`
- `premium_program_adaptations`
- `advanced_notifications`
- `premium_analytics`
- `coach_mode`
- `priority_support`

Principle:

- `free` gets essential training access
- `premium` adds analysis, advanced reminders, and convenience
- no plan removes safety features

## Sprint Plan

### Sprint 1 — Secure Foundation

Goal: centralize product authority without changing the training engine.

- Add the new schema (`plans`, `plan_entitlements`, `user_subscriptions`,
  `user_entitlements`, `notification_preferences`, `notification_delivery_logs`)
- Extend `push_subscriptions` with authenticated ownership fields
- Add `register-push-subscription` and `unsubscribe-push` Edge Functions
- Add a generic `billing-webhook` function able to sync subscription state into
  `user_subscriptions` and `user_entitlements`
- Require a shared secret for the billing webhook in all environments
- Keep legacy direct push writes temporarily for backward compatibility, but stop
  using them from the client once the new functions are wired

Exit criteria:

- subscription state and entitlements can be read server-side
- push subscriptions can be written through a secure server path
- notifications can be audited

### Sprint 2 — Productization

Goal: make free/premium and mobile reminders production-grade.

- Wire the client to Edge Functions instead of direct writes on sensitive tables
- Add a real checkout integration (`create-checkout-session`)
- Add scheduled notification logic using entitlements + ACWR-aware templates
- Deploy `send-training-reminders` as the first cron-safe scheduler (log/queue first, then wire actual push delivery)
- Add premium-aware feature checks in the app based on server entitlements
- Add admin/ops dashboards or simple SQL views for support and incident handling

Exit criteria:

- premium access is server-authoritative
- notification behavior is workload-aware
- billing and entitlements are traceable and supportable

## Integration Order

1. Deploy the new schema.
2. Deploy Edge Functions.
3. Switch push registration in the client to the new functions.
4. Switch premium checks to `user_entitlements`.
5. Tighten legacy permissive RLS policies after the client migration is complete.

## Notes

- Keep the program engine deterministic and shared as long as possible.
- If you later move week generation server-side, store a weekly program snapshot
  with a rule version and a generation timestamp.
- Do not let billing or notifications become “UI-only” features. They need a
  server source of truth to stay safe and maintainable.

## Stripe Runbook (Test Mode)

Required Supabase secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM_MONTHLY` (optional if default test id is kept in code)
- `STRIPE_PRICE_PREMIUM_YEARLY` (optional if default test id is kept in code)

Deploy functions:

- `create-checkout-session`
- `billing-webhook`

Stripe webhook endpoint:

- `https://<project-ref>.supabase.co/functions/v1/billing-webhook`

Stripe events to subscribe:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
