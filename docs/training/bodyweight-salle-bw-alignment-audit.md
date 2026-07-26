# Audit alignement salle ↔ poids de corps (switch équipement)

> **Date** : 2026-07-26  
> **Objectif** : vérifier variété d’exercices BW et parallélisme structurel pour un utilisateur qui passe salle → PDC sans se sentir perdu.  
> **Sources** : mother sessions MD, `BODYWEIGHT_MOTHER_SESSION_ID_MAP`, cycle annuel BW.

---

## 1. Mécanique produit

| Élément | Comportement |
|---------|--------------|
| Templates | Toujours IDs **salle** (`weeklyTemplates.ts`) |
| Switch | `mapWeeklySlotsForEquipment` → `BODYWEIGHT_MOTHER_SESSION_ID_MAP` (39 → 26) |
| Poste FR/BT | Collapsé en 1 séance BW + accents texte / Bloc Position |
| Playoffs | Resolver réutilise in-season Full + Primer → déjà mappés BW. `FULL_BW_PLAYOFF_ACTIVATION_V1` = orphelin (hors map, non émis) |

**Verdict switch global** : tenable — mêmes phases, mêmes types L/U/Full/Speed, titres Bridge alignés.

---

## 2. Tableau d’écarts (échantillon prioritaire)

### Force-Pont (S9–S10)

| Séance | Blocs | Parallèle rôles | Écart clé | Verdict |
|--------|------:|-----------------|-----------|---------|
| Lower FB | 4 | OK (squat contraste → hinge contraste → uni → prévention) | BW B1+B3 = Bulgarian ; B2+B3 = Nordic (répétition) | OK switch / variété moyenne |
| Upper FB | 4 | B1 OK ; **B2 asymétrique** | Salle = pull + contraste explosif ; BW = pull seul | **À corriger** |
| Full FB | 4 | OK (contraste bas → contraste haut → support → finisher) | Carry gym → bear crawl BW (upgrade farmer si DB) | OK switch |

### Hypertrophie (réf. volume)

| Séance | Blocs | Parallèle rôles | Écart clé | Verdict |
|--------|------:|-----------------|-----------|---------|
| Lower Hyp | 4 | OK (squat → hinge/uni → postérieur/aine → mollets) | **Bulgarian en B1 et B2** | **À corriger** |
| Upper Hyp | 4–5 vs 4 | Rôles push/pull/vertical OK ; bras gym absents BW | Pike en B2+B3 (légère redondance) | OK switch |

### In-season

| Séance | Blocs | Parallèle rôles | Écart clé | Verdict |
|--------|------:|-----------------|-----------|---------|
| Lower IS | 3 | OK (contraste → support → EMOM) | Bulgarian 2× ; sled → bear crawl | OK switch |
| Upper IS | 3 | OK (contraste push → paire pull → finisher) | Pull vertical salle → 2 rowing BW | OK switch (gap matériel) |

---

## 3. Variété BW (rappel)

- ~37 exercices uniques de blocs ; noyau répété : rowing inversé, decline/plyo push-up, Bulgarian, nordique, Copenhagen, bear crawl.
- Diff Hyp vs Force-Pont : **forte en méthode** (reps/repos/contrastes), **faible en catalogue**.
- Pull vertical dur **sans barre** : progression rowing table → pieds élevés ; traction seulement si `pullup_bar` (chaîne runtime déjà présente).

---

## 4. Priorités correctifs (phase B)

1. **P0** — Upper Force-Pont BW B2 : rétablir contraste pull (force + explosif).
2. **P0** — Lower Hypertrophie BW B2 : remplacer le 2ᵉ Bulgarian par fente arrière.
3. **P1** — Documenter progression pull sans barre + coaching Upper FB.
4. **P1** — Playoffs : pas de map manquante pour les IDs émis ; orphelin `FULL_BW_PLAYOFF_ACTIVATION_V1` laissé hors resolver (activation dédiée future).
5. Sync `motherSessions.generated.ts` après edits MD.

---

## 5. Critères « pas perdu » — score

| Critère | Score |
|---------|-------|
| Ordre des patterns | Oui |
| Type de stimulus (volume vs contraste) | Oui sauf Upper FB B2 (avant fix) |
| Labels / titres Bridge | Oui |
| Sensation de progression Hyp → FB | Méthode oui, mouvements trop proches |