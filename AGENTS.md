# RugbyPrep — instructions agents

Avant toute modification de **séance, mother session, template, périodisation,
volume, repos** :

1. Lire `src/knowledge/prepa-ia.md`
2. Lire `src/knowledge/product-decisions.md`
3. Pour les études : `src/knowledge/evidence-clusters.md` (un rôle par papier)
4. Retrieval : `src/knowledge/retrieval-index.md` (1–3 fichiers, pas toute la KB)
5. Chantier : `src/knowledge/prepa-ia-roadmap.md` — pas de rewrite séances avant Vague 3 validée

Rails ≠ fourchettes scientifiques ≠ choix produit. Proposer A conservateur et
B ambitieux ; ne pas réécrire le corpus avant validation.

## Qualité avant push

`npm run check` (= `lint` + `tsc -b` + tests). C’est le sous-ensemble local du
Quality Gate GitHub (`lint` + TypeScript + tests ; CI ajoute build + e2e).

- Ne pas pousser si `lint` échoue. `tsc` / Vitest seuls ne suffisent pas.
- Ne pas exporter de helpers depuis un fichier de composants React
  (`react-refresh/only-export-components`) — fichier `.ts` à part.
