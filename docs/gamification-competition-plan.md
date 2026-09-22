# Gamification & compétition entre athlètes — plan

> Statut : **option B implémentée**. Le plan initial proposait A (conservateur) et B
> (ambitieux) ; l'arbitrage humain a retenu **B**, ainsi que le principe directeur du
> § 3 (« le score récompense la conformité au plan, pas le volume »).
>
> Les § 1 à 9 restent la référence de conception. Le § 10 (recommandation « faire A
> d'abord ») est **caduc** : il est conservé tel quel pour garder trace du
> raisonnement soumis à l'arbitrage. Ce qui a effectivement été livré est décrit au
> § 11.

---

## 1. Ce qui existe déjà

Le socle est plus avancé qu'il n'y paraît : la moitié des briques « solo » sont là,
mais **rien n'est persisté et rien n'est social**.

| Brique | État | Emplacement |
|---|---|---|
| Streak (jours actifs / 14 j) | Calculé au render, non persisté | `src/services/home/computeStreak.ts`, `StreakCard` |
| Jalons / badges | Calculés au render, non persistés | `src/services/home/computeMilestones.ts`, `BadgesStrip` |
| Événements d'entraînement | Persistés, riches | `session_logs`, `block_logs`, `exercise_set_logs` |
| Adhérence au plan | Calculée côté staff uniquement | `buildAthleteStaffWeeklyView.ts` (`completionVsPlanned7d`) |
| Charge / ACWR | Calculé client (`RPE × durée`) | `src/hooks/useACWR.ts` |
| Identité sociale | `display_name` + avatar public, `club_code` | `profiles`, bucket `avatars` |
| Cercle social | Existe déjà côté staff via RLS | `club_athlete_memberships` |
| Points / XP / niveaux / classement | **Inexistant** | — |
| Visibilité entre athlètes | **Inexistante** (seul le staff voit ses athlètes) | — |

Deux conséquences pour le plan :

- Les badges et le streak actuels sont **recalculés à chaque affichage**. Il n'y a
  aucun historique de déblocage, donc impossible aujourd'hui de dire « tu as
  débloqué ça mardi » ni de notifier un déblocage. Toute gamification durable
  demande de persister l'état.
- Le club est **déjà** modélisé comme un périmètre de visibilité. C'est l'arène
  naturelle de la compétition, sans rien inventer.

### Dette à purger avant de compter des points

`src/types/training.ts` autorise les types de séance `RECOVERY` et
`ACTIVE_RECOVERY`, mais **aucune migration ne les autorise en base** : le CHECK sur
`session_logs.session_type` se limite à `UPPER`, `LOWER`, `FULL`, `CONDITIONING`.
Les quick-logs de récup active de `WeekPage` retombent donc en localStorage sans
atteindre Supabase. Si le score se calcule côté serveur, ces séances seraient
invisibles et l'utilisateur perdrait des points qu'il a mérités. **À corriger en
préalable des deux options.**

---

## 2. Ce que dit l'état de l'art

Synthèse des sources consultées (Trophy 2026, Strava, Duolingo, Guul, Mindster,
plus la littérature académique sur les effets indésirables).

**Ce qui marche :**

- **L'arène doit être gagnable.** Le vrai moteur de rétention de Strava n'est pas
  le classement mondial, c'est le *Segment* : une arène restreinte où seuls les
  athlètes ayant fait la même route s'affrontent. Un classement global qui place
  l'utilisateur 94 000ᵉ est fermé et jamais réouvert. Les classements par cohorte
  augmentent la participation aux défis jusqu'à +35 %.
- **Le classement doit se réinitialiser.** La compétition est 3,4× plus intense
  sur des classements récurrents (remis à zéro) que sur des classements perpétuels,
  et le top 10 % y tourne 8× plus. Un classement « depuis toujours » se figeait et
  meurt.
- **La cohorte doit être petite.** Duolingo cale ses ligues à 20–30 personnes,
  appariées par volume de la semaine précédente et par fuseau horaire, pour que le
  top 5 reste plausible pour n'importe qui.
- **La visibilité sociale allonge les séries.** Les apps dont les streaks sont
  visibles par les pairs affichent des séries 5,7 jours en moyenne contre 4,3 sans
  couche sociale (+34 %).
- **Le meilleur déclencheur de réengagement est un événement réel**, pas une
  relance générique. « Quelqu'un vient de te passer » fonctionne, « tu ne t'es pas
  entraîné depuis 3 jours » beaucoup moins.
- **La reconnaissance légère compte.** Les kudos de Strava (14 milliards en 2025,
  +20 % sur un an) sont une boucle de validation à très faible coût de build.
- **Le palier difficile retient.** Les utilisateurs qui complètent des
  accomplissements du niveau le plus dur sont retenus à 74 % contre 32 % pour le
  plus facile.

**Ce qui casse :**

- La gamification par **compétition** augmente le stress mesuré et dégrade la
  motivation intrinsèque, avec des effets différenciés : plus de stress rapporté
  chez les femmes, plus de dynamiques sociales négatives chez les hommes. Les
  variantes orientées **exploration de soi** ne produisent pas ces effets.
- Le préjudice physique documenté est explicite : des utilisateurs **se
  surentraînent pour aller chercher une récompense de jeu**.
- En force et conditionnement, courir après le volume cumulé, le rang ou le streak
  encourage la surcharge, la dégradation technique et la récupération insuffisante.
  25 à 54 % des blessures en salle sont des blessures de surmenage, et la cause
  n°1 citée par les pratiquants est la surcharge.

---

## 3. Le principe directeur : on ne peut pas gagner en s'entraînant plus

C'est le point qui doit être tranché avant tout le reste, parce qu'il détermine la
formule de score, et donc tout le produit.

RugbyForge possède déjà un modèle de charge (`load-budgeting.md`, `useACWR`) dont
toute la doctrine dit l'inverse d'un classement au volume :

| Zone ACWR | Action programme |
|---|---|
| 0,8–1,3 | zone optimale, maintenir |
| 1,3–1,5 | réduire le volume de 20–30 % |
| > 1,5 | **deload obligatoire**, activation/mobilité seulement |

Un système de points qui récompenserait les séances cumulées, le tonnage ou la
charge pousserait mécaniquement les athlètes vers ACWR > 1,5 — la zone que l'app
elle-même qualifie de risque élevé de blessure. On construirait un générateur de
blessures avec une couche de confettis.

**Règle retenue : le score récompense la conformité au plan, pas la quantité
d'entraînement.** Concrètement :

- Une séance **prévue au programme et complétée** rapporte les points de base.
- Une séance **hors plan** rapporte des points **plafonnés** (une seule par semaine
  compte), pour ne pas pénaliser l'athlète motivé sans en faire une stratégie
  gagnante.
- Le **deload respecté rapporte des points pleins.** Une semaine de décharge menée
  correctement vaut autant qu'une semaine de charge. C'est le garde-fou central :
  se reposer quand le plan le dit ne fait pas perdre sa place.
- Le **repos prescrit à J-1 et J+1 de match rapporte des points.** Ne pas
  s'entraîner la veille d'un match est un comportement correct, pas un trou.
- **Aucun point n'est indexé sur le tonnage, la charge en kg, ni le RPE.** Ces
  champs sont déclaratifs : les indexer rendrait la triche triviale et la surcharge
  rentable.
- **Quand l'ACWR dépasse 1,5, le gain de points est gelé** et l'athlète voit
  pourquoi : « ta charge est en zone rouge, ton score est protégé cette semaine ».
  On transforme le garde-fou physiologique en information de jeu lisible.

Ce choix est aussi le positionnement produit : RugbyForge ne récompense pas celui
qui s'entraîne le plus, mais **celui qui tient son plan**. C'est défendable devant
un préparateur physique, et aucun concurrent grand public ne le fait.

---

## 4. Contraintes RGPD

Un classement nominatif entre utilisateurs est une communication de données
personnelles entre pairs, et les données d'entraînement d'un sportif sont
adjacentes aux données de santé. Les exigences qui en découlent :

- **Opt-in explicite et séparé.** Le consentement à la visibilité par les pairs ne
  peut pas être une case dans les CGU, et l'information doit être donnée **avant**
  la collecte, pas à trois clics de profondeur. Nouveau champ dédié, écran dédié.
  Le commentaire de la migration `20260623140000_profiles_display_name.sql` indique
  que `display_name` est aujourd'hui « visible par le staff du club » : l'exposer
  aux autres athlètes est une **nouvelle finalité**, qui exige son propre
  consentement.
- **Minimisation stricte de ce qui est exposé.** Sont partageables : le nom
  d'affichage, l'avatar, le nombre de séances tenues, le score, le niveau, le
  streak. Ne sortent **jamais** du périmètre de l'athlète : RPE, état de fatigue,
  blessures, poids, taille, consentements santé, contenu des séances, charges.
- **Aucun accès direct aux logs d'autrui.** La lecture passe par une vue ou une RPC
  `SECURITY DEFINER` qui ne renvoie que des agrégats, filtrés sur le champ de
  visibilité. Pas de policy RLS ouvrant `session_logs` en lecture croisée.
- **Mineurs : privé par défaut.** L'app connaît déjà `population_segment`,
  `age_band` et le cycle de consentement santé U18. Par défaut, aucun U18 n'entre
  dans un classement, et jamais dans un classement au-delà du club.
- **Réversibilité réelle.** Repasser en privé retire l'athlète des classements et
  purge ses entrées visibles, sans perdre son XP personnel.
- La pseudonymisation réduit le risque mais ne sort pas du RGPD : un pseudo associé
  à un score reste une donnée personnelle.

Traduction technique : un champ `social_visibility` à trois états —
`private` (défaut), `club`, `cohort` — jamais de mode « monde entier » nominatif.

---

## 5. Budget d'interruption

L'app monte déjà beaucoup d'overlays globaux : bandeau cookies, offre Founding,
invite notifications, prompt de mise à jour PWA, compagnon coach, sheet d'évolution
du programme, sheet post-séance, toasts de record et de correction de semaine. Une
pop-up sociale de plus dans ce contexte ne serait pas un nudge, ce serait du bruit.

Règles posées, quelle que soit l'option :

- **Une seule interruption sociale par ouverture d'app**, et jamais en concurrence
  avec un overlay existant (un registre de priorité arbitre).
- **Maximum 2 par semaine** en régime normal.
- **Jamais pendant une séance en cours** (`SessionRunContext` actif).
- **Toujours un fait vérifiable**, jamais une formule générée : si l'événement n'est
  pas réel, la pop-up ne s'affiche pas. Cohérent avec `PROJECT_RULES.md` § 5
  (« never invent »).
- **Jamais de formulation comparative dégradante.** « Untel a tenu son plan 3 fois
  cette semaine » est acceptable, « Untel est meilleur que toi » ne l'est pas. La
  littérature sur les effets indésirables porte précisément sur ce registre.
- Persistance des affichages via `useHintVisibility`, qui gère déjà cooldown,
  expiration, invalidation par hash de contexte et synchronisation multi-appareils
  (`user_dismissed_hints`). Rien à réinventer.

Sur la pop-up « entraîne-toi aujourd'hui comme *Nom Prénom* » demandée : elle n'est
affichable que si (1) l'athlète cité est opt-in, (2) l'athlète destinataire a bien
une séance prévue ce jour-là selon le moteur de planification. Proposer de
s'entraîner un J-1 de match ou un jour de deload contredirait le programme.
Le nudge est donc **filtré par le scheduling**, jamais posé par-dessus.

---

## 6. Option A — conservateur

**Intention : persister et rendre social le solo existant, sans nouvelle surface de
navigation ni compétition structurée.**

### Mécaniques

1. **Score de rigueur hebdomadaire** — points de conformité au plan selon § 3,
   calculés côté serveur, remis à zéro chaque semaine, historisés.
2. **XP cumulée et niveaux** — 5 paliers nommés rugby (p. ex. Espoir → Titulaire →
   Cadre → Capitaine → Légende), cumulatifs et **jamais décroissants**. On ne
   rétrograde pas quelqu'un qui a été blessé.
3. **Streak hebdomadaire persisté** — semaines consécutives où le plan a été tenu,
   avec **tolérance d'une semaine** (équivalent du streak freeze de Duolingo :
   blessure, examens, déplacement) pour éviter le tout-ou-rien.
4. **Classement club opt-in** — une carte sur `/home`, périmètre `club_code`,
   remise à zéro hebdo, **affichage en voisinage** (les 2 au-dessus, moi, les 2 en
   dessous). Pas de rang absolu affiché, conformément aux données sur l'effet
   démotivant des rangs lointains.
5. **Une seule famille de pop-up : le pouls du club.** « 4 joueurs de ton club ont
   tenu leur plan cette semaine », nominatif uniquement pour les opt-in. Format
   toast type `SessionPRToast`, plus `BottomSheet` pour les événements forts
   (passage de niveau).
6. **Badges persistés** — reprise de `computeMilestones` avec date de déblocage
   stockée, ce qui rend le « Nouveau » fiable et notifiable.

### Données

Deux tables, plus un champ de profil :

- `user_gamification_profile` — `user_id` (PK), `total_xp`, `level`,
  `current_week_streak`, `longest_week_streak`, `freeze_used_at`,
  `updated_at`.
- `gamification_weekly_scores` — `user_id`, `week_start` (lundi ISO), `points`,
  `sessions_planned`, `sessions_completed`, `deload_respected`,
  `acwr_capped` (bool), `breakdown` (JSONB), unique `(user_id, week_start)`.
- `profiles.social_visibility` — enum `private` | `club`, défaut `private`.
- `gamification_badges` — `user_id`, `badge_id`, `unlocked_at`, unique
  `(user_id, badge_id)`.

RLS : lecture/écriture propre uniquement. La lecture croisée passe par la RPC
`get_club_leaderboard(p_club_code)` en `SECURITY DEFINER`, qui filtre sur
`social_visibility = 'club'`, exclut les U18 sans consentement, et ne renvoie que
`display_name`, `avatar_url`, `points`, `level`, `sessions_completed`.

### Calcul

Une Edge Function `recompute-gamification` appelée (a) en fin de séance après
l'upsert de `session_logs`, (b) par `pg_cron` au changement de semaine pour clôturer
et archiver. Le cron hebdo existe déjà pour `send-training-reminders`, le pattern
est en place.

Le scoring vit dans un service **pur** côté `src/services/gamification/` afin
d'être testé en isolation et réutilisé par l'Edge Function — cohérent avec
`PROJECT_RULES.md` § 4 (déterminisme) et § 6 (petits modules lisibles).

### Fichiers touchés

```
supabase/migrations/<ts>_gamification_core.sql            (nouveau)
supabase/migrations/<ts>_session_logs_recovery_types.sql  (nouveau — dette § 1)
supabase/functions/recompute-gamification/index.ts        (nouveau)
src/services/gamification/computeWeeklyScore.ts           (nouveau, pur)
src/services/gamification/levels.ts                       (nouveau, pur)
src/services/gamification/socialNudge.ts                  (nouveau, pur)
src/types/gamification.ts                                 (nouveau)
src/hooks/useGamification.ts                              (nouveau)
src/components/home/RigorScoreCard.tsx                    (nouveau)
src/components/home/ClubLeaderboardCard.tsx               (nouveau)
src/components/social/ClubPulseToast.tsx                  (nouveau)
src/components/social/LevelUpSheet.tsx                    (nouveau)
src/pages/HomePage.tsx                                    (montage cartes + nudge)
src/pages/ProfilePage.tsx                                 (réglage visibilité + explication)
src/components/home/StreakCard.tsx                        (branché sur le streak persisté)
src/components/home/BadgesStrip.tsx                       (branché sur les badges persistés)
src/pages/PrivacyPage.tsx                                 (nouvelle finalité)
```

### Non fait en A

Pas de ligues, pas de promotion/relégation, pas de duels, pas de kudos, pas de push,
pas de nouvel onglet. Le classement reste intra-club : un athlète seul dans son club
ne voit qu'une carte solo.

---

## 7. Option B — ambitieux

**Intention : la compétition devient une boucle produit à part entière, avec une
arène gagnable même hors club.**

Reprend tout A, et ajoute :

1. **Ligues hebdomadaires par cohorte** — 20 à 30 athlètes, appariés sur le
   **volume hebdo prévu** et le `training_level` (pas sur la performance brute, pour
   que le débutant ne se batte pas contre un joueur en performance), 5 tiers rugby
   avec promotion des 5 premiers et relégation des 5 derniers. C'est la brique qui
   apporte le facteur 3,4× de la recherche : arène petite, appariée, réinitialisée.
   Elle résout aussi le cas de l'athlète isolé dans son club.
2. **Défi de club** — objectif collectif hebdo (« 20 séances tenues par l'équipe »)
   avec jauge partagée. Coopératif plutôt que comparatif, ce qui évite les effets
   indésirables de la compétition pure tout en gardant la pression sociale.
3. **Duels 1v1** — invitation explicite entre deux athlètes sur une semaine.
   L'engagement volontaire est ce qui rend la compétition acceptable.
4. **Kudos (« Chapeau »)** — reconnaissance en un tap sur une séance tenue d'un
   coéquipier. Faible coût de build, boucle de validation démontrée.
5. **Nudges serveur + push** — file d'événements réels (« ton coéquipier vient de te
   passer », « promotion en ligue Cadre ») consommée par la pop-up in-app **et** par
   le push existant. La contrainte de la recherche est respectée : on ne notifie que
   des événements de rang réels, jamais de relance générique.
6. **Onglet `/squad`** — quatrième entrée du `BottomNav` : ligue, club, duels,
   kudos. Sans surface dédiée, les six mécaniques ne tiennent pas sur `/home`.

### Données supplémentaires

- `league_cohorts` — `id`, `week_start`, `tier`, `created_at`.
- `league_cohort_members` — `cohort_id`, `user_id`, `points_snapshot`,
  `final_rank`, `outcome` (`promoted` | `stayed` | `relegated`).
- `duels` — `challenger_id`, `opponent_id`, `week_start`, `status`, scores.
- `kudos` — `from_user_id`, `to_user_id`, `session_log_id`, `created_at`, unique
  sur le triplet (un kudos par séance et par personne).
- `social_nudges` — `user_id`, `kind`, `payload` (JSONB), `created_at`,
  `consumed_at`, `expires_at`. File serveur, source unique des pop-ups, ce qui rend
  l'anti-spam vérifiable en base plutôt que dispersé dans le client.

### Fichiers supplémentaires

```
supabase/migrations/<ts>_gamification_leagues.sql           (nouveau)
supabase/migrations/<ts>_gamification_social.sql            (nouveau)
supabase/functions/assign-league-cohorts/index.ts           (nouveau — cron hebdo)
supabase/functions/dispatch-social-nudges/index.ts          (nouveau)
src/services/gamification/cohortMatchmaking.ts              (nouveau, pur)
src/services/gamification/nudgePriority.ts                  (nouveau, pur)
src/pages/SquadPage.tsx                                     (nouveau)
src/components/squad/LeagueBoard.tsx                        (nouveau)
src/components/squad/ClubChallengeCard.tsx                  (nouveau)
src/components/squad/DuelCard.tsx                           (nouveau)
src/components/squad/KudosButton.tsx                        (nouveau)
src/components/BottomNav.tsx                                (4ᵉ onglet)
src/App.tsx                                                 (route /squad)
src/sw.ts                                                   (payload push social)
```

### Risque propre à B

L'appariement en cohortes est la partie la plus délicate : trop large, la ligue
n'est pas gagnable et l'effet s'inverse ; trop étroite, les cohortes ne se
remplissent pas. Avec une base d'utilisateurs encore modeste, il faut une règle de
fusion de cohortes sous-remplies (Duolingo ajuste proportionnellement sa zone de
relégation quand la ligue n'est pas pleine — même principe à reprendre).

---

## 8. Risques et parades

| Risque | Gravité | Parade |
|---|---|---|
| Surentraînement induit par la course aux points | **Critique** | Score de conformité au plan, deload et repos payants, gel des gains si ACWR > 1,5, plafond sur les séances hors plan (§ 3) |
| Exposition de données de santé entre pairs | **Critique** | Opt-in séparé, liste blanche de champs exposés, RPC `SECURITY DEFINER`, U18 privé par défaut (§ 4) |
| Triche par log manuel | Élevée | Aucun point sur charge/tonnage/RPE déclarés, plafond quotidien, agrégation serveur exclusivement, détection d'activité irrégulière |
| Effet démotivant / stress accru | Élevée | Voisinage au lieu du rang absolu, appariement par volume prévu, opt-out permanent, jauge de club coopérative, formulations non comparatives |
| Saturation de pop-ups | Élevée | Budget d'interruption global et registre de priorité avec les overlays existants (§ 5) |
| Athlète seul dans son club | Moyenne | A : carte solo assumée. B : cohortes hors club |
| Séances de récup non enregistrées en base | Moyenne | Migration préalable du CHECK `session_type` (§ 1) |
| Cohortes sous-remplies | Moyenne (B) | Fusion de cohortes, zone de relégation proportionnelle |
| Divergence score client / serveur | Moyenne | Scoring dans un service pur unique, partagé et testé ; le serveur reste l'autorité |

---

## 9. Critère de done

**Commun aux deux options :**

- `npm run check` vert (lint + `tsc -b` + Vitest). Le job CI **Lint** est inclus,
  `tsc` et Vitest seuls ne suffisent pas.
- Tests unitaires du scoring : conformité, deload payant, plafond hors plan, gel
  ACWR > 1,5, tolérance de streak. Service pur, donc testable sans DOM.
- Test de composant sur chaque carte et chaque pop-up, dans le style de
  `src/components/ui/__tests__/InlineNotice.test.tsx`.
- Test d'intégration `HomePage` avec mocks de hooks, dans le style de
  `src/pages/__tests__/WeekPage.integration.test.tsx`.
- Test vérifiant qu'un athlète `private` n'apparaît **jamais** dans le retour de la
  RPC de classement, et qu'un athlète repassé en `private` en disparaît.
- Test vérifiant qu'aucun champ hors liste blanche ne sort de la RPC.
- Rendu correct en largeur mobile, sans recouvrement du `BottomNav`
  (le `BottomSheet` gère déjà les z-index 55/60).
- `PrivacyPage` mise à jour : nouvelle finalité, destinataires, durée de
  conservation.

**Spécifique A :** la carte de score et le classement club s'affichent sur `/home`,
le réglage de visibilité est opérationnel dans `/profile`, les points survivent au
rechargement et au changement d'appareil.

**Spécifique B :** en plus, une cohorte se remplit et se clôture (promotion et
relégation effectives), un duel se crée et se résout, un kudos s'envoie une seule
fois par séance, et la file `social_nudges` ne produit jamais plus d'une
interruption par ouverture.

**Mesure d'innocuité, à instrumenter dès A** — c'est la métrique qui dit si le
système nuit aux athlètes :

- part des séances **hors plan** : ne doit pas augmenter,
- incidence des ACWR > 1,5 : ne doit pas augmenter,
- taux de deload respectés : devrait augmenter.

Si l'une des deux premières monte après le lancement, le système pousse au
surentraînement et la formule de score doit être revue, indépendamment des chiffres
de rétention.

---

## 10. Recommandation (caduque — conservée pour trace)

> Cette section est celle soumise à l'arbitrage. L'option **B** a été retenue ;
> ce qui suit ne décrit donc pas ce qui a été livré. Voir § 11.

**Faire A d'abord, en câblant dès A les tables et le service de scoring de façon à
ce que B soit un ajout et non une réécriture.**

Trois raisons :

1. La formule de score est le vrai pari du produit. Elle doit être observée en
   conditions réelles — via les indicateurs d'innocuité du § 9 — avant d'être
   amplifiée par des ligues, des duels et du push. Amplifier une mauvaise formule
   avec six mécaniques, c'est industrialiser l'erreur.
2. Les cohortes de B demandent un volume d'utilisateurs actifs suffisant pour se
   remplir. Le classement club de A fonctionne dès le premier club actif.
3. La partie irréversible est le **consentement**. Une fois les athlètes opt-in sur
   un périmètre club, étendre aux cohortes est une extension de finalité qui
   demandera un nouveau consentement de toute façon. Autant poser proprement le
   premier périmètre.

Le seul élément de B qui mériterait d'être avancé dans A est le **kudos** : coût de
build faible, boucle de validation documentée, aucun effet compétitif négatif. À
arbitrer.

---

## 11. Ce qui a été livré (option B)

### Barème et services purs

Tout le calcul vit dans `src/services/gamification/`, sans dépendance React ni DOM,
et est couvert par Vitest. Les Edge Functions importent ces modules au lieu de
redéfinir la formule : c'est la seule façon d'éviter que le score affiché diverge du
score écrit.

| Module | Rôle |
| --- | --- |
| `scoreConstants.ts` | Barème, plafonds, seuils d'XP, règles de ligue et de nudge |
| `computeWeeklyScore.ts` | Score hebdomadaire — conformité, repos prescrit, gel ACWR |
| `deriveWeeklyScoreInput.ts` | Traduit plan + séances + matchs en entrée de score |
| `levels.ts` | Palier depuis l'XP cumulée, progression, promotion / relégation |
| `weekStreak.ts` | Série hebdomadaire et tolérance d'une semaine ratée |
| `cohortMatchmaking.ts` | Constitution des cohortes, seuils proportionnels |
| `nudgePriority.ts` | Sélection d'au plus un nudge, quotas d'interruption |
| `nudgeCopy.ts` / `nudgeFromRow.ts` | Mise en mots d'un fait constaté |
| `socialExposure.ts` | Règle de consentement, miroir TS de la fonction SQL |
| `badgeDefinitions.ts` | Jalons de rigueur, aucun indexé sur le volume |
| `rankLeaderboard.ts` | Rangs avec ex æquo partagés |
| `buildRecomputePayload.ts` | Charge utile de recalcul + signature de déduplication |
| `scoreBreakdownRows.ts` | Détail des points, poste par poste |

### Base de données

Quatre migrations : `20260916100000` (types de séance récupération),
`20260916110000` (socle : profil, scores, badges, `social_visibility`, classement
club, pouls du club), `20260916120000` (cohortes, duels, kudos, file de nudges),
`20260916130000` (crons), `20260916140000` (attribution des kudos).

Aucune policy RLS n'ouvre la lecture croisée. Les six RPC de lecture sont
`SECURITY DEFINER` et appliquent `gamification_is_exposable` plus une liste blanche
de colonnes ; les tables de score n'ont aucune policy d'écriture pour un
utilisateur authentifié.

### Edge Functions

- `recompute-gamification` — recalcule la semaine après une séance, recalcule l'XP
  depuis la table (jamais par incrément, pour qu'un recalcul ne double pas l'XP),
  persiste les badges nouvellement débloqués et émet le nudge de passage de palier.
- `assign-league-cohorts` — cron hebdomadaire : clôture, promotions, relégations,
  puis constitution des cohortes de la semaine suivante.
- `dispatch-social-nudges` — cron quotidien : ne produit que des nudges adossés à
  un événement constaté, et applique le quota en base plutôt que dans le client.

### Client

- Hooks : `useGamification`, `useSquad`, `useSocialNudges`.
- Accueil : `RigorScoreCard` (total, palier, détail par poste, explication du gel
  ACWR) et `SocialNudgeHost` (au plus une interruption, jamais pendant une séance
  ni par-dessus un overlay bloquant).
- Page `/squad` : ligue hebdomadaire, défi collectif de club, classement club,
  duels, jalons de rigueur, plus l'écran d'opt-in quand l'athlète est `private`.
- `SocialVisibilityPicker`, monté sur `/squad` et sur `/profile#social`.

### Écarts assumés par rapport au plan

- **Pas de push pour les nudges sociaux.** La file et l'affichage in-app existent,
  mais rien n'est poussé hors de l'app. Le § 5 fixe un budget d'interruption ; y
  ajouter du push avant d'avoir observé la réaction aux nudges in-app revient à
  parier sur le canal le plus intrusif en premier. `sw.ts` est inchangé.
- **`BadgesStrip` de l'accueil inchangé.** Ses jalons existants sont indexés sur le
  volume (« 10 séances », « 25 h cumulées »), ce qui contredit le § 3. Les jalons de
  conformité sont livrés à côté, sur `/squad`, via `RigorBadgesStrip`. Harmoniser les
  deux demande un arbitrage produit : remplacer des badges déjà acquis par des
  athlètes n'est pas une décision technique.
- **Kudos sans identifiant de séance côté client.** La RPC `give_kudos` choisit
  elle-même la séance saluée, pour ne jamais exposer d'identifiant de `session_logs`
  d'un coéquipier.

### Reste à faire avant mise en production

Voir la checklist opérationnelle :
[`gamification-prod-launch.md`](./gamification-prod-launch.md).

Résumé :

- [x] Appliquer les migrations et déployer les trois Edge Functions.
- [ ] Vérifier que `CRON_SHARED_SECRET` est configuré pour les deux crons.
- [ ] Soft launch + observer les indicateurs d'innocuité du § 9. La formule
  est le pari du produit : si la part de semaines en ACWR > 1,3 monte après
  le lancement, c'est le barème qu'il faut revoir, pas l'habillage.
- [ ] Assets graphiste (second temps) :
  [`gamification-illustration-brief.md`](./gamification-illustration-brief.md).

---

## Sources

- Trophy — *Strava gamification case study*, *Apps That Use Streaks (2026)*,
  *How Strava Uses Segmented Leaderboards*
- Duolingo — *How Duolingo Leaderboards and Leagues Work* ; Deconstructor of Fun —
  *Duolingo Leagues*
- Guul Games — *Gamification in fitness apps* ; Mindster — *Fixing the 14-Day Churn
  Problem*
- *The dark side of gamification: an experimental study on digital fitness apps*
  (Kybernetes, 2024) — doi:10.1108/k-03-2024-0792
- *Ethics of Gamification in Health and Fitness-Tracking* (IJERPH 18(21):11052)
- *A Muscle Load Feedback Application for Strength Training* (Sports 11(9):170)
- CIO/IOC — *How much is too much? Training load and risk of injury, part 1* (2016)
- Gabbett TJ (2016) *The training-injury prevention paradox*, BJSM 50(5):273-280
- CNIL — données de santé des sportifs, applications mobiles en santé, sport
  amateur ; CEPD — lignes directrices sur la pseudonymisation
- Interne — `src/knowledge/load-budgeting.md`, `PROJECT_RULES.md`, `AGENTS.md`
