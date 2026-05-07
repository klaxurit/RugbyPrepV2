# Rest Times Convention — `versions[].restSeconds`

> ⚠️ **PAUSED 2026-05-07** — Cette convention cible `blocks.v1.json` qui est **LEGACY DATA**, plus routée dans l'UI active. Les programmes affichés au user passent par `src/data/motherSessions.generated.ts` (rest times en strings libres, pas un champ typé). B2 audit sera réorienté sur motherSessions après scoping de la Décision #47 (cleanup legacy code/data). Le contract test associé est `it.skip`. Document conservé comme référence si `blocks.v1.json` est archivé plutôt que supprimé.

Source de vérité pour le contract test `src/data/__tests__/restTimes.contract.test.ts`.
Origine : audit B2 (Section 8 du release plan V1) — 2026-05-07.

## Sémantique du champ

Pour chaque `version` dans `blocks.v1.json`, `restSeconds` représente le **rest entre vraies séries** — c'est-à-dire entre exécutions complètes du contenu décrit par `scheme`. Ce n'est pas un rest intra-pair, intra-triplet ou intra-superset.

Pour les patterns composites (contrast triplet, supersets, EMOM, conditioning intervals), la structure intra-set est encodée par :
- `scheme.kind === 'emom'` — la frontière de minute encode le rest (donc `restSeconds = 0`)
- la notation composite dans `scheme.reps` (`"5 / 5 / 6"`, `"5 + 5"`) — chaque `/` ou `+` est un sous-mouvement enchaîné dans la même série

Aucun champ data model supplémentaire (`restBetweenRounds`, `restBetweenSupersets`, etc.) n'est nécessaire — voir Décision #40 (révisée).

## Convention canonique `(intent × scheme.kind) → range`

| Intent         | scheme.kind | Range cible    | Source KB                                      | Notes                                                            |
|----------------|-------------|----------------|------------------------------------------------|------------------------------------------------------------------|
| `force`        | reps        | **180–300s**   | `strength-methods.md:218` (3–5 min)           | Single-exercise max strength, 85–92% 1RM                          |
| `force`        | reps **superset antagoniste** | 60–150s | `strength-methods.md:218` + règle agoniste/antagoniste | Tag `superset` ou exos push+pull alternés → allowlist explicite   |
| `hypertrophy`  | reps        | 60–120s        | `strength-methods.md:276`                      | Repeated-effort, RIR 2–3                                          |
| `contrast`     | reps        | 120–180s       | `strength-methods.md:218` + littérature PAP    | `restSeconds` = rest **après triplet complet** (heavy + plyo + accessoire) |
| `neural`       | emom        | **0s strict**  | EMOM gère son timing                          | La frontière de minute EST le rest                                 |
| `neural`       | reps        | 60–150s        | `strength-methods.md:245` (60–90s) + tolérance olympic complex | Dynamic effort + olympic variants                |
| `activation`   | reps/time   | 30–60s         | Pas de règle KB dure (Décision #39)            | Low-intensity neural priming                                       |
| `prehab`       | reps/time   | 45–90s         | Pas de règle KB dure                           | 180s = mistag candidat sauf isométrique high-effort démontré       |
| `core`         | reps/time   | 45–90s         | `strength-methods.md:276` métabolique          | RE-style metabolic stress                                          |
| `neck`         | reps/time   | 45–90s         | Pas de règle KB dure                           | Famille prehab                                                     |
| `carry`        | reps        | 60–90s         | Loaded-carry endurance                         |                                                                    |
| `conditioning` | time        | dérivé du tag  | `energy-systems.md`                            | `hiit` (1:0.5–1), `aerobic`/`vo2max` (1:0.5–1), `lactate` (1:2–3), `rsa` (1:3–5) |
| `mobility`     | time/reps   | 0–30s          | Pas de règle KB dure                           |                                                                    |
| `warmup`       | reps        | 0s             | Séquencé                                       |                                                                    |
| `cooldown`     | time        | 0s             | Séquencé                                       |                                                                    |

## Allowlist d'exceptions

Les exceptions légitimes (ex. supersets antagonistes) vivent dans le contract test comme map typée :

```ts
const EXCEPTIONS: Record<`${BlockId}.${VersionId}`, {
  expectedRange: [number, number];
  actualSeconds: number;
  reason: string;     // KB section + structural pattern
  addedAt: string;    // ISO date
}>;
```

Ajouter une entry à l'allowlist est une décision délibérée (revue de code obligatoire). Préférer corriger l'`intent` ou le `restSeconds` quand c'est un mistag.

## Connues — corrections planifiées à J3

| Bloc                                       | Versions | restSeconds actuel | Décision                                                                        |
|--------------------------------------------|----------|---------------------|---------------------------------------------------------------------------------|
| `BLK_FORCE_UPPER_OHP_PENDLAY_01`           | W1, W2, W4 | 90, 120, 90s      | Allowlist — superset antagoniste push (OHP) + pull (Pendlay row), KB `:218` + agoniste/antagoniste |
| `BLK_FORCE_UPPER_REHAB_BAND_STRENGTH_01`   | W1–W4    | 75–90s              | Retag `intent: force → hypertrophy` ou `prehab` (charge band sub-maximale, vrai pattern rehab) |
| `BLK_FORCE_LOWER_REHAB_STABILITY_01`       | W1–W4    | 75–90s              | Idem — TKE band + isométrique hamstring, pas du tout du force max               |
| `BLK_PREHAB_COPENHAGEN_01`                 | W1–W4    | 180s                | Réduire à 60–90s (KB Copenhagen adduction protocols typiques)                   |

Impact routing à vérifier pendant J3 : si un bloc passe de `force → hypertrophy/prehab`, son éligibilité dans `selectEligibleBlocks` change selon le slot de la recette.

## Décision #40 (révisée v2 — 2026-05-07)

**v1 (incorrecte)** : `restSeconds` toujours intra-pair (0s pour contrast/neural-pair) ; inter-pair 2–3min implicite par convention sur `intent`.

**v2 (alignée sur data réelle)** : `restSeconds` = rest entre vraies séries selon la convention ci-dessus. La structure intra-pair / intra-triplet / intra-superset est encodée par `scheme.kind` (`emom`) ou par la notation composite dans `scheme.reps` (`"5 / 5 / 6"`). **Pas de nouveau champ data model.**

Justification : aucune des 92 entries `contrast` n'a `restSeconds = 0` ; la structure réelle est un triplet exécuté en série, donc `restSeconds = 180s` est bien le rest inter-set vrai. La convention v1 était fondée sur une lecture théorique incorrecte de la data.

## Consommateurs

- `src/data/__tests__/restTimes.contract.test.ts` — assertion automatisée (J2)
- `src/services/restTimer/` — UI runtime (lit `restSeconds` brut, pas d'inférence)
- `ai-coach` Edge Function — explication user (suit la convention ci-dessus)
