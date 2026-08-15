# Roadmap prépa IA rugby — 3 vagues

> Objectif : l’app devient **plus rugby**, pas plus contrainte.
> Interdit : rewrite mother sessions avant validation d’une ligne B.
> Interdit : empiler des études dans un cluster déjà canonique.

## Vague 1 — Bibliothèque (**livrée**)

| Ajout | Fichier | Rôle |
|---|---|---|
| Charge de contact | `contact-load.md` | World Rugby → proxy amateur |
| Cou | `neck-training.md` | BJSM 2025 = canon |
| Accélération | `sprint-acceleration.md` | Slot Speed, pas HIIT |
| Index retrieval | `retrieval-index.md` | 1–3 fichiers par situation |

Aucun seuil runtime nouveau. Les audits existants ne bougent pas.

## Vague 2 — Copy produit (**livrée**, sans toucher aux séances)

| Hook | Quand | Fichier |
|---|---|---|
| Tip contact | In-season **semaine de match** (filler, max 3 détails) | `buildExplanation` |
| Tip cou | **Off-season** seulement (Hu ne s’affiche pas) | `buildExplanation` |

Priorité fillers : détails métier → warnings → contact (match) → Hu (pré/in) → cou (off).
Plafond 3 lignes inchangé. Hu hors match week **inchangé**.

## Vague 3 — Séances (plus tard, une ligne B à la fois)

Voir `prepa-ia-cycle-review.md`. Ordre si on continue :

1. Speed salle/maison : fallback sans piste (`applyGymSpeedFallback`) — **livré**
2. Hypertrophie off : +1 série sur 2 primes (`applyHypertrophyPrimeBump`) — **livré**
3. Mini-bloc cou Upper (protocole `neck-training.md`)
4. Proxy club déclaré (léger / normal / dur) — UI, pas GPS

Chaque item = A/B, tests auto, pas de merge si un audit volume/repos casse.

## Ce qui ne se fera pas

- 4e jour salle, GPS, VBT barre obligatoire, 15 min contact comme rail amateur
- Nouvelle méta volume / NHE / contrastes

*2026-08-15*
