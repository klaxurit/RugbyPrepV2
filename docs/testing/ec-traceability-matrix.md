# EC Traceability Matrix (CI Gate)

Matrice formelle de traçabilité entre les edge cases `EC-*` et les tests automatisés exécutés en CI.

> ⚠️ **2026-05-08** — EC-01 à EC-10 retirés avec la Décision #47 (cleanup legacy stack). Ils validaient des invariants de `buildWeekProgram` / `qualityGates` / `validateSession` / `safetyContracts` qui n'existent plus dans le code actif. Le stack production est maintenant `motherSessions` via `services/motherSession/resolveMotherSessionsForWeek.ts`. De nouveaux ECs sur ce stack pourront être réintroduits si besoin.

| Edge Case | Sévérité | Risque principal | Tests automatisés liés | Statut CI |
|---|---|---|---|---|
| EC-11 | Degraded | Dates match invalides ignorées sans garde | `src/services/program/scheduleOptimizer.test.ts` | Couvert |
| EC-12 | Cosmetic | Fallback scheduler inatteignable (2/3 séances) | `src/services/program/scheduleOptimizer.test.ts` | Couvert |

## Règle de gate

- Tous les IDs `EC-11..EC-12` doivent être présents dans ce fichier.
- Chaque ligne doit référencer au moins un fichier de test existant.
- Le check automatique est exécuté via `npm run test:ec-matrix`.
