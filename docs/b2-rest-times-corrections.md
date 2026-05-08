# B2 — Phase C triage + Phase D action plan

**Source audit** : `docs/b2-rest-times-findings.md` (155 blocks, 1 FAIL_RANGE, 16 SKIP, 138 PASS)
**Date triage** : 2026-05-08

## 1. Verdicts par catégorie

### 1.1 Le seul FAIL audit

| Session | Block | Parsed | Intent inféré | KB attendu | Verdict |
|---|---|---|---|---|---|
| `UPPER_IN_SEASON_BACK_THREE_V1` | #2 `Pull Contrast Strength` | 75-90s | `power_contrast` | 120-180s | ⚠ **NAMING anomaly, not data anomaly** |

**Diagnostic** : Le bloc s'appelle "Contrast Strength" mais sa **structure** ne correspond pas à un vrai contrast :

```markdown
### Block 2 - Pull Contrast Strength
- Format: `3 rounds`, `75-90s` rest after the pair
- Exercise A: `Neutral-Grip Pull-Up` `3x5`
- Exercise B: `Pendlay Row` `3x5-6`
- Coaching notes:
  - Pull-up : traction lourde, add load if strong enough (ceinture lest).
  - Pendlay starts from a dead stop each rep.
```

C'est une **paire de force lourde** (deux compounds horizontaux), **pas** un contrast (= heavy + plyo/ballistic, type "Bench + Med Ball Chest Pass" comme le Block 1 du même MD). Le 75-90s rest est **cohérent** avec Effort Répété KB (60-120s) ; ce qui est faux c'est le **nom du bloc**.

**Confirmation cross-référence** : la variant `UPPER_IN_SEASON_FRONT_ROW_V1` a le même bloc "Pull Contrast Strength" avec 90-120s rest (PASS *borderline* : touche 120s = KB power_contrast min). Même misnomer.

**Décision** : renommer dans les **deux** MDs pour cohérence et pour aligner sur la convention contrast = heavy + ballistic.

| File | Line | Avant | Après |
|---|---|---|---|
| `docs/training/mother-sessions/in-season/UPPER_IN_SEASON_BACK_THREE_V1.md` | 50 | `### Block 2 - Pull Contrast Strength` | `### Block 2 - Pull Strength Pair` |
| `docs/training/mother-sessions/in-season/UPPER_IN_SEASON_FRONT_ROW_V1.md` | 50 | `### Block 2 - Pull Contrast Strength` | `### Block 2 - Pull Strength Pair` |

Après régen, la heuristique reclassera ces 2 blocks comme `hypertrophy` (via `\bstrength\s+pair\b`) → 75-90s et 90-120s tous deux PASS clean (overlap KB hypertrophy 60-120s).

### 1.2 Allowlist SKIPs confirmées (16 cas)

| Source pattern | Count | Exemples (sessionId / block) | Confirmation |
|---|---:|---|---|
| `emom/tabata/amrap timed protocol` | 9 | Front Row Finisher / Back Three Finisher / Athletic Finisher (EMOM 6'/8'/9') | ✅ KB conditioning protocol-specific, hors scope |
| `minimal-rest sentinel (mobility/flow)` | 3 | Trunk / Mobility / Tissue Reset · Lower-Leg / Stiffness Prep · Shoulder / Trunk Support | ✅ Flow continu, no measurable rest |
| `empty-format (warmup or prep block)` | 3 | Lower-Leg / Optional Reward · Groin / Trunk / Lower-Leg Support · Lower-Leg / Groin / Trunk Support | ✅ Pas de scheme propre, blocs prep accessoires |
| `walk-back sprint recovery` | 1 | Sprint / Acceleration | ✅ Récupération-au-run, pas de chrono fixe |

Aucun SKIP à reclassifier.

### 1.3 PASS (138 blocks) — vérifications spot

Sample verified from CSV (10 first PASS rows, voir `docs/b2-rest-times-findings.csv`) — tous overlap KB normalement.

Boundary case résiduel (PASS borderline mais à surveiller) :
- `UPPER_IN_SEASON_FRONT_ROW_V1 #2` : 90-120s vs power_contrast 120-180. Touche `120` exactement → PASS pour `parsedMax >= kbMin`. Sera réglé par le rename de §1.1.

## 2. Heuristique d'inférence — décisions canonisées (pour Phase E test)

Le refinement Phase B a abouti à 11 règles ordonnées **specific → generic**. Décisions clés à documenter dans le contract test :

| Décision | Justification | Source |
|---|---|---|
| `hypertrophy` matched **AVANT** `force` | "Strength" / "Pair" / "Triplet" + 60-120s rest = RE method, pas ME. Bloque les false positives. | strength-methods.md:218/276 |
| "Primer" en nom de bloc ≠ activation | Dans FULL_LIGHT_PRIMER, "Primer" est un suffixe de session, les blocks sont des working blocks RE. | Corpus convention rugby |
| "Neural Pair" → `power_contrast` | Convention rugby : neural = sub-max heavy + intent maximal de vitesse, executed in pair, 120-180s rest. | Décision #40 v2 |
| "Force + Projection/Power/Maintenance" → `power_contrast` | Heavy compound + accent dynamique en pair/triplet. | Corpus convention |
| "Vertical/Horizontal Press/Row" → `hypertrophy` | RE method volume blocks, pas force max. | strength-methods.md:276 |
| `force` étroit : "force max", "max effort", "heavy", "1RM"/"5RM" only OR format `full rest 3-4 min` | Évite que toute mention de "Strength" déclenche force-max range. | KB convention |
| `dup_endurance` : pas matché en corpus | Aucun bloc actuel labelisé "DUP endurance" — règle placeholder. | Audit 2026-05-08 |

Ces décisions seront figées dans `parseRestSeconds.test.ts` + `inferBlockIntent.test.ts` (à créer en Phase E) + dans le contract test global.

## 3. Plan d'action Phase D

### Étape D.1 — Edits MD

```bash
# Edit 1
sed -i '' 's/### Block 2 - Pull Contrast Strength/### Block 2 - Pull Strength Pair/' \
  docs/training/mother-sessions/in-season/UPPER_IN_SEASON_BACK_THREE_V1.md

# Edit 2
sed -i '' 's/### Block 2 - Pull Contrast Strength/### Block 2 - Pull Strength Pair/' \
  docs/training/mother-sessions/in-season/UPPER_IN_SEASON_FRONT_ROW_V1.md
```

(En pratique : `Edit` tool dédié, sed est un illustratif de la transformation.)

### Étape D.2 — Régen dataset

```bash
node scripts/generateMotherSessionsDataset.mjs
```

Attendu : `src/data/motherSessions.generated.ts` régénéré, 39 sessions.

### Étape D.3 — Re-run audit

```bash
node scripts/auditRestTimes.mjs --stdout
```

Attendu :

```
By status: { PASS: 140, SKIP: 16, FAIL_RANGE: 0, FAIL_INTENT_UNKNOWN: 0, FAIL_PARSE: 0 }
Failures: 0
```

(Hypertrophy passe de 60 à 62 PASS ; power_contrast passe de 33 à 31 ; FAIL_RANGE 1 → 0.)

### Étape D.4 — Sanity full

```bash
npx tsc -b              # clean expected
npm run test            # 1169/1169 pass expected
```

### Étape D.5 — Commit

```
B2 phase D: rename "Pull Contrast Strength" → "Pull Strength Pair"
```

## 4. Risques résiduels / non-couvertures

- **Rest times intra-pair non audités** : la convention canonique (Décision #40 v2) dit qu'on ne modélise pas le rest intra-pair (entre Exercise A et B d'une paire) — c'est un comportement pédagogique laissé au coach. L'audit ne le surface pas.
- **Heuristique imparfaite par construction** : un bloc avec un nouveau pattern non couvert (ex: "Olympic Triplet" futur) tomberait en `unknown`. C'est intentionnel : le contract test (Phase E) fail clean → force d'ajouter la règle explicite avant merge.
- **Soft ranges (activation/prehab/core/sprint/reward) avec ±15-30s tolerance** : par design, on accepte qu'un bloc activation à 75s passe (KB 30-60 + 15 = 75). Si un futur bloc activation à 100s apparaît → FAIL → décision case-par-case (data fix vs widening tolerance).
- **dup_endurance** : aucun bloc current ne match. Si une session DUP "Séance C" est ajoutée, prévoir un keyword explicite type "DUP endurance" ou "in-season endurance".

## 5. État après Phase D (prévision)

| Métrique | Phase B baseline | Phase D attendu |
|---|---:|---:|
| Total blocks | 155 | 155 |
| PASS | 138 | **140** |
| SKIP | 16 | 16 |
| FAIL_RANGE | 1 | **0** |
| FAIL_INTENT_UNKNOWN | 0 | 0 |
| FAIL_PARSE | 0 | 0 |

Phase E (strict contract test) sera ensuite trivialement vert.
