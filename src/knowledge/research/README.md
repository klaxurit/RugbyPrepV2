# Research index — enrichissements KB (feature/kb-evidence-p0)

> Vague 1 : documentation & contexte IA uniquement.  
> **Aucun seuil runtime** (`weeklyLoad`, ACWR, mother sessions, `loadSuggestion`) n’est modifié dans cette vague.

## Statut

| Vague | Contenu | Runtime | Statut |
|-------|---------|---------|--------|
| 1 | Synthèses KB + cet index | Non | Fait |
| 2 | Israetel · Severo · Weakley · Hu tip poste | Oui | **Fait (tests auto)** |

### Runtime Vague 2 (vérifié)

| Étude | Hook | Fichiers |
|-------|------|----------|
| Israetel | Notice décharge + explanation + soft-floor truncate ≤2 blocs | `programSurfaces`, `buildExplanation`, `truncateSessionBlocks` |
| Severo | Prescription Nordic selon meso week (match FR Nordique) | `applyProgressiveNordic` → `prepareSessionForRender` |
| Weakley | Chip « À battre », toast vs last, insight fin | `SessionDetailPage`, `selectSessionInsight`, `formatLivePRToast` |
| Hu 2024 | Tip poste pré/in-season (filler détail coach) | `buildExplanation` `huPositionWorkloadTip` |

## Études intégrées (Vague 1)

| Prio | Étude | Fichiers KB touchés | Bénéfice | Runtime futur (Vague 2) |
|------|-------|---------------------|----------|-------------------------|
| P0 | Pelland et al. 2025 | `strength-methods.md`, `load-budgeting.md` | Cohérence volume | Recalibrer audits MEV/fractional si écart |
| P0 | Bauer et al. 2019 | `strength-methods.md` §4.2 | Cohérence contraste | Confirmer budget neural + repos contraste |
| P0 | Hu et al. 2024 JSCR | `periodization.md`, `team-monitoring.md` | Pertinence pré-saison | Tips microcycle force/endurance/vitesse |
| P0 | Hu et al. 2024 PLOS One | `periodization.md`, `athletic-testing.md` | Pertinence poste | Affiner messages avants/arrières |
| P1 | Chavarro-Nieto et al. 2021 | `injury-prevention.md` §5.2 | Pertinence ischios | Copy prévention rugby |
| P1 | Severo-Silveira et al. 2021 | `injury-prevention.md` §5.2 | Cohérence NHE | Progression Nordic mother sessions |
| P1 | van Dyk et al. 2019 | `injury-prevention.md` §5.2 | Pertinence | Ancre −51 % UX / landing |
| P1 | Weakley et al. 2019/2020 | `strength-methods.md` §feedback | Ludique | Prompts / encouragements séance |
| P2 | Robinson et al. 2024 | `strength-methods.md` (RER) | Cohérence | Formaliser plafonds déjà partiels en code |
| P2 | Freitas et al. 2017 | `strength-methods.md` §4.2 | Pertinence | Attentes contrastes amateurs |

## Liens DOI

- Pelland 2025 : https://doi.org/10.1007/s40279-025-02344-w
- Bauer 2019 : https://doi.org/10.1016/j.jsams.2019.01.006
- Hu JSCR 2024 : https://doi.org/10.1519/JSC.0000000000004607 — PMC : https://pmc.ncbi.nlm.nih.gov/articles/PMC10712997/
- Hu PLOS 2024 : https://doi.org/10.1371/journal.pone.0288345
- Chavarro-Nieto 2021 : https://doi.org/10.1080/00913847.2021.1992601
- Severo-Silveira 2021 : https://doi.org/10.1519/JSC.0000000000002849
- van Dyk 2019 : https://doi.org/10.1136/bjsports-2018-100045
- Weakley 2019 feedback : https://doi.org/10.1123/ijspp.2018-0523
- Weakley 2020 encouragement : https://doi.org/10.1519/JSC.0000000000002887
- Robinson 2024 : https://doi.org/10.1007/s40279-024-02069-2
- Freitas 2017 : https://doi.org/10.1371/journal.pone.0180223

## Checklist relecture humaine (avant Vague 2)

- [ ] Stats citées (ex. −51 % NHE) vérifiées sur PubMed / full text
- [ ] Pas de contradiction avec `evidence-register.md` actuel
- [ ] Décider si deload −40–50 % Israetel reste la cible vs mother sessions −30 %
- [ ] Décider progression NHE product (Severo) vs protocole UEFA actuel
- [ ] Spec UX feedback Weakley (toasts / PR / encouragement IA)

*Branche : `feature/kb-evidence-p0` · créé 2026-08-10*
