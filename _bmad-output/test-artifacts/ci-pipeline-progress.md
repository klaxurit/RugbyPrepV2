---
stepsCompleted: ['step-01-preflight', 'step-02-generate-pipeline', 'step-03-configure-quality-gates', 'step-04-validate-and-summary']
lastStep: 'step-04-validate-and-summary'
lastSaved: '2026-03-09'
status: complete
---

# CI/CD Pipeline — Preflight

## Résultat Preflight

| Check | Résultat |
|-------|----------|
| Git repo | OK — `git@github.com:klaxurit/RugbyPrepV2.git` |
| Test stack type | **frontend** (vite.config.ts, src/pages/, src/components/) |
| Test framework | **Vitest 4.0** (vitest.config.ts, env: node, pattern: `src/**/*.test.ts`) |
| Tests locaux | **126 pass / 0 fail** (3 fichiers test, 170ms) |
| CI platform | **github-actions** (remote github.com, aucun workflow existant) |
| Node version | **v20.19.6** (pas de .nvmrc — à fixer) |
| Package manager | **npm** (package-lock.json) |
| Scripts disponibles | `npm run build` (tsc + vite build), `npm run lint` (eslint), `npm run test` (vitest run) |
| E2E framework | **Absent** (pas de Playwright/Cypress) |

## Variables résolues

```yaml
ci_platform: github-actions
test_stack_type: frontend
test_framework: vitest
test_dir: src/
node_version: 20
```

---

# Step 2 : Pipeline générée

## Fichier créé

`.github/workflows/test.yml`

## Stages du pipeline

| Stage | Trigger | Description |
|-------|---------|-------------|
| **lint** | push main, PR main | ESLint + Prettier |
| **typecheck** | push main, PR main | `tsc -b` (compilation TypeScript stricte) |
| **test** | après lint+typecheck | `npm run test` — 126 tests Vitest |
| **build** | après lint+typecheck | `npm run build` (tsc + vite build) |
| **burn-in** | PR uniquement, après test | 5 itérations burn-in détection flaky |
| **report** | toujours | Résumé GitHub Step Summary |

## Adaptations au projet

- **Pas de sharding** : 126 tests en <200ms, sharding inutile
- **Pas de Playwright/Cypress** : aucun E2E, pas d'install navigateur
- **Pas de Pact** : pas de contract testing (backend = Supabase BaaS)
- **TypeScript en job séparé** : `tsc -b` strict valide les types indépendamment
- **Build séparé** : vérifie que le bundle Vite compile (détecte les erreurs runtime)
- **Burn-in 5 itérations** (vs 10 dans le template) : suffisant pour des tests déterministes purs
- **Node 20** fixé (version locale), pas de .nvmrc

---

# Step 3 : Quality Gates & Notifications

## Quality Gates

| Gate | Seuil | Effet |
|------|-------|-------|
| **Lint** | 0 erreur ESLint+Prettier | Bloque PR |
| **TypeScript** | 0 erreur `tsc -b` (strict) | Bloque PR |
| **Unit Tests** | 100% pass (126 tests) | Bloque PR |
| **Build** | Bundle Vite compile | Bloque PR |
| **Burn-in** | 5/5 itérations sans flaky | Informatif (PR only) |

## Job `quality-gate`

Job unique servant de **required status check** pour la protection de branche.
Agrège les résultats de lint + typecheck + test + build — échoue si l'un des 4 est en erreur.

### Configuration recommandée (GitHub)

1. Settings > Branches > Branch protection rule pour `main`
2. Require status checks : cocher `quality-gate`
3. Require branches to be up to date
4. Optionnel : Require PR reviews (1 reviewer)

## Notifications

- **GitHub native** : notifications automatiques sur échec de PR check
- **Pas de Slack/email** pour l'instant (à ajouter quand l'équipe grandit)
- **Step Summary** : tableau récapitulatif visible dans l'onglet Actions de chaque run

---

# Step 4 : Validation & Résumé

## Validation checklist

- [x] Git repo + remote configuré
- [x] Test stack type détecté (frontend)
- [x] Test framework détecté (Vitest 4.0)
- [x] Tests locaux passent (126/126)
- [x] CI platform détecté (GitHub Actions)
- [x] Config file créé (`.github/workflows/test.yml`)
- [x] YAML syntaxiquement valide
- [x] Node version correcte (20)
- [x] Commandes adaptées au stack
- [x] Browser install omis (unit tests only)
- [x] Burn-in configuré (5×, PR only)
- [x] Cache npm activé
- [x] Quality gate job ajouté
- [x] Pas de secrets dans la config
- [x] Pas d'injection script

## Prochaines étapes (Coach)

1. Commit + push la config CI
2. Configurer branch protection `main` → required check `quality-gate`
3. Ouvrir une PR pour déclencher le premier run
4. Vérifier que le pipeline passe (lint + typecheck + test + build)
5. Optionnel : ajouter `.nvmrc` avec `20` pour fixer la version Node
