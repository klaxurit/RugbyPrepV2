# BMAD Help Context — RugbyForge

Ce document sert de mémo projet pour `/bmad-help`.

## Réalité actuelle du projet

- L’app principale est déployée sur Cloudflare Pages.
- La landing page publique n’est pas encore déployée.
- Le backend Supabase est en place avec :
  - Auth
  - entitlements `free/premium`
  - Stripe checkout + webhook + sync
  - abonnements push sécurisés
- Le flux Stripe test est validé de bout en bout.
- Le moteur de programme reste **déterministe** et l’entrée canonique est `buildWeekProgram()`.
- La sécurité n’est jamais verrouillée derrière le premium.
- Le premium débloque aujourd’hui surtout :
  - analytics détaillées
  - suggestions automatiques
  - CTA / badges / entitlements serveur
- Les notifications push ne sont pas encore complètement “live” :
  - l’inscription device est branchée
  - le scheduler `send-training-reminders` journalise/queue
  - le transport push réel reste à connecter

## Source de vérité documentaire

Lire dans cet ordre :

1. `docs/index.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/training/PROGRAM-CYCLE.md`
4. `docs/training/PROGRAM-ENGINE.md`
5. `docs/backend-roadmap.md`
6. `docs/feature-access-matrix.md`

Ne pas prendre `docs/ETAT_DES_LIEUX_V1.md` comme source de vérité sans le
croiser avec `PROJECT_STATUS.md`.

## Commandes BMAD à recommander selon l’intention

### Si l’utilisateur demande “où en sommes-nous ?”, “fais un état des lieux”, “documente le projet”

- Recommander d’abord : `/bmad-bmm-document-project`
- Puis, si l’objectif est d’aider d’autres agents ensuite : `/bmad-bmm-generate-project-context`

### Si l’utilisateur demande “que manque-t-il avant une vraie mise en ligne ?”

- Recommander : `/bmad-bmm-check-implementation-readiness`

### Si l’utilisateur demande “que fait-on ensuite ?” ou “quel est le prochain milestone ?”

- Recommander : `/bmad-bmm-sprint-status`
- Puis `/bmad-bmm-sprint-planning` si une priorisation exécutable est souhaitée

### Si l’utilisateur veut faire une petite évolution brownfield sans relancer tout le cadre

- Recommander : `/bmad-bmm-quick-spec`
- Puis `/bmad-bmm-quick-dev`

### Si l’utilisateur veut auditer la qualité du système de tests

- Recommander : `/bmad-tea-testarch-test-review`

### Si l’utilisateur veut cartographier les trous de couverture

- Recommander : `/bmad-tea-testarch-trace`

### Si l’utilisateur veut améliorer la stratégie d’automatisation / CI qualité

- Recommander : `/bmad-tea-testarch-framework`
- Puis `/bmad-tea-testarch-ci`

### Si le périmètre produit a dévié ou qu’une correction de cap est nécessaire

- Recommander : `/bmad-bmm-correct-course`

## Rappels produit à ne jamais perdre

- `buildWeekProgram()` est l’entrée unique du moteur.
- Le cycle réel est `H1–H4`, `W1–W4`, `W5–W8`, puis `DELOAD`.
- Les docs historiques contiennent encore quelques formulations obsolètes.
- Le chat IA free n’a pas aujourd’hui de quota strict visible dans le code.
- Le principal risque non traité n’est pas la logique cœur, mais la finition :
  - landing
  - CI
  - E2E
  - delivery push réel
  - perf bundle
