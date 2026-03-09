# RugbyForge — Modèle de données

**Date :** 2026-03-09

---

## Schéma base de données (Supabase PostgreSQL)

### Tables principales

| Table | Clé primaire | RLS | Indexes | Rôle |
|-------|-------------|-----|---------|------|
| profiles | id (UUID→auth.users) | Users own | — | Profil utilisateur complet |
| session_logs | id (UUID) | Users own | user_date | Historique sessions |
| block_logs | id (UUID) | Users own | user_date, user_block | Détail exercices par bloc |
| match_calendar | id (UUID) | Users own | user_date | Calendrier matchs/repos |
| athletic_tests | id (UUID) | Users own | user_date | Tests physiques |
| push_subscriptions | id (UUID) | Hybride | user_id, active_days (GIN) | Abonnements Web Push |
| notification_preferences | user_id (UUID) | Users own | — | Préférences notifications |
| notification_delivery_logs | id (UUID) | Users read | user_idx, status_idx | Audit livraison |
| plans | id (text) | Anyone read | — | Définition plans (3 lignes) |
| plan_entitlements | (plan_id, key) | Anyone read | — | Features par plan |
| user_subscriptions | id (UUID) | Users read | user_provider, status_idx | Abonnement actif |
| user_entitlements | id (UUID) | Users read | user_status_idx | Droits actifs |

---

### profiles

```sql
id              UUID PK → auth.users(id) ON DELETE CASCADE
level           text CHECK ('beginner'|'intermediate') DEFAULT 'intermediate'
weekly_sessions integer CHECK (2|3) DEFAULT 2
equipment       text[] DEFAULT '{}'
injuries        text[] DEFAULT '{}'
position        text NULL          -- groupe de postes (FRONT_ROW, etc.)
rugby_position  text NULL          -- poste spécifique
league_level    text NULL
club_code       text NULL
club_name       text NULL
club_ligue      text NULL
club_department_code text NULL
height_cm       integer NULL
weight_kg       numeric(5,1) NULL
onboarding_complete boolean DEFAULT false
club_schedule   jsonb NULL         -- ClubSchedule
sc_schedule     jsonb NULL         -- SCSchedule
training_level  text CHECK ('starter'|'builder'|'performance') NULL
season_mode     text CHECK ('in_season'|'off_season'|'pre_season') NULL
rehab_injury    jsonb NULL         -- RehabInjury
updated_at      timestamptz DEFAULT now()
```

### session_logs

```sql
id           UUID PK DEFAULT gen_random_uuid()
user_id      UUID NOT NULL → auth.users(id) ON DELETE CASCADE
date_iso     text NOT NULL          -- YYYY-MM-DD
week         text NOT NULL          -- CycleWeek: W1-W8, H1-H4, DELOAD
session_type text NOT NULL CHECK ('UPPER'|'LOWER'|'FULL'|'CONDITIONING')
fatigue      text NOT NULL CHECK ('OK'|'FATIGUE')
notes        text NULL
rpe          integer CHECK (1-10) NULL
duration_min integer NULL
created_at   timestamptz DEFAULT now()
INDEX session_logs_user_date(user_id, date_iso DESC)
```

### block_logs

```sql
id           UUID PK DEFAULT gen_random_uuid()
user_id      UUID NOT NULL → auth.users(id) ON DELETE CASCADE
date_iso     text NOT NULL
week         text NOT NULL
session_type text NOT NULL CHECK ('UPPER'|'LOWER'|'FULL'|'CONDITIONING')
block_id     text NOT NULL          -- réf blocks.v1.json
block_name   text NOT NULL
entries      jsonb NOT NULL DEFAULT '[]'  -- ExerciseLogEntry[]
created_at   timestamptz DEFAULT now()
INDEX block_logs_user_date(user_id, date_iso DESC)
INDEX block_logs_user_block(user_id, block_id)
```

### match_calendar

```sql
id            UUID PK DEFAULT gen_random_uuid()
user_id       UUID NOT NULL → auth.users(id) ON DELETE CASCADE
date          date NOT NULL
type          text NOT NULL CHECK ('match'|'rest'|'unavailable')
kickoff_time  time NULL
opponent      text NULL
opponent_code text NULL               -- code club FFR pour logo
is_home       boolean NULL
notes         text NULL
rpe           integer CHECK (1-10) NULL    -- RPE match → ACWR
duration_min  integer CHECK (>0) NULL      -- durée match
created_at    timestamptz DEFAULT now()
INDEX match_calendar_user_date(user_id, date)
```

### athletic_tests

```sql
id             UUID PK DEFAULT gen_random_uuid()
user_id        UUID NOT NULL → auth.users(id) ON DELETE CASCADE
date_iso       text NOT NULL
type           text NOT NULL  -- cmj|sprint_10m|yyir1|one_rm_squat|one_rm_bench|one_rm_deadlift|hooper
value          numeric NOT NULL
estimated_from jsonb NULL     -- {loadKg, reps, formula}
notes          text NULL
created_at     timestamptz DEFAULT now()
INDEX athletic_tests_user_date(user_id, date_iso DESC)
```

### Billing (plans → plan_entitlements → user_subscriptions → user_entitlements)

**plans** (3 lignes pré-remplies : free/premium_monthly/premium_yearly)

```sql
id               text PK
name             text NOT NULL
billing_interval text NOT NULL CHECK ('one_time'|'month'|'year')
price_cents      integer NOT NULL CHECK (>=0)
currency         text DEFAULT 'eur'
is_active        boolean DEFAULT true
metadata         jsonb DEFAULT '{}'
```

**plan_entitlements**

```sql
plan_id         text → plans(id) ON DELETE CASCADE
entitlement_key text
PK (plan_id, entitlement_key)
```

Entitlements free : `program_basic`, `notifications_basic`, `calendar_basic`, `athletic_tests_basic`
Entitlements premium : + `premium_program_adaptations`, `advanced_notifications`, `premium_analytics`, `coach_mode`, `priority_support`

**user_subscriptions**

```sql
id                          UUID PK
user_id                     UUID → auth.users(id) ON DELETE CASCADE
plan_id                     text → plans(id)
provider                    text DEFAULT 'manual' CHECK ('manual'|'stripe'|'app_store'|'play_store')
provider_customer_id        text NULL
provider_subscription_id    text NULL
status                      text NOT NULL CHECK ('inactive'|'trialing'|'active'|'past_due'|'canceled'|'expired')
current_period_start        timestamptz NULL
current_period_end          timestamptz NULL
cancel_at_period_end        boolean DEFAULT false
metadata                    jsonb DEFAULT '{}'
UNIQUE (user_id, provider)
```

**user_entitlements**

```sql
id              UUID PK
user_id         UUID → auth.users(id) ON DELETE CASCADE
entitlement_key text
source          text CHECK ('plan'|'billing'|'admin'|'promo')
status          text DEFAULT 'active' CHECK ('active'|'revoked'|'expired')
granted_at      timestamptz DEFAULT now()
expires_at      timestamptz NULL
UNIQUE (user_id, entitlement_key)
```

Trigger : à la création d'un profil → `grant_default_free_entitlements()`

---

## Notifications (push_subscriptions, notification_preferences, notification_delivery_logs)

Voir détail dans `api-contracts.md` sections 4-6.

---

## Types TypeScript principaux

### training.ts

| Type | Valeurs |
|------|---------|
| `Equipment` | barbell, dumbbell, bench, band, landmine, tbar_row, ghd, med_ball, box, pullup_bar, machine, sprint_track, ab_wheel, none |
| `Contra` | shoulder_pain, elbow_pain, wrist_pain, low_back_pain, knee_pain, groin_pain, neck_pain, ankle_pain |
| `BlockIntent` | activation, prehab, neural, force, contrast, hypertrophy, core, neck, carry, conditioning, mobility |
| `CycleWeek` | W1-W8, H1-H4, DELOAD |
| `ProgramPhase` | FORCE, POWER, HYPERTROPHY |
| `TrainingLevel` | starter, builder, performance |
| `SeasonMode` | in_season, off_season, pre_season |
| `SessionType` | UPPER, LOWER, FULL, CONDITIONING, RECOVERY |
| `FatigueLevel` | underload, optimal, caution, danger, critical |

### athleticTesting.ts

| Type | Valeurs |
|------|---------|
| `PhysicalTestType` | cmj, sprint_10m, yyir1, one_rm_squat, one_rm_bench, one_rm_deadlift, hooper |

---

## Données statiques (src/data/)

| Fichier | Contenu | Taille |
|---------|---------|--------|
| `blocks.v1.json` | 88 TrainingBlocks | 7094 lignes |
| `exercices.v1.json` | 192+ exercices | 2701 lignes |
| `sessionRecipes.v1.ts` | 24 recettes (routing programme) | — |
| `prehab.v1.json` | Exercices prehab | — |
| `weekGuidance.v1.ts` | Guidance par semaine | — |
| `ffrClubs.v2021.json` | Clubs FFR | — |
| `clubLogos.*.json` | Logos clubs | — |

---

## Flux de données

```
Frontend (React)
  → useProfile/useHistory/useCalendar/useAthleteTests (localStorage + Supabase sync)
  → supabase.js client (ANON_KEY, RLS)
  → PostgreSQL
  → Edge Functions (Deno, SERVICE_ROLE_KEY pour billing/notifications)
```

Pattern : **local-first** — lecture immédiate localStorage, sync Supabase en arrière-plan, lazy-load sur changement userId.
