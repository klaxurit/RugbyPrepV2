# Gamification — mise en prod « clean »

Checklist opérationnelle pour lancer la feature compétition (option B) comme
une **vraie surface produit**, pas un prototype. Complète
[`gamification-competition-plan.md`](./gamification-competition-plan.md).
Brief assets graphiste :
[`gamification-illustration-brief.md`](./gamification-illustration-brief.md).

**Statut code (2026-09-22)** : backend Supabase déjà en prod ; front sur
`cursor/gamification-competition-plan-9bd7` (à merger + déployer). Soft launch
recommandé avant annonce marketing.

---

## 1. Ce que « clean » veut dire ici

| Critère | Oui | Non |
|---|---|---|
| Opt-in clair, privacy lisible | Visibilité private par défaut | Classement forcé |
| Feedback immédiat compréhensible | Score + pourquoi (breakdown) | XP mystérieux |
| Arène atteignable | Club / cohorte, pas monde entier | Classement global |
| Récompenses alignées produit | Conformité au plan | Volume / tonnage |
| Visuel crédible | SVG / pictos brandés | Émojis runtime (sauf interim) |
| Mesure d’innocuité | ACWR / hors-plan / deload | Vanité rétention seule |

---

## 2. Benchmarks (ce qu’on reprend / ce qu’on refuse)

### Duolingo — ligues hebdo

**Reprendre**
- Reset hebdomadaire + promo / relégation (déjà câblé : cohortes lundi).
- Matchmaking par niveau d’engagement, pas par « force » absolue.
- Opt-out via profil privé.
- Countdown / clarté « la semaine se joue jusqu’à… ».

**Refuser**
- Escalade de pression (Diamond Tournament, spam notifs classement).
- Récompense du volume d’actions (XP = leçons enchaînées). Chez nous XP = conformité.

**Écart RugbyForge** : 5 paliers rugby (Réserve → Élite) au lieu de 10 métaux ;
vocabulaire vestiaire, pas gemmes.

### Strava — compétition contextualisée

**Reprendre**
- Arènes locales (segment / club) plutôt qu’un classement mondial.
- Pistes parallèles : vitesse **et** régularité (Local Legend). Chez nous :
  score conformité + streak semaines + badges deload.
- Kudos légers (déjà livré, 1× / séance côté serveur).

**Refuser**
- Couronnes « plus fort / plus rapide » comme unique signal social.

### Fitbit / Apple Fitness+ (récompense)

**Reprendre** : badges avec **identité visuelle distincte** par famille
(pas une médaille générique × 12).

**Refuser** : badges « 10 000 pas » équivalents volume — déjà exclu par le plan.

### Synthèse produit

Notre différenciation est le **barème anti-surentraînement**. Un lancement
clean le met en avant dans la copy (intro sheet, empty states, Privacy) et
dans les mètres d’innocuité — pas dans le nombre de divisions.

---

## 3. Phases de mise en prod

### Phase 0 — Gate technique (bloquant merge → prod front)

- [x] Migrations `gamification_*` + `leaderboard_club_form` appliquées
- [x] Edge Functions ACTIVE : `recompute-gamification`, `assign-league-cohorts`,
      `dispatch-social-nudges`
- [ ] Confirmer secret `CRON_SHARED_SECRET` sur les 2 crons (Dashboard Supabase)
- [ ] `npm run check` vert sur la branche à merger
- [ ] Privacy / CGU : finalité ranking + durée conservation (si pas déjà à jour)
- [ ] Smoke manuel post-deploy (section 5)

**Sécurité (durcissement recommandé, non bloquant soft launch)**  
Les RPC `get_*` / `give_kudos` refusent sans `auth.uid()`, mais l’advisor
Supabase signale `EXECUTE` ouvert à `anon`. Prévoir une migration
`REVOKE EXECUTE … FROM anon` sur les RPC gamification uniquement.

### Phase 1 — Soft launch (1–2 semaines, pas d’annonce)

Objectif : valider boucle réelle avec un petit pool (toi + beta / club test).

| Action | Pourquoi |
|---|---|
| Merge + deploy front | Surface Accueil / Groupe live |
| 3–5 comptes opt-in `club` ou `cohort` dans le même club | Éviter le board solo « fantôme » |
| Forcer 1 recompute après séance réelle | Vérifier XP / points / badges |
| Lundi suivant : vérifier assign-league-cohorts | Cohorte non vide |
| Instrumenter §9 (PostHog ou SQL) | Innocuité avant marketing |

**Copy soft launch à surveiller**
- Empty club : message déjà honnête (« personne d’autre… ») — OK.
- Intro sheet : 1ʳᵉ visite seulement — ne pas re-pousser.
- Ne pas promettre « ligue pleine » tant que < 5 opt-in.

### Phase 2 — Polish produit (avant annonce)

Sans attendre le graphiste, livrer le ressenti « feature finie » :

| Priorité | Travail | Effort |
|---|---|---|
| P0 | Remplacer 🔥/💤 par 2 pictos SVG brand (`Icon` ou assets) | **Fait** (`form-hot` / `form-dormant`) |
| P0 | Mapping badgeId → picto distinct (même Lucide différencié en interim) | **Fait** (4 familles `badge-*`) |
| P1 | Empty states illustrés (solo / pending lundi / private) — placeholder SVG simple | M |
| P1 | Countdown « fin de ligue » (jours restants jusqu’au lundi) | S |
| P1 | Harmoniser Home `BadgesStrip` (volume) vs `RigorBadgesStrip` — arbitrage produit | M |
| P2 | Crests de paliers ligue (Réserve…Élite) | attendre brief graphiste |
| P2 | Push nudges sociaux | **non** avant observation in-app |

### Phase 3 — Annonce / store

- Capture Accueil (carte Rigueur) + Groupe (board avec ≥ 3 athlètes).
- Play listing : 1 screenshot « Groupe » si la feature est mise en avant.
- Assets graphiste phase 1 du brief (form cues + badges familles).

---

## 4. Instrumentation d’innocuité (obligatoire)

Dès le soft launch, suivre chaque semaine (SQL ou dashboard) :

1. **% séances hors plan** — ne doit pas ↑ vs baseline 4 semaines avant.
2. **Incidence ACWR > 1,5** (et alerte secondaire > 1,3) — ne doit pas ↑.
3. **% semaines deload respectées** — devrait ↑ ou rester stable.

Seuil d’arrêt soft : si (1) ou (2) monte de façon nette → geler annonce,
revoir barème, pas l’UI.

Complément engagement (non bloquant) :
- taux opt-in social (`private` → `club`/`cohort`),
- % utilisateurs avec ≥ 1 kudos donné / reçu,
- retention D7 des opt-in vs private.

---

## 5. Smoke test post-deploy (15 min)

1. Compte **private** : Accueil montre score ; Groupe = opt-in, pas de board.
2. Passer en **club** : board club (soi ± coéquipiers) ; logos ; pas de données santé.
3. Passer en **cohort** : message pending ou board si lundi déjà passé.
4. Finir une séance : points / XP bougent après recompute.
5. Nav Accueil ↔ Groupe ↔ Semaine : BottomNav ne clignote pas.
6. Premier chargement route lazy : logo/skeleton, pas page à moitié peinte.
7. Intro sheet : une fois ; dismiss persisté.
8. Privacy : mention visibilité sociale présente.

---

## 6. Critère « feature propre et fonctionnelle »

On annonce seulement si :

- [ ] Soft launch ≥ 7 jours sans alerte innocuité
- [ ] ≥ 1 club avec ≥ 3 athlètes visibles (sinon copy « early » assumée)
- [ ] Form cues sans emoji runtime
- [ ] Au moins 3 familles de badges différenciées visuellement
- [ ] Privacy à jour
- [ ] Crons vérifiés (logs assign + dispatch la semaine)

Le pack illustrations graphiste (brief) n’est **pas** bloquant pour annoncer
si Phase 2 P0 est livrée en SVG maison ; il élève le niveau « pro vestiaire ».

---

## 7. Ordre de travail recommandé cette semaine

1. Merger la branche + deploy front.
2. Vérifier `CRON_SHARED_SECRET` + 1 smoke (section 5).
3. Recruter 2–3 beta du même club en opt-in.
4. Brancher métriques §9 (même un SQL hebdo manuel).
5. Remplacer 🔥/💤 + différencier badges (interim Lucide / SVG).
6. Lancer le brief graphiste en parallèle (doc dédié) — livraison assets
   en « second temps », sans bloquer le soft launch.
