# Research index — enrichissements KB (feature/kb-evidence-p0)

> Vague 1 : documentation & contexte IA uniquement.  
> **Aucun seuil runtime** (`weeklyLoad`, ACWR, mother sessions, `loadSuggestion`) n’est modifié dans cette vague.

## Statut

| Vague | Contenu | Runtime | Statut |
|-------|---------|---------|--------|
| 1 | Synthèses KB + cet index | Non | Fait |
| 2 | Israetel · Severo · Weakley · Hu · Robinson | Oui | **Fait (tests auto)** |
| 2A | Contact (match week) · Cou (off-season) | Copy only | **Fait (tests auto)** |
| 3A | Speed salle/maison sans piste | Runtime fallback | **Fait (tests auto)** |
| 3B | Hyp off +1 série / 2 primes | Runtime 4→5 | **Fait (tests auto)** |
| 3C | Deload −40 % vol / intensité = | Truncate intelligent | **Fait (tests auto)** |
| 3D | Mini-bloc cou Upper | Runtime optionnel | **Fait (tests auto)** |

### Runtime Vague 2 (vérifié)

| Étude | Hook | Fichiers |
|-------|------|----------|
| Israetel | Notice décharge + explanation + soft-floor truncate ≤2 blocs | `programSurfaces`, `buildExplanation`, `truncateSessionBlocks` |
| Severo | Prescription Nordic selon meso week (match FR Nordique) | `applyProgressiveNordic` → `prepareSessionForRender` |
| Weakley | Chip « À battre », toast vs last, insight fin | `SessionDetailPage`, `selectSessionInsight`, `formatLivePRToast` |
| Hu 2024 | Tip poste pré/in-season (filler détail coach) | `buildExplanation` `huPositionWorkloadTip` |
| Robinson 2024 | Justifications RER selon cycle + insight fin | `loadSuggestion` `effortZoneRerLabel`, `selectSessionInsight` |
| World Rugby contact | Tip semaine de match (filler, **avant** Hu) | `buildExplanation` `contactLoadTip` |
| BJSM 2025 cou | Tip off-season seulement | `buildExplanation` `neckTrainingTip` |
| Speed salle/maison | Fallback accels sans piste | `prepareSessionForRender` `applyGymSpeedFallback` |
| Hyp off primes | +1 série 4→5 hors décharge | `prepareSessionForRender` `applyHypertrophyPrimeBump` |
| Cou Upper | Mini-bloc isométrique optionnel | `prepareSessionForRender` `applyNeckIsometricBlock` |

## Études intégrées (Vague 1)

Un **rôle par cluster** — détail : `../evidence-clusters.md`. Pas de doublon de plafond.

| Prio | Étude | Cluster / rôle | Runtime |
|------|-------|----------------|---------|
| P0 | Pelland et al. 2025 | Volume — **canon** dose-réponse | Audits fractional (existant) |
| P0 | Bauer et al. 2019 | Contrastes — **canon** méta | Budget neural existant |
| P0 | Hu et al. 2024 JSCR | Période — microcycle | Tip `buildExplanation` |
| P0 | Hu et al. 2024 PLOS | Poste — complémentaire Hu JSCR | Tip poste |
| P1 | van der Horst 2015 | NHE — **canon** effet | Mother NHE |
| P1 | Severo-Silveira 2021 | NHE — progressif **runtime** | `applyProgressiveNordic` |
| P1 | van Dyk 2019 | NHE — **com’** −51 % (pas un 2e protocole) | Copy seulement |
| P1 | Chavarro-Nieto 2021 | NHE — facteurs rugby | Contexte |
| P1 | Weakley 2019/2020 | Feedback — un cluster | Chip / toast / insight |
| P2 | Robinson et al. 2024 | Échec — **canon** | `effortZoneRerLabel` |
| P2 | Freitas et al. 2017 | Contrastes — attentes amateurs | Copy, pas seuil |
| P2 | World Rugby Contact Load | Contact — **canon** cadre pro → proxy amateur | Tip semaine de match |
| P2 | Fownes-Walpole 2025 | Cou — **canon** | Tip off-season |
| P2 | Revue JFMK 2025 | Accel — **canon** Speed | KB seule (Vague 3 = séances) |

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
- Fownes-Walpole 2025 (cou) : https://doi.org/10.1136/bjsports-2024-108847
- Sprint rugby JFMK 2025 : https://doi.org/10.3390/jfmk10010051
- World Rugby Contact Load : https://www.world.rugby/the-game/player-welfare/medical/player-load/contact-load

## Checklist relecture humaine (avant Vague 2)

- [ ] Stats citées (ex. −51 % NHE) vérifiées sur PubMed / full text
- [ ] Pas de contradiction avec `evidence-register.md` actuel
- [x] Deload : −40 % volume, intensité = (`truncateSessionBlocks`, 2026-08-15)
- [ ] Décider progression NHE product (Severo) vs protocole UEFA actuel
- [ ] Spec UX feedback Weakley (toasts / PR / encouragement IA)

*Branche : `feature/kb-evidence-p0` · créé 2026-08-10*
