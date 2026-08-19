# RugbyPrep — instructions agents

Source unique. Ne pas recopier ces règles ailleurs.

## Qualité

Avant commit / push : `npm run check` (`lint` + `tsc -b` + Vitest). Détail CI :
`.cursor/rules/quality-gate.mdc`.

Feature UI : après le code, le check + les tests Playwright / composant **déjà là**.
Pas de campagne screenshots inventée.

## Features non triviales

Plan d’abord (fichiers, risques, critère de done). Code seulement après validation.
Auth, billing, Runway, landing : **pas** le mode préparateur physique.

## Séances / programme

Si la tâche touche séance, mother session, template, périodisation, volume ou
repos : `.cursor/rules/prepa-ia-rugby.mdc` + `src/knowledge/prepa-ia.md`.
Livrer **A** (conservateur) et **B** (ambitieux). Pas de rewrite sans choix humain.

## Erreurs déjà vues (ne pas répéter)

- Helper / constante partagée : fichier `.ts`, jamais un export à côté d’un
  composant `.tsx` (`react-refresh/only-export-components` casse le job Lint).
- `tsc` ou Vitest seuls ne suffisent pas : le Quality Gate CI inclut **lint**.
- Pas de rewrite mother sessions / corpus tant que A/B n’est pas choisi.
- Ne pas injecter toute la KB : `retrieval-index.md`, 1–3 fichiers.
