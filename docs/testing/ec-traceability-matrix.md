# EC Traceability Matrix (CI Gate)

Matrice formelle de traçabilité entre les edge cases `EC-*` (audit 2026-03-10) et les tests automatisés exécutés en CI.

| Edge Case | Sévérité | Risque principal | Tests automatisés liés | Statut CI |
|---|---|---|---|---|
| EC-01 | Dangerous | `rehab + critical` supprime la séance rehab | `src/services/program/safetyContracts.test.ts` | Couvert |
| EC-02 | Dangerous | Rehab active laisse passer `FULL/COND` | `src/services/program/safetyContracts.test.ts` | Couvert |
| EC-03 | Broken | `starter + 3` crée un contrat UI/moteur incohérent | `src/services/program/buildWeekProgram.contract.test.ts`, `src/pages/__tests__/WeekPage.integration.test.tsx` | Couvert |
| EC-04 | Degraded | Builder ignore `seasonMode` | `src/services/program/buildWeekProgramEdgeCases.test.ts` | Couvert |
| EC-05 | Broken | Semaine invalide non rejetée explicitement | `src/services/program/buildWeekProgram.contract.test.ts` | Couvert |
| EC-06 | Broken | Profil corrompu (`equipment/injuries`) casse la génération | `src/services/program/buildWeekProgram.contract.test.ts` | Couvert |
| EC-07 | Broken | Slot requis manquant livré silencieusement | `src/services/program/qualityGates.test.ts`, `src/services/program/buildWeekProgram.test.ts` | Couvert |
| EC-08 | Broken | Contrat build/validate incohérent (`FULL_BUILDER`) | `src/services/program/validateSession.contract.test.ts` | Couvert |
| EC-09 | Degraded | Égalités de score biaisées (rotation top-3) | `src/services/program/buildWeekProgramEdgeCases.test.ts` | Couvert |
| EC-10 | Degraded | Corruption/reset d’ancre locale non visible | `src/services/program/buildWeekProgramEdgeCases.test.ts` | Couvert |
| EC-11 | Degraded | Dates match invalides ignorées sans garde | `src/services/program/scheduleOptimizer.test.ts` | Couvert |
| EC-12 | Cosmetic | Fallback scheduler inatteignable (2/3 séances) | `src/services/program/scheduleOptimizer.test.ts` | Couvert |

## Règle de gate

- Tous les IDs `EC-01..EC-12` doivent être présents dans ce fichier.
- Chaque ligne doit référencer au moins un fichier de test existant.
- Le check automatique est exécuté via `npm run test:ec-matrix`.

