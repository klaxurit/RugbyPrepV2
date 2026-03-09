# RugbyForge — Statut Projet

**Date de référence :** 2026-03-09

## Résumé exécutif

RugbyForge est au stade **produit fonctionnel déployé**, pas encore au stade
**release pleinement industrialisée**.

Le cœur métier est solide :

- moteur de programme déterministe
- backend premium/billing opérationnel
- app principale déployée sur Cloudflare Pages
- build, lint et tests actuels au vert

Les prochains risques sont surtout des risques de **finition produit**, de
**cohérence documentaire**, de **couverture de tests** et de **distribution**.

## État actuel par domaine

| Domaine | État | Notes |
|---|---|---|
| App principale | En production | Déployée sur Cloudflare Pages |
| Landing page | À faire | Doit renvoyer vers l’app et porter l’acquisition |
| Auth / profil | En place | Supabase Auth + profil complet |
| Moteur de programme | En place | `buildWeekProgram()` comme entrée canonique |
| Réhab / ACWR / mobilité | En place | Cas critiques déjà couverts |
| Stripe / premium | En place | Checkout, webhook, sync entitlements validés |
| Free vs premium | Partiellement produitisé | Gating actif sur certaines zones UI, d’autres entitlements restent “réservés” |
| Push subscriptions | En place | Écriture sécurisée via Edge Functions |
| Scheduler rappels | Partiel | Queue/log OK, transport push réel non branché |
| CI/CD qualité | Absent | Pas de pipeline lint/test/build sur PR |
| E2E | Absent | Pas de scénario automatisé bout en bout |
| Perf bundle | À améliorer | Bundle principal encore lourd |

## Vérifications techniques confirmées

Résultats locaux sur l’état courant du repo :

- `npm run lint` : OK
- `npm run test` : OK (`6/6`)
- `npm run build` : OK

Signaux à garder en mémoire :

- warning CSS minify autour de `"[file:line]"` à investiguer
- bundle principal ~`1.68 MB` minifié (~`470 kB` gzip)

## Cohérence actuelle du moteur de programme

### Points validés

- fallback legacy sans `trainingLevel` vers `starter`
- validité `REHAB_UPPER_P1`
- adaptation `ACWR danger` vers mobilité
- adaptation `ACWR critical` vers réduction à 1 séance
- variation de blocs entre phases
- cohérence matériel bloc/exercice sur la bibliothèque actuelle

### Ce que cela ne couvre pas encore

- pas de matrice exhaustive niveau × phase × blessures × matériel
- pas de snapshots de génération golden master
- pas d’observabilité centralisée des warnings de génération en prod
- pas d’e2e couvrant le parcours joueur complet

## KB scientifique — état actuel

### Couverture forte déjà en place

- périodisation
- méthodes de force / puissance
- récupération
- nutrition
- prévention des blessures
- systèmes énergétiques
- tests physiques
- monitoring équipe
- budgets de charge
- red flags médicaux
- retour au jeu
- double semaine de match
- off-season

### Gaps à forte valeur

1. Document dédié “rugby féminin”
2. Document dédié “U18 / croissance / maturation”
3. Retour au jeu longue durée type LCA
4. Thermorégulation chaleur / humidité
5. Fatigue de déplacement / congestion calendrier
6. Suivi long terme post-commotion
7. Index de retrieval KB par use-case IA
8. `field-notes.md` pour ce qui est validé terrain mais pas encore formalisé

## Écarts documentaires connus

- Certaines docs historiques utilisaient encore un cycle simplifié FORCE → POWER.
- Le cycle réel à utiliser est :
  - `H1–H4` hypertrophie
  - `W1–W4` force
  - `W5–W8` puissance
  - `DELOAD`
- `docs/ETAT_DES_LIEUX_V1.md` mentionne un quota chat free `5 msg/jour` qui n’est
  pas confirmé par le code actuel.

## Milestones cruciaux

### M1 — Base documentaire et BMAD propre

- indexer `docs`
- fiabiliser les docs canoniques
- générer un `project-context.md` BMAD propre pour les prochains agents

### M2 — Acquisition

- déployer la landing page
- aligner le copywriting avec le vrai produit free/premium
- brancher les analytics de conversion

### M3 — Qualité moteur

- étendre les tests du moteur de génération
- ajouter des scénarios brownfield de non-régression
- introduire au moins un niveau de trace sur les warnings de génération

### M4 — Notifications réellement productisées

- garder le scheduler actuel
- brancher le transport push réel
- valider les templates selon le niveau de charge et les entitlements

### M5 — Industrialisation

- CI sur lint + tests + build
- premiers E2E critiques
- durcissement perf bundle / code-splitting

## Décision recommandée maintenant

Priorité court terme :

1. déployer la landing
2. fiabiliser la documentation canonique
3. étendre les tests moteur et premium
4. brancher le push delivery réel

Ce séquencement est cohérent avec la situation actuelle : le produit cœur existe,
mais il lui manque encore les couches d’acquisition, de gouvernance et
d’industrialisation qui séparent une bonne démo d’un produit durable.
