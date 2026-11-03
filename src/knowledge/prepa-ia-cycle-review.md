# Revue cycle annuel — prépa IA

> Méthode : `prepa-ia.md`. Pas de rewrite mother sessions sans choix A/B.
> **A** = statut quo / micro-fix. **B** = ambitieux dans l’enveloppe.
> **C** = change une décision produit (à valider).

---

## Première passe (2026-08) — livrée

Constat : cycle bien orienté rugby. Vague 3 runtime **livrée** (Speed fallback,
hyp bump, cou, finisher off, proxy club, in-season hors match, deload −40 %).

Voir historique § « Propositions » archivées dans git / roadmap Vague 3.

---

## Deuxième passe (2026-11) — post accents poste + theme weeks

### Constat

| Zone | Verdict |
|------|---------|
| Périodisation off / pré / in | ✅ Solide |
| Rails J-2, Nordic, volume in-season | ✅ |
| Accents poste 7 packs BW + 35 Upper/Lower salle | ✅ Overlay additif |
| Theme-week W1–W3 + Focus A/B | ✅ Variété finisher sans rewrite |
| Affinage PROP sled vs BACK_ROW farmer/drag | ✅ |
| Vague 3 runtime (bumps / cou / finisher) | ✅ |
| Ressenti « ludique » séance (Weakley feedback) | ⚠️ Encore faible vs scores app |
| Full / Primer / Recovery | ⚠️ Pas d’accent poste (choix scope) |
| Catalogue BW (variété mouvement) | ⚠️ Méthode varie plus que les exos |
| Doc `bodyweight-program-review.md` | ⚠️ En retard (encore FR/BT texte) |
| Playoffs `FULL_BW_PLAYOFF_ACTIVATION_V1` | ⚠️ Orphelin hors map |

### Sous / surdosage (par phase)

| Phase | Lecture |
|-------|---------|
| Recovery / Transition | OK — ne pas densifier |
| Hypertrophie off | OK runtime (+1 primes Performance) ; BW déjà allégé V1.1 |
| Force-Pont | OK — ne pas 2e contraste tant que logs % non prouvés |
| Pré-saison | OK |
| In-season match | OK light / J-2 |
| In-season hors match | OK bump force 3→4 |
| Deload W4 | OK truncate −40 % |

**Risque ennui** : plus dans la **répétition des patterns BW** et l’absence de
feedback set-à-set que dans un sous-dosage Force-Pont.

---

## Propositions (2ᵉ passe) — à trancher

| # | Sujet | Problème | A | B | C | Rail ? |
|---|-------|----------|---|---|---|--------|
| 1 | Feedback Weakley | Peu de « bats ton dernier set » en séance | Rien | Toast / cue post-série sur 1–2 primes (PR ou +1 rep/kg vs last) | VBT barre obligatoire | Non pour B |
| 2 | Accent Full / Primer | Finisher poste absent sur 3ᵉ séance | Rien (scope actuel) | Accent **allégé** 1–2 slots (nuque FR / COD BT) sur Full hors match ; Primer = skip | Accent complet partout | Primer dense = non |
| 3 | Sync doc revue BW | `bodyweight-program-review` obsolète | Patch doc packs 7 + salle | Idem + checklist coach §6 dans KB produit | — | Non |
| 4 | Variété BW catalogue | Mêmes patterns Hyp↔FB | Coaching notes rotation | 1 swap structurel / phase (ex. Upper FB contraste pull si budget neural OK) — **edit mother** | Réécrire corpus BW | Edit = validation mère |
| 5 | Playoffs BW | Orphelin activation | Laisser hors map | Brancher map playoffs → activation dédiée | Semaine playoffs inventée | Calendrier réel only |
| 6 | Cues transfert UI | Transfert rugby surtout en collapsible | Rien | 1 ligne « pourquoi ce bloc » visible sur blocs durs | Overlay coaching permanent | Non |

**Choix humain 2026-11-03** : **tout B** (ordre 1→3→6→5→2→4).

| # | Statut |
|---|--------|
| B1 Feedback Weakley | **Livré** — toasts tous users + vs série préc. |
| B3 Doc revue BW | **Livré** |
| B6 Cue transfert UI | **Livré** — `pickBlockTransferCue` sur ToursBlock |
| B5 Playoffs BW | **Livré** — `FULL_BW_PLAYOFF_ACTIVATION_V1` match-week BW |
| B2 Accent Full | **Livré** — ≤2 slots, hors match / Primer / Recovery |
| B4 Upper FB BW contraste pull | **Livré** — B2 rowing explosif (couper si CNS) |

## Suite chantier

**Gamification** : malus / relégation inactivité + pause **« Blessé »** — **livré**
(2 sem. à 0 séance → relég forcée ; RPC pause max 28 j. ; UI `/squad`).

*2026-11-03 — 2ᵉ revue prépa IA*
