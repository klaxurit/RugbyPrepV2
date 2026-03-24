---
title: 'Free/Premium Differentiation Roadmap V1'
slug: 'free-premium-differentiation-roadmap-v1'
created: '2026-03-24'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'React 19'
  - 'TypeScript'
  - 'Tailwind CSS'
  - 'Supabase (auth + DB + Edge Functions Deno)'
  - 'Stripe (billing)'
  - 'Claude API (ai-coach)'
files_to_modify:
  - 'src/hooks/useEntitlements.ts'
  - 'src/hooks/useFeatureAccess.ts'
  - 'src/hooks/useUpsellTiming.ts (NEW)'
  - 'src/components/PremiumUpsellCard.tsx'
  - 'src/pages/LandingPage.tsx'
  - 'src/pages/ProgressPage.tsx'
  - 'src/pages/ChatPage.tsx'
  - 'src/pages/HomePage.tsx'
  - 'src/pages/WeekPage.tsx'
  - 'src/pages/CalendarPage.tsx'
  - 'src/pages/ProfilePage.tsx'
  - 'supabase/functions/ai-coach/index.ts'
  - 'supabase/migrations/ (pricing fix)'
code_patterns:
  - 'useEntitlements() → useFeatureAccess() → composants'
  - 'PremiumUpsellCard pour upsell inline'
  - 'Edge Functions Deno pour backend AI + Stripe'
  - 'Entitlements DB: plan_entitlements + user_entitlements'
test_patterns:
  - 'Vérification manuelle des gates par profil Free/Premium'
  - 'Tests de cohérence entitlements via Supabase SQL'
---

# Tech-Spec: Free/Premium Differentiation Roadmap V1

**Created:** 2026-03-24

---

## Overview

### Problem Statement

Le nouveau contenu public (6 guides SEO + landing refaite) promet une plateforme scientifique couvrant périodisation, ACWR, tests physiques, prévention blessures et coaching IA. Dans l'app, la différenciation Premium est concentrée sur 3 upsell cards de ProgressPage et quelques prompts Chat. Le reste de l'app (Home, Week, Calendar, Profile) n'a **aucun gate Premium**. Le coach IA n'est pas gaté côté serveur. Le pricing landing (5.99€/47.99€) ne correspond pas au pricing DB (9.99€/99.90€). Résultat : le Premium n'est pas assez désirable et la promesse marketing dépasse la réalité produit.

### Solution

Construire une roadmap priorisée en 4 vagues qui :
1. Corrige les incohérences (pricing, timing upsell)
2. Renforce le Premium sur les surfaces à plus forte valeur perçue (Progress, Chat, Session)
3. Étend la différenciation aux surfaces quotidiennes (Home, Week, Calendar)
4. Produit un récap marketing aligné avec la réalité produit

### Scope

**In Scope:**
- Matrice Free vs Premium page par page
- Roadmap priorisée par vagues (quick wins → chantiers)
- Règle de timing upsell (hook `useUpsellTiming`)
- Correction pricing landing ↔ DB
- Gate backend AI coach pour Premium
- Opportunités d'upsell contextuel par page
- Synthèse marketing réutilisable pour le site vitrine

**Out of Scope:**
- Implémentation code dans ce lot (spec seulement)
- Refonte Stripe billing / webhooks
- Réécriture landing ou blog
- Coach mode équipe (feature future)
- A/B testing sur les messages d'upsell

---

## Matrice Free vs Premium — Page par page

### Règle fondatrice

> **Free = le programme complet + les outils de base. Premium = l'intelligence qui enlève l'incertitude.**

Le Free ne doit jamais frustrer. Il doit être assez bon pour que l'utilisateur s'investisse. Le Premium doit arriver naturellement quand l'utilisateur se demande "et maintenant, je charge combien ?" ou "est-ce que je progresse vraiment ?".

---

### HomePage

| Fonctionnalité | Free | Premium |
|---|---|---|
| Session du jour (hero card) | ✅ | ✅ |
| Stats recap (cycle, fatigue, sessions) | ✅ | ✅ |
| Widget ACWR (zones visuelles) | ✅ zones + valeur | ✅ + **prédiction ACWR semaine prochaine** |
| Badge phase saison | ✅ | ✅ |
| Countdown prochain match | ✅ | ✅ |
| Quick access cards | ✅ | ✅ |
| Activité récente | ✅ | ✅ |
| **Résumé intelligent de semaine** | ❌ | ✅ "Ta semaine : 2 séances prévues, charge cible 1.1, priorité force" |
| **Alerte risque blessure contextuelle** | ❌ | ✅ "ACWR 1.45 + CMJ -12% → risque élevé, deload recommandé" |

**Upsell contextuel :** Sous le widget ACWR, après 2 semaines de données, afficher une card discrète : *"Vois comment ta charge va évoluer la semaine prochaine → Premium"*

---

### WeekPage

| Fonctionnalité | Free | Premium |
|---|---|---|
| Programme semaine complet (sessions, blocs) | ✅ | ✅ |
| Bannière mobilité post-match | ✅ | ✅ |
| Bannière rehab | ✅ | ✅ |
| Badge phase + saison | ✅ | ✅ |
| Planning annuel résumé | ✅ | ✅ |
| **Prédiction charge semaine suivante** | ❌ | ✅ "Semaine prochaine : ACWR prévu 1.35 (vigilance)" |
| **Swap conditionnel de session** | ❌ | ✅ "Match demain → on te propose de remplacer UPPER par mobilité" |
| **Optimiseur double-match week** | ❌ | ✅ Modulation automatique intensité mi-semaine |

**Upsell contextuel :** Quand l'utilisateur a un match dans les 3 jours, card : *"Adapte ta semaine automatiquement en fonction du match → Premium"*

---

### SessionDetailPage / Logging — SURFACE PREMIUM #1 EN V1

> **C'est ici que la valeur Premium se joue au quotidien.** L'utilisateur ouvre sa session, il voit ses exercices, et la question immédiate est : "je mets combien ?". C'est LE moment où le Premium enlève l'incertitude. Cette surface doit être traitée comme la priorité absolue de la Vague 1.

| Fonctionnalité | Free | Premium |
|---|---|---|
| Voir la session complète (blocs, exos, sets/reps) | ✅ | ✅ |
| Logger ses charges réelles | ✅ | ✅ |
| Historique des logs | ✅ | ✅ |
| **Charge cible suggérée** | ❌ | ✅ Affiche la charge recommandée pour chaque exercice |
| **Logique augmenter / maintenir / réduire** | ❌ | ✅ Décision explicite basée sur le dernier log |
| **Justification simple** | ❌ | ✅ "Tu as fait 4×5 @ 80kg (RPE 7) → +2.5kg cette semaine" |
| **Indicateur de progression par exercice** | ❌ | ✅ Flèche ↑↓→ vs dernière session du même type |
| **Impact sur la séance suivante** | ❌ | ✅ "Si tu réussis 4×5 @ 82.5kg, semaine prochaine → 85kg" |

#### Logique de suggestion de charge (à implémenter)

```
// Overrides prioritaires (avant toute décision RPE)
SI semaine_deload → RÉDUIRE (-15 à -20%), justification "Semaine de deload"
SI ACWR > 1.3 → MAINTENIR max (jamais augmenter), justification "Charge élevée"
SI rehab_actif → MAINTENIR max (jamais augmenter), justification "Protocole rehab"
SI fatigue_level === 'high' → MAINTENIR max, justification "Fatigue élevée"

// Logique standard (si aucun override)
SI dernier_log existe ET < 14 jours :
  SI RPE ≤ 7 ET toutes reps complétées → AUGMENTER (incrément par famille, voir T1.3)
    Justification : "Charge bien maîtrisée → on monte"
  SI RPE = 8 ET toutes reps complétées → MAINTENIR
    Justification : "Bonne intensité, on consolide"
  SI RPE ≥ 9 ET reps incomplètes → RÉDUIRE (-incrément famille)
    Justification : "Reps incomplètes à RPE max → on baisse"
  SI RPE ≥ 9 ET reps complétées → MAINTENIR
    Justification : "RPE élevé mais reps OK → on consolide"
  SI RPE < 9 ET reps incomplètes → MAINTENIR
    Justification : "Reps incomplètes → on reste à cette charge"
SI dernier_log existe ET > 14 jours → MAINTENIR + alerte
  Justification : "Pas de données récentes → reprise prudente"
SI exercice_bodyweight → pas de suggestion poids (reps only)
SI exercice_conditioning → pas de suggestion
SI premier_log_jamais → NO_DATA
  Justification : "Première fois — choisis ta charge, on ajustera ensuite"
SI exercice_substitué (ID différent du dernier log du même slot) → NO_DATA
  Justification : "Exercice différent — pas de continuité"
SI multi_logs_même_jour → prendre le plus récent (created_at DESC LIMIT 1)
```

**Upsell contextuel :** Après 3 sessions loggées, sur l'écran de log, à côté du champ de saisie de charge : *"La prochaine fois, on te dit exactement combien charger → Premium"*. Le Free voit le champ vide. Le Premium voit la charge pré-remplie avec justification.

---

### ProgressPage

| Fonctionnalité | Free | Premium |
|---|---|---|
| Adhérence programme (7j/28j) | ✅ | ✅ |
| Activité récente | ✅ | ✅ |
| Top progression (W1→W4) | ✅ | ✅ |
| Saisie tests physiques | ✅ | ✅ |
| **Objectifs automatiques de charge** | ❌ | ✅ (déjà upsellé) |
| **Courbes de progression saisonnières** | ❌ | ✅ (déjà upsellé) |
| **Baselines par poste + interprétation** | ❌ | ✅ (déjà upsellé) |
| **Alertes régression (>10% CMJ/sprint)** | ❌ | ✅ (déjà upsellé) |
| **Exercices manquants tracker** | ❌ | ✅ |
| **Estimation 1RM avec courbe tendance** | ❌ | ✅ "À ce rythme, 100kg squat dans 7 semaines" |

**Upsell contextuel :** Existant et déjà bien placé (3 cards). Ajouter : après saisie d'un test, *"Vois si tu progresses vraiment, compare-toi à ton poste → Premium"*

---

### ChatPage (Coach IA)

> **La différenciation Premium du chat vient d'abord de la QUALITÉ et du CONTEXTE des réponses, pas seulement du volume.** Un utilisateur Free qui pose une bonne question doit recevoir une bonne réponse — mais générique. Un utilisateur Premium doit sentir que le coach le connaît personnellement.

#### Positionnement Free vs Premium

| | Free | Premium |
|---|---|---|
| **Rôle du coach** | Coach contextuel léger | Coach personnel qui connaît le joueur |
| **System prompt** | KB scientifique générique (périodisation, nutrition, récup) | KB + profil complet (poste, niveau, ACWR, blessures, derniers logs, phase) |
| **Qualité des réponses** | Conseils généraux fiables, basés sur la science | Conseils actionnables et personnalisés : "Toi, en tant que pilier à ACWR 1.2 avec une douleur au genou..." |
| **Volume** | 5 messages/jour | Illimité |

#### Matrice fonctionnelle

| Fonctionnalité | Free | Premium |
|---|---|---|
| Chat libre (nutrition, récup, sommeil) | ✅ 5 msg/jour, réponses génériques | ✅ illimité, réponses contextualisées |
| 4 prompts de base | ✅ | ✅ |
| **Prompts contextuels (phase, ACWR, deload)** | ❌ | ✅ (déjà implémenté frontend) |
| **Conseil pré-match personnalisé** | ❌ | ✅ "Match dans 48h : voici TON plan nutrition + récup" |
| **Analyse post-session** | ❌ | ✅ "Ta session force était dure (RPE 8). Pour toi, demain : récup active" |
| **System prompt enrichi (profil complet)** | ❌ | ✅ Le coach sait qui tu es, où tu en es, et ce qui te limite |

#### Exemples concrets de la différence

| Question utilisateur | Réponse Free | Réponse Premium |
|---|---|---|
| "Je mange quoi avant un match ?" | "3-4h avant : repas riche en glucides complexes, protéines maigres, faible en graisses..." | "Ton match est samedi 15h. Vendredi soir : pâtes + poulet. Samedi 11h : riz + œufs. 14h : banane + barre. Tu pèses 95kg, vise 120g de glucides au repas de la veille." |
| "Ma charge est trop haute ?" | "Un ACWR > 1.3 indique une zone de vigilance. Il est conseillé de réduire le volume..." | "Ton ACWR est à 1.42 cette semaine. Tu es en zone vigilance depuis 5 jours. Ta session UPPER de demain est à haute intensité — je recommande de la remplacer par mobilité ou de baisser la charge de 15%." |

**Upsell contextuel :** Quand l'utilisateur atteint sa limite de 5 msg : *"Tu veux continuer ? Le coach Premium te connaît — il sait ton poste, ta charge, tes blessures, et adapte chaque réponse."*

**Gate backend obligatoire :** Le rate limiting (5 msg/jour Free) ET la différenciation de system prompt DOIVENT être implémentés côté Edge Function. Le frontend ne fait qu'afficher — la logique de personnalisation est serveur.

---

### CalendarPage

| Fonctionnalité | Free | Premium |
|---|---|---|
| CRUD événements (matchs, repos, indispo) | ✅ | ✅ |
| Recherche club FFR | ✅ | ✅ |
| Hero prochain match | ✅ | ✅ |
| Log charge match (RPE × durée) | ✅ | ✅ |
| **Timeline récupération post-match** | ❌ | ✅ "RPE 8 × 82min → récupération complète estimée dans 96h" |
| **Détection double-match week** | ✅ (visuel) | ✅ + **recommandation de modulation** |

**Upsell contextuel :** Après log d'un match, card : *"Vois quand tu seras vraiment récupéré → Premium"*

---

### ProfilePage

| Fonctionnalité | Free | Premium |
|---|---|---|
| Toute la configuration profil | ✅ | ✅ |
| Sélection niveau/saison/équipement | ✅ | ✅ |
| Contraindications blessures | ✅ | ✅ |
| Rehab protocol | ✅ | ✅ |
| Badge statut (Free/Premium) | ✅ | ✅ |
| **Historique poids/taille** | ❌ | ✅ (future) |

**Upsell contextuel :** Card existante en bas de page — suffisant, pas besoin d'en ajouter.

---

## Roadmap priorisée par vagues

### VAGUE 0 — Préconditions techniques obligatoires (2-4 jours)

> **Rien ne peut être livré en Premium tant que la Vague 0 n'est pas terminée.** Cette vague sécurise le billing, le backend AI, le timing upsell et les entitlements. C'est la fondation. Pas de raccourci.

#### T0.1 : Résoudre l'incohérence pricing (BLOQUEUR)

- File: `src/pages/LandingPage.tsx`, `supabase/migrations/`, Stripe Dashboard
- **Owner décision business :** Product Owner (Coach). Pas un choix technique.
- **Deadline absolue :** 27 mars 2026. Passé cette date, si aucune décision n'est prise, le prix landing actuel (5.99€/47.99€) devient le prix définitif par défaut et l'alignement technique démarre immédiatement.
- **Decision-gate :** T0.2, T0.3, T0.4, T0.5 peuvent démarrer en parallèle de la décision pricing. Mais **T0.2 (validation Stripe E2E) ne peut pas être complété** tant que les 3 sources ne sont pas alignées. Cela signifie que la Vague 1 est bloquée de facto.
- **Source de vérité temporaire :** En attendant la décision, les prix landing (5.99€/47.99€) font foi côté communication. Le checkout Stripe est désactivé (ou redirige vers une page "bientôt disponible") tant que les prix ne sont pas alignés.
- **Action technique après décision :**
  1. Mettre à jour `LandingPage.tsx` si le prix change
  2. Migration Supabase : `UPDATE plans SET price = X WHERE plan_id = 'premium_monthly'` (idem yearly)
  3. Mettre à jour / créer les Stripe Price IDs correspondants dans le Dashboard Stripe
  4. Mettre à jour les secrets Supabase : `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_YEARLY`
  5. Vérifier le copy du checkout Stripe (montant affiché à l'utilisateur)
  6. Vérifier le copy du bouton frontend (montant dans le CTA)

#### T0.2 : Validation Stripe / entitlements end-to-end (BLOQUEUR)

- Files: `supabase/functions/create-checkout-session/index.ts`, `supabase/functions/sync-checkout-session/index.ts`
- **Condition de release :** Aucune feature Premium différenciée ne peut être déployée sans validation billing minimale.
- Action:
  1. Vérifier que `sync-checkout-session` est déployé (`supabase functions list`)
  2. Vérifier que le webhook Stripe pointe vers l'URL correcte de la Edge Function
  3. Test end-to-end avec carte test Stripe :
     - Landing → clic Premium → checkout Stripe → paiement test → webhook fire → `user_subscriptions` créé → `user_entitlements` attribués → `useEntitlements()` retourne `isPremium: true`
  4. Vérifier le rollback : annulation Stripe → entitlements révoqués → `isPremium: false`
  5. **Chemin de secours dev/test :** Si Stripe n'est pas configuré en staging, créer un script SQL `grant_test_premium(user_id)` qui insère manuellement les entitlements Premium pour permettre le dev/test des features gatées. Ce script ne doit JAMAIS être accessible en production.
- **Si le webhook ne fonctionne pas :** Corriger avant de continuer. Un utilisateur qui paye et ne reçoit pas ses droits = incident critique.

#### T0.3 : Backend AI coach — gating réel + rate limiting (BLOQUEUR)

- File: `supabase/functions/ai-coach/index.ts`
- **Schéma table rate limiting :**
  ```sql
  CREATE TABLE public.ai_coach_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    usage_date date NOT NULL DEFAULT CURRENT_DATE,
    message_count integer NOT NULL DEFAULT 1,
    UNIQUE(user_id, usage_date)
  );
  ALTER TABLE public.ai_coach_usage ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users see own usage"
    ON public.ai_coach_usage FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```
- **Logique Edge Function :**
  1. **Authentification :** Extraire le JWT du header `Authorization: Bearer <token>`. Vérifier via `supabase.auth.getUser(token)`. Si invalide → 401.
  2. **Vérification entitlement :** Query `SELECT key FROM user_entitlements WHERE user_id = $1 AND key = 'premium_program_adaptations' AND status = 'active'`. Stocker `isPremium: boolean`.
  3. **Rate limiting (Free seulement) :**
     - **Timezone : UTC.** Le compteur journalier se base sur `CURRENT_DATE` PostgreSQL qui est en UTC. Pas de timezone utilisateur. Un utilisateur à Paris (UTC+1/+2) verra son compteur reset à 01:00/02:00 heure locale. C'est acceptable : la simplicité prime sur la précision timezone. Le frontend affiche "Tes messages se réinitialisent chaque jour" sans mentionner d'heure précise.
     - `INSERT INTO ai_coach_usage (user_id, usage_date, message_count) VALUES ($1, CURRENT_DATE, 1) ON CONFLICT (user_id, usage_date) DO UPDATE SET message_count = ai_coach_usage.message_count + 1 RETURNING message_count`
     - Si `message_count > 5` ET `!isPremium` → retourner `{ error: 'rate_limited', limited: true, remaining: 0 }` avec HTTP 429
     - Si `message_count >= 4` ET `!isPremium` → inclure `remaining: 5 - message_count` dans la réponse normale
     - **Edge case minuit :** Un utilisateur qui envoie son 5ème message à 23:59 UTC et un 6ème à 00:01 UTC → le 6ème passe (nouveau jour). Comportement attendu et acceptable.
  4. **System prompt différencié :**
     - **RÈGLE ANTI-SPOOFING :** Le backend ne DOIT JAMAIS utiliser le `userContext` envoyé par le frontend pour construire le system prompt Premium. Le frontend envoie `userContext` uniquement comme hint pour les prompts contextuels côté UI. **Le backend reconstruit TOUJOURS le contexte Premium côté serveur** en queryant directement Supabase avec le `user_id` authentifié :
       - `SELECT position, training_level, season_mode, injuries FROM profiles WHERE id = $user_id`
       - `SELECT acwr_value FROM acwr_data WHERE user_id = $user_id ORDER BY created_at DESC LIMIT 1` (ou calcul inline)
       - `SELECT * FROM exercise_logs WHERE user_id = $user_id ORDER BY created_at DESC LIMIT 15` (3 dernières sessions ~ 5 exos chacune)
       - `SELECT date, kickoff_time, opponent, is_home FROM match_calendar WHERE user_id = $user_id AND date >= CURRENT_DATE ORDER BY date LIMIT 1`
     - Un utilisateur Free qui envoie un payload `userContext` forgé ne peut PAS élever son contexte — le backend l'ignore complètement.
     - **Free :** System prompt actuel (KB scientifique générique). Aucune query profil. Aucun contexte personnalisé.
     - **Premium :** System prompt enrichi = KB + bloc profil joueur (reconstruit serveur) :
       ```
       PROFIL JOUEUR (contexte personnalisé) :
       - Poste : {position}, Niveau : {trainingLevel}, Saison : {seasonMode}
       - ACWR actuel : {acwr} (zone : {acwrZone})
       - Blessures actives : {injuries}
       - 3 dernières sessions : {recentSessions}
       - Prochain match : {nextMatch.date} {nextMatch.kickoffTime} vs {nextMatch.opponent}

       INSTRUCTION : Tu connais ce joueur personnellement. Chaque réponse doit être spécifique à son profil, sa charge actuelle et ses contraintes. Utilise ses données pour personnaliser tes conseils.
       ```
  5. **Comportements d'erreur :**
     - Table `ai_coach_usage` absente → log erreur, traiter comme Free sans rate limit (fail-open), ne pas bloquer la requête
     - User non authentifié → 401 `{ error: 'unauthorized' }`
     - Quota dépassé → 429 `{ error: 'rate_limited', limited: true, remaining: 0 }`
     - Entitlement check échoue (DB down) → traiter comme Free (fail-safe)
     - `message_count` négatif ou non-numérique → traiter comme 0 (fail-safe, pas de crash)
     - Query rate limit échoue (toute erreur SQL) → log erreur, laisser passer la requête (fail-open — mieux vaut servir un Free sans limit qu'un 500)

#### T0.4 : Hook `useUpsellTiming` — signaux stables (BLOQUEUR)

- File: `src/hooks/useUpsellTiming.ts` (NEW)
- **Signaux (TOUS requis pour `canShowUpsell: true`) :**

  | Signal | Source de vérité | Pourquoi |
  |--------|-----------------|----------|
  | Compte créé depuis ≥ 7 jours | `profiles.created_at` (Supabase) | Stable, non falsifiable, multi-device |
  | Au moins 1 session loggée | `exercise_logs` count > 0 (Supabase) | Preuve d'engagement réel, pas juste navigation |
  | Au moins 1 semaine consultée | `localStorage: rugbyforge_week_viewed = true` | Signal léger de navigation, acceptable si perdu |

- **Persistance :** Les 2 premiers signaux viennent de Supabase = multi-device natif. Le 3e est localStorage = peut être perdu (acceptable, c'est le signal le moins critique).
- **Fallback offline :** Si Supabase est injoignable, `canShowUpsell = false` (fail-safe : pas d'upsell agressif en cas de problème réseau).
- **Comportement multi-device :** Les signaux Supabase sont partagés. Si l'utilisateur logge sur mobile, le seuil est atteint sur desktop aussi.
- **Retour du hook :**
  ```typescript
  interface UpsellTiming {
    canShowUpsell: boolean;
    daysRemaining: number; // jours avant éligibilité (0 si éligible)
    reason?: 'too_early' | 'no_logs' | 'no_week_view' | 'dismissed';
  }
  ```
- **Règle d'affichage upsell :**
  - **Max 1 `PremiumUpsellCard` visible par page.** Si une page a plusieurs upsells potentiels, afficher seulement le plus contextuel.
  - **Dismiss tracking :** Quand l'utilisateur ferme un upsell (bouton X), stocker `localStorage: rugbyforge_upsell_dismissed_{pageId} = timestamp`. Cooldown = 7 jours. Après le cooldown, l'upsell peut réapparaître.
  - **Pas de dismiss sur l'upsell Chat "limite atteinte"** — celui-ci est fonctionnel (l'utilisateur est réellement bloqué).

#### T0.5 : Brancher `useUpsellTiming` sur tous les `PremiumUpsellCard` existants

- Files: `src/pages/ProgressPage.tsx`, `src/pages/ChatPage.tsx`, `src/pages/ProfilePage.tsx`
- Action: Conditionner l'affichage des upsell cards à `canShowUpsell === true`. Ajouter bouton X dismiss sur chaque card (sauf Chat limite). Appliquer la règle max 1 card/page.
- **Plan de transition (pour ne pas casser les upsells existants en prod) :**
  - Les upsells actuels (ProgressPage × 3, ProfilePage × 1) sont visibles pour TOUS les Free en prod aujourd'hui.
  - Après déploiement de T0.4/T0.5, les utilisateurs Free < 7 jours ne verront plus les upsells. C'est le comportement voulu.
  - **Pas besoin de migration DB** — les signaux viennent de données existantes (created_at, exercise_logs).
  - **Pas de feature flag** — le timing upsell est déployé en une fois. Les utilisateurs existants qui remplissent déjà les 3 conditions voient les upsells immédiatement. Les nouveaux entrent dans le flow timing.
  - **Risque accepté :** Un utilisateur existant actif depuis 2 mois verra ses upsells disparaître temporairement s'il n'a jamais loggé une session (signal 2 manquant). C'est acceptable — s'il n'a jamais loggé, l'upsell n'a pas de valeur pour lui.

---

### VAGUE 1 — Session + Chat : valeur Premium quotidienne (5-8 jours)

> La Session est la surface Premium #1. Le Chat est la #2. Tout le reste attend.

#### T1.1 : Upsell contextuel Chat — limite atteinte

- File: `src/pages/ChatPage.tsx`
- Action: Quand la réponse backend retourne `{ limited: true }`, afficher un `PremiumUpsellCard` (non-dismissable) : "Tu as utilisé tes 5 messages du jour. Le coach Premium te connaît — il sait ton poste, ta charge, tes blessures, et adapte chaque réponse."
- Notes: Conditionné par `useUpsellTiming` pour les autres upsells Chat, mais PAS pour l'upsell limite (qui est fonctionnel).

#### T1.2 : Frontend ChatPage — envoi du `userContext` au backend

- File: `src/pages/ChatPage.tsx`
- Action: Pour tous les utilisateurs (Free et Premium), envoyer un champ `userContext` dans le body de la requête au backend. Contient : `{ position, trainingLevel, seasonMode, acwr, injuries, recentSessions, nextMatch }`. Le backend IGNORE ce champ pour les Free (voir T0.3).
- Notes: Le frontend envoie toujours — c'est le backend qui décide quoi en faire. Pas de logique Premium côté client.

#### T1.3 : Suggestion de charge sur SessionDetailPage (PRIORITÉ #1)

- Files: Page de détail session, `src/services/loadSuggestion.ts` (NEW)
- Action: Pour Premium (`premium_program_adaptations`), afficher à côté de chaque exercice la suggestion de charge avec décision et justification. Pour Free : champ vide (comportement actuel).
- **Service `loadSuggestion.ts` — logique métier complète :**

  ```typescript
  interface LoadSuggestion {
    decision: 'increase' | 'maintain' | 'decrease' | 'no_data' | 'bodyweight' | 'no_suggestion';
    suggestedWeight: number | null;    // null si no_data, bodyweight, ou no_suggestion
    suggestedReps: number | null;      // pour bodyweight : reps cible (ex: +1 rep vs dernier log)
    suggestedTempo: string | null;     // pour bodyweight avancé : "3-1-2" (excentrique-pause-concentrique)
    justification: string;
    nextTarget: string | null;         // "Si réussi → semaine prochaine X kg" ou "→ +1 rep"
    confidence: 'high' | 'medium' | 'low';
  }
  ```

  **Retour par famille :**
  - **Weighted (compound + isolation) :** `suggestedWeight` rempli, `suggestedReps = null`
  - **Bodyweight :** `suggestedWeight = null`, `suggestedReps` rempli (dernier nombre de reps + 1 si RPE ≤ 7, même reps si RPE 8, -1 rep si RPE ≥ 9). `decision = 'bodyweight'`.
  - **Conditioning :** `decision = 'no_suggestion'`, tous les champs null. Pas de suggestion pour les intervalles/sprints.

  **Règles de décision :**

  | Condition | Décision | Incrément | Justification |
  |-----------|----------|-----------|---------------|
  | Dernier log RPE ≤ 7 + toutes reps complétées | AUGMENTER | Voir table famille | "Charge bien maîtrisée → on monte" |
  | Dernier log RPE 8 + toutes reps complétées | MAINTENIR | 0 | "Bonne intensité, on consolide" |
  | Dernier log RPE ≥ 9 ET reps incomplètes | RÉDUIRE | -incrément famille | "Reps incomplètes à RPE max → on baisse" |
  | Dernier log RPE ≥ 9 ET reps complétées | MAINTENIR | 0 | "RPE élevé mais reps OK → on consolide avant de monter" |
  | Dernier log RPE < 9 ET reps incomplètes | MAINTENIR | 0 | "Reps incomplètes → on reste à cette charge" |
  | Pas de log récent (> 14 jours) | MAINTENIR + alerte | 0 | "Pas de données récentes → reprise prudente" |
  | Premier log jamais pour cet exercice | NO_DATA | null | "Première fois — choisis ta charge, on ajustera ensuite" |
  | Semaine de deload active | RÉDUIRE | -15 à -20% | "Semaine de deload → charge allégée" |
  | ACWR > 1.3 (vigilance/danger) | MAINTENIR max | 0 (jamais augmenter) | "Charge élevée cette semaine → on ne monte pas" |
  | Utilisateur en rehab actif | MAINTENIR max | 0 (jamais augmenter) | "Protocole rehab actif → charge stable" |

  **Incréments par famille d'exercice (pas fixes) :**

  | Famille | Exemples | Incrément augmentation | Incrément réduction |
  |---------|----------|----------------------|-------------------|
  | Lower compound | Squat, deadlift, hip thrust | +5 kg | -5 kg |
  | Upper compound | Bench press, overhead press, row | +2.5 kg | -2.5 kg |
  | Lower isolation | Leg curl, leg extension, calf raise | +2.5 kg | -2.5 kg |
  | Upper isolation | Curl, lateral raise, tricep ext | +1 kg | -1 kg |
  | Bodyweight | Pull-up, dip, push-up | Pas de suggestion poids (reps only) | — |
  | Conditioning | Intervalles, sprints | Pas de suggestion | — |

  **Edge cases :**
  - **Changement d'équipement** (ex: dumbbell → barbell) : Si l'exercice ID a changé → traiter comme `no_data`. Si même exercice mais équipement différent (détectable via tags) → afficher suggestion avec `confidence: 'low'` et message "Équipement différent — ajuste si nécessaire".
  - **Substitution d'exercice** : Si le bloc a généré un exercice différent du dernier log (cross-session exclusion) → `no_data`. Pas de continuité entre exercices différents.
  - **Multi-logs même jour (split sessions AM/PM) :** Prendre le dernier log du même `exerciseId` dans la journée, trié par `created_at` DESC LIMIT 1. Pas d'agrégation, pas de moyenne — le dernier log chronologique fait foi. Cela couvre le cas AM/PM : si RPE 7 le matin et RPE 8 l'après-midi, c'est RPE 8 qui compte.
  - **Interaction fatigue :** Si `useFatigue` retourne `fatigueLevel === 'high'` → forcer MAINTENIR max, jamais AUGMENTER.

#### T1.4 : Indicateur progression par exercice (flèche ↑↓→)

- File: Page de détail session
- Action: Pour Premium, à côté de chaque exercice une flèche colorée basée sur la **charge réellement loggée** (pas la suggestion) comparée au dernier log du même exercice :
  - ↑ verte = charge augmentée ET RPE n'a pas augmenté de plus de 2 points (vraie progression)
  - ⚠ orange = charge augmentée MAIS RPE a augmenté de > 2 points (progression coûteuse — pas une vraie amélioration)
  - ↓ rouge = charge réduite
  - → grise = charge maintenue
  - ○ neutre = pas de donnée précédente ou exercice différent
- **Comparaison :** Toujours inter-session (dernière occurrence du même `exerciseId`), pas intra-semaine.
- **Bodyweight :** La flèche compare les reps, pas le poids. +reps à même RPE = ↑ verte.
- Notes: Même source de données que T1.3. La flèche est calculée APRÈS le log, pas avant (c'est un indicateur de résultat, pas de suggestion).

---

### VAGUE 2 — Intelligence sur les surfaces quotidiennes (5-8 jours)

> Le Premium se ressent à chaque ouverture de l'app.

#### T2.1 : Résumé intelligent de semaine (HomePage)

- File: `src/pages/HomePage.tsx`
- Action: Pour Premium, card "Ta semaine" sous le hero : nb séances prévues, qualité prioritaire, alerte si double-match week.
- **Règle qualité prioritaire (semaine mixte) :** Afficher la phase de la session de rang 0 (première session de la semaine). En DUP in-season : session 0 = FORCE → qualité = "Force". En off-season block : la phase du bloc courant (H1-H4 = "Hypertrophie", W1-W4 = "Force", etc.). Si le programme retourne un deload → qualité = "Deload / Récupération".
- Notes: Source = `getSessionPhase()` dans `programPhases.v1.ts` appliqué à la session index 0. Pas d'appel IA.

#### T2.2 : Lecture qualitative de la charge (HomePage + WeekPage)

- Files: `src/pages/HomePage.tsx`, `src/pages/WeekPage.tsx`
- **Scope réduit en V1 :** Pas de prédiction ACWR numérique (formule trop imprécise sans historique complet). À la place, lecture qualitative basée sur les données existantes.
- Action: Pour Premium, afficher une étiquette contextuelle :

  | Condition | Étiquette | Couleur |
  |-----------|-----------|---------|
  | ACWR < 0.8 | "Semaine légère — tu peux pousser" | Bleu |
  | ACWR 0.8–1.1 | "Charge maîtrisée — continue" | Vert |
  | ACWR 1.1–1.3 | "Semaine chargée — reste attentif" | Jaune |
  | ACWR > 1.3 | "Charge élevée — envisage un allègement" | Orange |
  | ACWR > 1.5 | "Danger — deload fortement recommandé" | Rouge |

- Notes: Pas de prédiction future en V1. On ne prédit pas, on lit l'état actuel avec des mots clairs. La prédiction numérique pourra être ajoutée en V3+ quand on aura un modèle de charge par session.

#### T2.3 : Alerte risque blessure contextuelle (HomePage)

- File: `src/pages/HomePage.tsx`
- **Conditions d'affichage (TOUTES requises) :**
  1. Utilisateur Premium
  2. ACWR > 1.3 (source : `useACWR`)
  3. CMJ en régression > 10% vs **baseline individuelle** (source : `useAthleteTests`)
  4. L'utilisateur n'est PAS en protocole rehab actif (source : `useProfile().rehabInjury`)
- **Définition de la baseline CMJ :**
  - **Baseline = valeur CMJ absolue la plus élevée (en cm) parmi les mesures des 8 dernières semaines glissantes.**
  - Pas de normalisation par poids de corps (le CMJ est déjà un indicateur de puissance relative suffisant pour ce use case).
  - Si < 3 mesures CMJ dans la fenêtre → ne PAS afficher l'alerte (données insuffisantes). Pas de fallback sur une fenêtre plus large.
  - Égalités : en cas de 2 valeurs identiques, la baseline reste cette valeur (pas de tie-breaking nécessaire).
  - Outliers : aucun filtre automatique. Si un CMJ semble aberrant (ex: 80cm pour un joueur habituellement à 35cm), c'est un problème de saisie — l'utilisateur doit corriger manuellement. L'alerte prend les données telles quelles.
  - Recalcul : à chaque ouverture de la HomePage (pas de cache long). La fenêtre glissante avance naturellement.
  - **Seuil régression : dernière mesure CMJ < 90% de la baseline** (soit -10%, aligné sur KB `evidence-register.md` : "CMJ >10% drop = fatigue alert")
  - Exemple : baseline = 38cm, dernière mesure = 33cm → régression 13% → alerte déclenchée
- **Message affiché :** "Ton ratio de charge (ACWR {value}) et ta fraîcheur neuromusculaire (CMJ {pct_drop}% sous ta baseline) indiquent un risque élevé. Deload recommandé cette semaine."
- **Quand l'alerte est masquée :**
  - Si rehab actif → masquée (le rehab gère déjà la charge)
  - Si < 3 mesures CMJ → masquée (pas assez de données)
  - Si ACWR ≤ 1.3 OU CMJ dans les 10% de la baseline → masquée
  - Si l'utilisateur a dismiss l'alerte :
    - **Durée du dismiss :** 48h (localStorage `rugbyforge_injury_alert_dismissed = timestamp`)
    - **Scope :** App-wide (pas seulement HomePage — l'alerte ne doit réapparaître sur aucune page pendant le cooldown)
    - **Re-trigger :** Si pendant le cooldown l'ACWR dépasse 1.5 (zone danger, seuil supérieur au trigger initial de 1.3), l'alerte réapparaît immédiatement malgré le dismiss — escalade de risque override le cooldown
    - **Auto-dismiss :** Si l'ACWR redescend ≤ 1.3 OU le CMJ remonte dans les 10% de la baseline, l'alerte disparaît automatiquement sans action utilisateur

#### T2.4 : Timeline récupération post-match (CalendarPage)

- File: `src/pages/CalendarPage.tsx`
- Action: Pour Premium, après log d'un match, afficher timeline. Formule : RPE ≥ 7 et durée ≥ 60min → 72-96h ; RPE < 7 ou durée < 60min → 48-72h.
- Notes: Barre de progression avec countdown. Référence KB `recovery.md`.

#### T2.5 : Upsell contextuel WeekPage — match proche

- File: `src/pages/WeekPage.tsx`
- Action: Si match dans les 3 jours ET `canShowUpsell` ET pas d'autre upsell visible sur cette page, afficher : "Adapte ta semaine automatiquement avant le match → Premium"
- Notes: Conditionné par `useUpsellTiming` + `useCalendar`. Règle max 1 upsell/page.

---

### VAGUE 3 — Différenciation avancée (8-12 jours)

> Les features qui font rester et recommander.

- [ ] **T3.1 : Conseil pré-match personnalisé (Chat)**
  - File: `supabase/functions/ai-coach/index.ts`, `src/pages/ChatPage.tsx`
  - Action: Pour Premium, ajouter un prompt rapide "Prépare mon match" qui génère un plan 48h (nutrition, hydratation, sommeil, activation) basé sur le poste, la charge récente et l'heure de coup d'envoi.
  - Notes: Nécessite `kickoff_time` du prochain match dans le context.

- [ ] **T3.2 : Optimiseur double-match week — modulation Premium (WeekPage)**
  - File: `src/pages/WeekPage.tsx`, `src/services/program/buildWeekProgram.ts`
  - **Ce qui EXISTE déjà en prod (Free + Premium) :** Détection visuelle de 2 matchs dans la semaine + badge "Semaine double match" sur WeekPage. KB `double-match-weeks.md` documentée.
  - **Delta V3 (Premium uniquement) :** Quand 2 matchs détectés, le programme est automatiquement modulé :
    - Réduction 50% volume S&C (nombre de sets réduit, pas de session supprimée)
    - Les sessions restantes passent en mode "maintenance" (pas de progression de charge cette semaine)
    - Message explicatif : "2 matchs cette semaine — programme allégé automatiquement. Volume réduit de 50%, charge maintenue."
  - **Pour Free en V3 :** Badge visuel existant inchangé. Pas de modulation automatique.
  - Notes: Nécessite un paramètre `doubleMatchWeek: boolean` dans `buildWeekProgram` qui modifie les recettes/volumes. Intégration non triviale avec le moteur existant.

- [ ] **T3.3 : Estimation 1RM avec courbe tendance (ProgressPage)**
  - File: `src/pages/ProgressPage.tsx`
  - Action: Pour Premium, dans l'onglet Tests, afficher une courbe tendance 1RM avec projection : "À ce rythme, 100kg squat dans X semaines".
  - Notes: Régression linéaire simple sur les derniers points de données `estimateOneRM`. Afficher seulement si ≥ 3 points.

- [ ] **T3.4 : Swap conditionnel de session (WeekPage)**
  - File: `src/pages/WeekPage.tsx`
  - Action: Pour Premium, si un match est demain et la session prévue est intense (UPPER/LOWER force), proposer un swap vers mobilité ou récup active. Bouton "Accepter la suggestion".
  - Notes: Ne modifie pas le programme permanent — juste une substitution ponctuelle affichée.

---

## Acceptance Criteria

### Vague 0 — Préconditions

- [ ] AC-0.1 : Given les 3 sources pricing (landing, DB, Stripe), when on les compare, then elles affichent/facturent le même montant exact.
- [ ] AC-0.2 : Given une carte test Stripe, when on complète un checkout Premium, then `user_subscriptions` est créé ET `user_entitlements` Premium sont attribués ET `useEntitlements().isPremium === true`.
- [ ] AC-0.3 : Given un utilisateur Premium actif, when il annule son abonnement Stripe, then ses entitlements Premium sont révoqués ET `isPremium === false`.
- [ ] AC-0.4 : Given un utilisateur Free, when il envoie un 6ème message au coach IA le même jour, then l'Edge Function retourne HTTP 429 `{ error: 'rate_limited', limited: true, remaining: 0 }`.
- [ ] AC-0.5 : Given un utilisateur Premium, when il envoie 50 messages au coach IA, then aucune limite n'est appliquée.
- [ ] AC-0.6 : Given un utilisateur Free qui envoie un `userContext` riche dans le payload Chat, when l'Edge Function traite la requête, then le system prompt NE contient PAS le profil joueur (le `userContext` est ignoré côté serveur).
- [ ] AC-0.7 : Given un utilisateur Premium, when l'Edge Function traite sa requête Chat, then le system prompt contient le poste, le niveau, le seasonMode, l'ACWR, les blessures, les 3 dernières sessions et le prochain match.
- [ ] AC-0.8 : Given un utilisateur Free inscrit depuis < 7 jours, when il visite ProgressPage, then aucun `PremiumUpsellCard` n'est visible.
- [ ] AC-0.9 : Given un utilisateur Free inscrit depuis > 7 jours avec ≥ 1 session loggée ET ≥ 1 semaine consultée (3 signaux T0.4 remplis), when il visite ProgressPage, then les upsell cards sont visibles.
- [ ] AC-0.9b : Given un utilisateur Free inscrit depuis > 7 jours avec ≥ 1 session loggée mais 0 semaine consultée, when il visite ProgressPage, then les upsell cards ne sont PAS visibles (3e signal manquant).
- [ ] AC-0.10 : Given un utilisateur qui dismiss un upsell, when il revisite la même page dans les 7 jours, then l'upsell ne réapparaît pas.
- [ ] AC-0.11 : Given une page avec 2+ upsells potentiels, when elle se charge, then max 1 upsell est visible.
- [ ] AC-0.12 : Given la table `ai_coach_usage` absente (migration pas encore passée), when un Free envoie un message, then la requête passe quand même (fail-safe, pas de blocage).

### Vague 1 — Session + Chat

- [ ] AC-1.1 : Given un utilisateur Premium qui a loggé un exercice (squat, RPE 7, 4×5 @ 80kg) la semaine précédente, when il ouvre la session de cette semaine, then il voit "82.5kg — Charge bien maîtrisée → on monte" et la flèche ↑ verte.
- [ ] AC-1.2a : Given un utilisateur Premium dont le dernier log squat était RPE 9 avec reps complétées, when il ouvre la session, then suggestion = MAINTENIR 80kg → grise, justification "RPE élevé mais reps OK → on consolide".
- [ ] AC-1.2b : Given un utilisateur Premium dont le dernier log squat était RPE 9 avec reps incomplètes (3/5 au lieu de 5/5), when il ouvre la session, then suggestion = RÉDUIRE 75kg ↓ rouge, justification "Reps incomplètes à RPE max → on baisse".
- [ ] AC-1.3 : Given un utilisateur Premium sans log pour un exercice, when il ouvre la session, then il voit "Première fois — choisis ta charge" sans suggestion numérique.
- [ ] AC-1.4 : Given un utilisateur Premium en semaine de deload, when il ouvre la session, then toutes les suggestions sont RÉDUIRE (-15 à -20%).
- [ ] AC-1.5 : Given un utilisateur Premium avec ACWR > 1.3, when il ouvre la session, then aucune suggestion ne propose AUGMENTER.
- [ ] AC-1.6 : Given un utilisateur Premium en rehab actif, when il ouvre la session, then aucune suggestion ne propose AUGMENTER.
- [ ] AC-1.7 : Given un utilisateur Free, when il ouvre la session, then il ne voit aucune suggestion de charge (champ vide).
- [ ] AC-1.8 : Given un exercice bodyweight (pull-up, dip), when Premium ouvre la session, then pas de suggestion de poids (reps only indication).
- [ ] AC-1.9 : Given un utilisateur Free qui atteint la limite chat, when le frontend affiche l'upsell, then l'upsell est non-dismissable (pas de bouton X).
- [ ] AC-1.10 : Given un utilisateur Premium qui pose "Je mange quoi avant un match ?", when le coach répond, then la réponse mentionne son poids, son poste, et l'heure du prochain match.
- [ ] AC-1.11 : Given un utilisateur Free posant la même question, then la réponse est un conseil générique sans données personnelles.

### Vague 2 — Surfaces quotidiennes

- [ ] AC-2.1 : Given un utilisateur Premium avec 2+ semaines d'ACWR, when il ouvre HomePage, then il voit un résumé "Ta semaine" avec nb séances et qualité prioritaire.
- [ ] AC-2.2 : Given un utilisateur Premium avec ACWR 1.25, when il ouvre HomePage, then l'étiquette affiche "Semaine chargée — reste attentif" en jaune.
- [ ] AC-2.3 : Given un utilisateur Premium avec ACWR > 1.3 ET CMJ en régression > 10% vs baseline (rolling best 8 semaines) ET pas en rehab ET ≥ 3 mesures CMJ, when il ouvre HomePage, then l'alerte risque est visible.
- [ ] AC-2.4 : Given un utilisateur Premium avec ACWR > 1.3 mais < 3 mesures CMJ, when il ouvre HomePage, then l'alerte risque N'est PAS visible.
- [ ] AC-2.5 : Given un utilisateur Premium en rehab actif avec ACWR > 1.3 et CMJ -15%, when il ouvre HomePage, then l'alerte risque N'est PAS visible (rehab override).
- [ ] AC-2.6 : Given un utilisateur Free, when il ouvre HomePage, then aucun résumé intelligent, étiquette charge ou alerte risque n'est visible.
- [ ] AC-2.7 : Given un utilisateur Premium qui vient de logger un match RPE 8 × 80min, when il consulte CalendarPage, then il voit "Récupération estimée : 72-96h".

### Vague 3

- [ ] AC-3.1 : Given un utilisateur Premium avec un match dans 48h, when il utilise "Prépare mon match", then le coach retourne un plan personnalisé avec nutrition, récup, activation.
- [ ] AC-3.2 : Given un utilisateur Premium en double-match week, when il consulte WeekPage, then le programme est modulé avec explication.
- [ ] AC-3.3 : Given un utilisateur Premium avec ≥ 3 mesures 1RM, when il consulte ProgressPage Tests, then il voit une courbe tendance avec projection.

---

## Règle d'upsell timing

> Voir T0.4 pour la spécification complète du hook `useUpsellTiming`. Résumé ici pour référence rapide.

### Conditions (TOUTES requises)

| Signal | Source | Multi-device |
|--------|--------|-------------|
| Compte ≥ 7 jours | `profiles.created_at` (Supabase) | Oui |
| ≥ 1 session loggée | `exercise_logs` count (Supabase) | Oui |
| ≥ 1 semaine consultée | `localStorage` | Non (acceptable) |

### Comportement d'affichage

- Max 1 upsell visible par page
- Dismiss → cooldown 7 jours (localStorage)
- Offline/erreur réseau → `canShowUpsell = false` (fail-safe)
- Exception : upsell Chat "limite atteinte" = non-dismissable, toujours visible quand bloqué

---

## Correction pricing — INCOHÉRENCE CRITIQUE

> Voir T0.1 + T0.2 pour les tâches détaillées. Résumé ici pour référence.

### Constat

3 sources divergentes : Landing (5.99€/47.99€), DB (9.99€/99.90€), Stripe (inconnu). Bloqueur avant tout lancement Premium.

### Processus de décision

- **Owner :** Product Owner (Coach)
- **Deadline :** 27 mars 2026. Passé cette date → prix landing (5.99€/47.99€) par défaut.
- **Decision-gate :** T0.2 (Stripe E2E) bloqué tant que prix non alignés. Vague 1 bloquée de facto.
- **Recommandation (non-contraignante) :** Option A (5.99€/47.99€) pour la bêta
- **Source de vérité temporaire :** Les prix landing font foi. Checkout désactivé tant que non aligné.

---

## Ce qui reste ABSOLUMENT Free

> Le cœur du produit ne sera JAMAIS payant.

| Feature | Pourquoi c'est Free |
|---------|-------------------|
| Programme périodisé complet (toutes phases, tous niveaux) | C'est la promesse #1. Gater le programme = tuer le produit. |
| Voir ses sessions (blocs, exercices, sets/reps) | Inutilisable sinon. |
| Logger ses charges | L'input utilisateur est ce qui crée la valeur. Plus il logge, plus le Premium a du sens. |
| Calendrier matchs + CRUD événements | Infrastructure de base, pas de valeur perçue à gater. |
| ACWR basique (zones, valeur) | La promesse SEO/blog. Le Free doit prouver que ça marche. |
| Prehab automatique | Prévention = engagement sanitaire, pas un luxe. |
| Rehab protocol | Idem — responsabilité. |
| Mobilité post-match | Idem. |
| Chat IA basique (5 msg/jour) | Le Free doit goûter la valeur du coach pour vouloir plus. |
| 4 prompts de base Chat | Assez pour voir que c'est utile, pas assez pour remplacer Premium. |

---

## Quick wins vs Chantiers

### Quick wins (< 1 jour chacun)

| ID | Tâche | Impact |
|----|-------|--------|
| T0.1 | Décision pricing + alignement sources | Critique (bloqueur) |
| T0.4 | Hook `useUpsellTiming` | Fort (anti-frustration) |
| T0.5 | Brancher timing + dismiss sur upsells existants | Fort |
| T1.1 | Upsell contextuel Chat limite atteinte | Fort (conversion) |
| T2.5 | Upsell contextuel WeekPage match proche | Moyen |

### Chantiers moyens (2-3 jours)

| ID | Tâche | Impact |
|----|-------|--------|
| T0.2 | Validation Stripe / entitlements E2E | Critique (bloqueur) |
| T0.3 | Backend AI coach gating + rate limit + schema | Fort (monétisation réelle) |
| T1.3 | Suggestions charge + indicateur progression | Très fort (conversion) |
| T2.1 | Résumé intelligent semaine | Fort (engagement quotidien) |

### Chantiers lourds (5+ jours)

| ID | Tâche | Impact |
|----|-------|--------|
| T2.2+T2.3 | Lecture qualitative charge + alerte risque | Très fort (différenciation unique) |
| T2.5 | Timeline récupération post-match | Moyen |
| T3.1 | Conseil pré-match personnalisé | Fort |
| T3.2 | Optimiseur double-match week | Moyen |
| T3.3 | Courbe tendance 1RM + projection | Moyen |
| T3.4 | Swap conditionnel session | Moyen |

---

## Context for Development

### Codebase Patterns

- Entitlements : `useEntitlements()` → `useFeatureAccess()` → composants
- Upsell : `PremiumUpsellCard` avec `usePremiumCheckout().startCheckout(planId)`
- Programme : `buildWeekProgram()` source de vérité unique
- AI : Edge Function `ai-coach` (claude-haiku-4-5-20251001, 800 tokens max)
- Données : `exercise_logs`, `athletic_tests`, `match_calendar` en Supabase
- Hooks : `useACWR`, `useCalendar`, `useAthleteTests`, `useFatigue`, `useHistory`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/hooks/useEntitlements.ts` | Source de vérité entitlements |
| `src/hooks/useFeatureAccess.ts` | Mapping entitlements → features |
| `src/components/PremiumUpsellCard.tsx` | Composant d'upsell réutilisable |
| `src/pages/LandingPage.tsx` | Pricing affiché à corriger |
| `src/pages/ProgressPage.tsx` | Surface Premium la plus mature |
| `src/pages/ChatPage.tsx` | Surface coach IA |
| `src/pages/HomePage.tsx` | Surface quotidienne |
| `src/pages/WeekPage.tsx` | Surface programme |
| `src/pages/CalendarPage.tsx` | Surface calendrier/matchs |
| `supabase/functions/ai-coach/index.ts` | Backend coach IA |
| `src/hooks/useACWR.ts` | Calcul ACWR |
| `src/hooks/useCalendar.ts` | Données calendrier |
| `src/hooks/useAthleteTests.ts` | Données tests physiques |

### Technical Decisions

- Le rate limiting AI coach est côté serveur (Edge Function), pas client
- Le timing upsell est un hook dédié (`useUpsellTiming`) pour centraliser la logique
- Les suggestions de charge utilisent les `exercise_logs` existants, pas d'IA
- Les prédictions ACWR sont calculées algorithmiquement, pas par IA
- Aucune feature Free existante ne devient payante — on ajoute seulement des couches Premium

---

## Additional Context

### Dependencies

- Supabase `user_entitlements` + `plan_entitlements` (déjà en prod)
- `exercise_logs` table (déjà en prod)
- `athletic_tests` table (déjà en prod)
- `match_calendar` table (déjà en prod)
- Stripe secrets configurés (STRIPE_SECRET_KEY, PRICE_IDs)
- Webhook `sync-checkout-session` déployé et fonctionnel

### Testing Strategy

#### Vague 0 — Tests de préconditions (OBLIGATOIRES avant Vague 1)

| Test | Type | Détail |
|------|------|--------|
| **Billing E2E** | Manuel + curl | Carte test Stripe → checkout → webhook → entitlements attribués → `isPremium: true` |
| **Billing rollback** | Manuel + curl | Annulation Stripe → entitlements révoqués → `isPremium: false` |
| **Rate limit Free** | curl / Postman | Envoyer 6 requêtes POST `ai-coach` avec JWT Free → 5 passent, 6ème = HTTP 429 |
| **Rate limit Premium** | curl / Postman | Envoyer 10 requêtes POST `ai-coach` avec JWT Premium → toutes passent |
| **System prompt Free** | curl + log | Envoyer requête Free avec `userContext` riche → vérifier que le system prompt retourné ne contient PAS le profil |
| **System prompt Premium** | curl + log | Envoyer requête Premium → vérifier que le system prompt contient le profil complet |
| **Rate limit reset** | Manuel | Envoyer 5 messages Free → attendre changement de date UTC → envoyer 1 message → passe (compteur reset) |
| **Fail-safe table absente** | Manuel | Drop table `ai_coach_usage` → envoyer message Free → passe sans erreur (pas de blocage) |
| **Fail-safe données corrompues** | Manuel | `UPDATE ai_coach_usage SET message_count = -5 WHERE user_id = $1` → envoyer message → passe sans erreur (compteur négatif traité comme 0, pas de crash) |
| **Upsell timing < 7j** | Manuel | Créer compte → visiter ProgressPage immédiatement → aucun upsell visible |
| **Upsell timing ≥ 7j + log** | Manuel | Compte > 7j + ≥ 1 log → visiter ProgressPage → upsell visible |
| **Upsell dismiss** | Manuel | Dismiss un upsell → revisiter dans 3j → upsell absent → revisiter après 7j → upsell revient |
| **Max 1 upsell/page** | Manuel | Page avec 2+ upsells éligibles → vérifier qu'un seul s'affiche |
| **Script test Premium** | SQL | Exécuter `grant_test_premium(user_id)` → vérifier que `isPremium: true` côté frontend |

#### Vague 1 — Tests fonctionnels Session + Chat

| Test | Type | Détail |
|------|------|--------|
| **Suggestion charge AUGMENTER** | Manuel | Log squat RPE 7 4×5 @ 80kg → semaine suivante → suggestion 85kg ↑ |
| **Suggestion charge MAINTENIR** | Manuel | Log squat RPE 8 → suggestion 80kg → |
| **Suggestion charge RÉDUIRE** | Manuel | Log squat RPE 9 reps incomplètes → suggestion 75kg ↓ |
| **Suggestion premier exercice** | Manuel | Exercice jamais loggé → "Première fois — choisis ta charge" |
| **Suggestion deload** | Manuel | Semaine H4 deload → toutes suggestions RÉDUIRE |
| **Suggestion ACWR > 1.3** | Manuel | ACWR 1.4 → aucune suggestion AUGMENTER |
| **Suggestion rehab** | Manuel | Rehab actif → aucune suggestion AUGMENTER |
| **Suggestion bodyweight** | Manuel | Pull-up → pas de suggestion poids |
| **Suggestion multi-logs** | Manuel | 2 logs même jour → le plus récent (`created_at DESC`) est utilisé |
| **Chat Premium qualité** | Manuel | Premium demande "je mange quoi avant un match" → réponse mentionne poids, poste, heure match |
| **Chat Free qualité** | Manuel | Free demande la même chose → réponse générique, pas de données perso |
| **Multi-device timing** | Manuel | Log exercice sur mobile → vérifier que `canShowUpsell` passe à true sur desktop |

#### Vague 2 — Tests intelligence

| Test | Type | Détail |
|------|------|--------|
| **Étiquette charge** | Manuel | ACWR 1.25 → "Semaine chargée" jaune. ACWR 0.9 → "Charge maîtrisée" vert |
| **Alerte risque — conditions remplies** | Manuel | ACWR 1.4 + CMJ -12% vs baseline + ≥ 3 mesures + pas rehab → alerte visible |
| **Alerte risque — données insuffisantes** | Manuel | ACWR 1.4 + 2 mesures CMJ seulement → alerte absente |
| **Alerte risque — rehab override** | Manuel | ACWR 1.4 + CMJ -15% + rehab actif → alerte absente |
| **Timeline récup** | Manuel | Log match RPE 8 × 80min → "72-96h" affiché |

#### Chemin de secours dev/test

- **Si Stripe non configuré :** Script SQL `grant_test_premium(user_id)` pour simuler un utilisateur Premium
- **Si Edge Function non déployée :** Mock local qui retourne les mêmes shapes JSON
- **Condition de release :** Aucune feature Premium gatée n'est déployée en production sans validation billing E2E réussie

### Notes

- **Risque principal :** Le webhook Stripe `sync-checkout-session` doit être vérifié avant tout déploiement Premium réel. Sans lui, un utilisateur qui paye ne reçoit jamais ses entitlements.
- **Limitation connue :** Le timing upsell par localStorage peut être contourné (clear storage). Acceptable pour la bêta.
- **Future consideration :** Trial period (7 jours Premium gratuit) — pas dans ce lot mais infrastructure prête (status 'trialing' existe en DB).
- **Future consideration :** Coach mode équipe (#28) — entitlement `coach_mode` existe en DB mais 0 frontend. Feature premium naturelle pour V2.

---

## Synthèse marketing — Réutilisable pour le site vitrine

> **RÈGLE CRITIQUE :** Ne jamais promettre sur le site ce qui n'est pas encore en production. Cette synthèse distingue clairement ce qui existe AUJOURD'HUI, ce qui arrive en Vague 1, et ce qui viendra en Vague 2+. Le site vitrine ne doit être mis à jour qu'après chaque vague livrée.

---

### Promesse Free

> **Un vrai programme de préparation physique rugby, pas un PDF générique.**
>
> Programme périodisé adapté à ton niveau, ta saison et ton équipement. Suivi de charge ACWR. Prévention blessures automatique. Calendrier club. Coach IA pour tes questions nutrition et récupération.
>
> Gratuit. Pour toujours.

### Promesse Premium

> **Sache exactement quoi faire, quoi charger, et comment progresser.**
>
> Le Premium ne débloque pas des écrans — il enlève l'incertitude. Suggestions de charge automatiques. Coach IA qui te connaît personnellement. Analyse de progression et alertes quand tu dérives.
>
> Le coach que tu n'as pas dans ton club.

---

### Ce qui EXISTE DÉJÀ aujourd'hui (Free)

Ces features sont en production et peuvent être communiquées immédiatement :

| Feature | Détail |
|---------|--------|
| Programme périodisé complet | Toutes les phases (hyper/force/power), 3 niveaux, 3 modes saison |
| Sessions détaillées | 88 blocs, exercices avec sets/reps |
| Logging des charges | Input libre sur chaque exercice |
| ACWR basique | Zones visuelles (optimal/vigilance/danger), valeur numérique |
| Calendrier club | Matchs, repos, indisponibilités, recherche FFR |
| Prehab + mobilité + rehab | Prévention automatique, mobilité post-match, protocole retour blessure |
| Coach IA | Nutrition, récupération, sommeil, blessures (basé sur 186+ références) |
| Tests physiques (saisie) | CMJ, sprint 10m, 1RM estimé, Yo-Yo IR1 |
| Adhérence programme | Taux 7j/28j, activité récente |

### Ce qui EXISTE DÉJÀ aujourd'hui (Premium) — ATTENTION

| Feature | Statut réel |
|---------|------------|
| Prompts contextuels Chat (frontend) | Gate frontend UNIQUEMENT. Le backend ne vérifie pas l'entitlement. **Non sécurisé.** |
| Upsell objectifs de charge | Card upsell visible — mais **feature derrière non implémentée** |
| Upsell courbes de progression | Card upsell visible — mais **feature derrière non implémentée** |
| Upsell baselines par poste | Card upsell visible — mais **feature derrière non implémentée** |

**RÈGLE :** Ne PAS communiquer ces features comme "Premium existant" sur le site. Les upsells promettent des features qui n'existent pas encore. Deux options :
1. Implémenter les features derrière (Vague 1+)
2. Retirer temporairement les cards upsell jusqu'à ce que les features soient prêtes

**Aucune promesse marketing ne doit être basée sur une feature non sécurisée côté backend.**

---

### Ce qu'on AJOUTE en Vague 1 (à communiquer APRÈS livraison)

| Feature | Bénéfice utilisateur | Surface |
|---------|---------------------|---------|
| **Charge cible suggérée** | "Combien je mets ?" → réponse immédiate avec justification | Session |
| **Logique augmenter / maintenir / réduire** | Décision explicite basée sur le dernier log et le RPE | Session |
| **Indicateur de progression ↑↓→** | Voir d'un coup d'œil si on progresse sur chaque exercice | Session |
| **Rate limit Chat Free (5 msg/jour)** | Le Free goûte la valeur, le Premium en profite pleinement | Chat |
| **System prompt enrichi Premium** | Le coach connaît ton poste, ton ACWR, tes blessures | Chat |
| **Timing upsell intelligent** | Pas d'upsell avant 7j + 1 session + 1 log | Global |

**Bullets marketing Vague 1 :**
- Suggestions de charge automatiques session par session
- Le coach IA connaît ton profil, ta charge et tes blessures
- "On te dit exactement combien charger, et pourquoi"

---

### Ce qu'on AJOUTE en Vague 2 (à communiquer APRÈS livraison)

| Feature | Bénéfice utilisateur | Surface |
|---------|---------------------|---------|
| **Résumé intelligent de semaine** | "Qu'est-ce qui m'attend ?" → vision claire en 5 secondes | Home |
| **Lecture intelligente de la charge** | "Ma semaine est-elle trop chargée ?" → étiquette claire et actionnable | Home / Week |
| **Alerte risque blessure croisée** | ACWR + CMJ combinés → "Attention, deload recommandé" | Home |
| **Timeline récupération post-match** | "Quand est-ce que je serai prêt ?" → countdown réaliste | Calendar |

**Bullets marketing Vague 2 :**
- Lecture intelligente de ta charge et alertes risque blessure
- Résumé intelligent de ta semaine d'entraînement
- "Comprends ta charge avant qu'elle ne devienne un problème"

---

### Ce qui viendra en Vague 3+ (NE PAS communiquer encore)

| Feature | Bénéfice utilisateur |
|---------|---------------------|
| Plan pré-match personnalisé | Nutrition, récup, activation 48h avant |
| Optimiseur double-match week | Programme auto-modulé quand 2 matchs |
| Courbes de progression + projections 1RM | "À ce rythme, 100kg squat dans 7 semaines" |
| Swap conditionnel de session | "Match demain → on te propose mobilité" |

---

### Bullets marketing — par vague de mise à jour du site

#### Mise à jour immédiate (ce qui existe déjà — VÉRIFIÉ en prod)

**Section Free (communicable maintenant) :**
- Programme complet adapté à ton niveau et ta saison
- Suivi de charge ACWR intégré
- Prévention blessures automatique (prehab, mobilité, rehab)
- Calendrier club avec gestion des matchs
- Coach IA pour tes questions du quotidien
- Tests physiques : CMJ, sprint, 1RM, Yo-Yo
- "Gratuit, pour toujours. Pas de piège."

**Section Premium (NE PAS communiquer tant que Vague 0 n'est pas livrée) :**
- Aucune feature Premium n'est actuellement sécurisée côté backend
- Attendre Vague 0 (gating AI, billing E2E, timing upsell) avant toute communication Premium
- Message placeholder : "Le Premium arrive bientôt."

#### Après Vague 0+1 (seulement quand billing E2E validé + features livrées)

**Section Premium (première vraie communication) :**
- Suggestions de charge automatiques session par session
- Coach IA illimité qui connaît ton profil complet
- Indicateur de progression par exercice
- "On te dit exactement combien charger, et pourquoi."
- "Le coach que tu n'as pas dans ton club."

**Prérequis communication :** Billing E2E testé + rate limit AI vérifié + suggestions charge fonctionnelles en prod.

#### Après Vague 2 (seulement quand features livrées)

**Section Premium (ajout) :**
- Lecture intelligente de ta charge (maîtrisée / élevée / danger)
- Alertes risque blessure croisées (ACWR + tests physiques)
- Résumé intelligent de ta semaine d'entraînement
- Timeline de récupération post-match
- "Anticipe, adapte, progresse — sans incertitude."

**Prérequis communication :** Alertes risque validées (pas de faux positifs) + étiquettes charge testées.

---

### CTA

- "Commence gratuitement" (Free)
- "Passe en Premium — sache exactement quoi charger" (Premium, après V1)

### Social proof à construire

- Nombre d'utilisateurs actifs
- "Basé sur 186+ références scientifiques"
- "88 blocs d'entraînement, 3 niveaux, 12 semaines de périodisation"
