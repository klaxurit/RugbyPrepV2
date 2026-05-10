# V1.1 — Wording / copy audit (WS5)

**Status** : Audit produit en parallèle WS10 (pack Quality V1.1).
**Trivial fixes appliqués direct** dans le commit qui livre ce doc. Les **propositions de tone** ci-dessous attendent ta validation avant apply.

## ✅ Trivial fixes shipped (no decision needed)

| Fichier | Avant | Après |
|---|---|---|
| `ErrorBoundary.tsx:33` | "Une erreur est survenue" | "Quelque chose a coincé" |
| `ErrorBoundary.tsx:36` | "L'application a rencontré un problème. Recharge la page pour continuer." | "Recharge la page pour repartir. Si le problème persiste, écris-nous à bonjour@rugbyforge.fr." |
| `ProfilePage.tsx:999` | "Chargement..." | "Préparation…" |
| `ChatPage.tsx:369` | "Chargement..." | "Préparation…" |
| `LandingPage.tsx:273` (PREMIUM_FEATURES) | "Suggestions de charge personnalisées" | "Suggestions de charge calibrées sur tes derniers logs" |

## 🟡 Propositions tone — décision user

### #1 — Hero LandingPage (CRITIQUE conversion)

**Actuel** :
```
Ta prépa physique, scientifiquement optimisée
Un programme complet dès l'inscription. Le Premium débloque le suivi des
charges, l'historique et les courbes de progression.
```

**Critique** : "scientifiquement optimisée" reste abstrait pour un joueur amateur. Le sub-head saute direct au feature-listing Premium au lieu d'un bénéfice émotionnel.

**Proposition A — Direct & technique** :
```
Ta prépa rugby, structurée semaine après semaine
Programme calibré sur ta saison club, ton matériel et ton temps. Force,
puissance, récupération — ce qu'un staff te donnerait, sans coach.
```

**Proposition B — Bénéfice avant feature** :
```
Forge ton physique pour le rugby
Programme hebdo qui s'adapte à ton calendrier club, ton niveau et ton
matériel. Gratuit pour démarrer, illimité dès la première séance.
```

**Proposition C — Marketing soft** :
```
La prépa physique rugby pensée pour les amateurs
Un programme complet dès l'inscription. Adapté à ton matériel, à ta saison
club et à ton emploi du temps. Sans BS marketing, juste ce qui marche.
```

### #2 — CTA pricing cards

**Actuel** : "Passer en Premium" + "Devenir Founding"

**Critique** : "Passer en" est mou. "Devenir" est meilleur (identité). Cohérence imparfaite.

**Proposition A — Direct** :
- Premium → "Passer en Premium" → **"Activer Premium"** (verbe action concret)
- Founding → "Devenir Founding" (garde, c'est bien)

**Proposition B — Identité** :
- Premium → "Devenir Premium"
- Founding → "Devenir Founding"

### #3 — FAQ — registres

**Actuel sample** :
> Q: "À qui s'adresse RugbyForge ?"
> A: "Aux joueurs et staffs qui veulent structurer leur prépa physique rugby avec des repères clairs sur la charge, la musculation, les tests et la récupération."

**Critique** : OK. Direct, concret, pas mou. Garder.

### #4 — Onboarding step headers (à auditer si on continue)

Pas auditée en détail. Les headers étapes onboarding devraient être courts et concrets (action + bénéfice). À évaluer page par page si on poursuit V1.1.

### #5 — Empty states (à auditer si on continue)

Cibles probables :
- HistoryPage vide (premier signup)
- ProgressPage Tests vide
- WeekPage sans match
- Calendrier vide

Pour V1.1 propre : créer 4-5 empty states "personnalisés" avec un CTA action-oriented. Pas critique pour V1 release (les pages affichent du contenu de défaut acceptable).

## 📋 Cibles V1.1 plus large (hors scope ce sprint)

- Audit complet copies onboarding step-by-step
- Empty states refactor avec illustrations + CTAs
- Voice/tone guidelines doc dans `docs/voice-and-tone.md`
- Fonts/typo audit (cohérence visuelle des textes)

## Anchors décision user

Pour avancer **maintenant** sur les propositions #1 + #2 :

| Question | Options |
|---|---|
| Hero (#1) | A / B / C / autre / skip |
| Pricing CTA (#2) | A / B / skip |

Si tu valides, je commit le changement direct dans la foulée. Sinon, on close P1 ici et on push le reste en V1.1 propre.
