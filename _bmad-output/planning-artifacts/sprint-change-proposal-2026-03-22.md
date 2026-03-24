# Sprint Change Proposal : Annual-First Player Experience

**Date :** 2026-03-22
**Scope :** Moderate — recadrage surface joueur + nettoyage legacy
**Approche :** Ajustement direct
**Statut :** Approuvé — 2026-03-22

---

## 1. Résumé du problème

La politique `resolveWeeklyProgramSurface` fait `in_season + beta eligible → legacy primaire`. Le moteur legacy obsolète reste la surface principale visible côté joueur alors que le moteur annual/mother-session est prêt et exploitable. Le joueur voit un programme legacy en premier, le plan annual relégué en `<details>` collapsed en bas de page.

Ce n'est plus un problème de polish — c'est une mauvaise hiérarchie produit.

## 1bis. Principe UX structurant

Le moteur annual devient la source de vérité pour la résolution du programme. Mais **l'UX joueur reste organisée à l'échelle de la semaine et de la séance**, pas comme un affichage "plan annuel complet".

**Navigation joueur cible :**
- `/program` = **vue d'ensemble compacte centrée sur la semaine courante** — aperçu du contexte (cycle, fatigue, charge) + liste des séances de la semaine + accès rapide au détail
- `/week` = **vue hebdomadaire détaillée** — séances de la semaine avec contenu visible, banners match/récup
- `/session/:id` = **vue d'une seule séance** — blocs, exercices, complétion

**Règles :**
- Le contexte annual (cycle, phase, semaine) **pilote** ce qui est affiché, mais n'est pas lui-même la surface principale
- On ne montre pas "toute l'année" comme vue macro permanente
- Le `AnnualPlanningSummaryCard` reste un résumé compact de contexte, pas le contenu principal de la page
- Le joueur retrouve une navigation simple : aperçu → séances → détail d'une séance
- `WeekPage` et `SessionDetailPage` restent des surfaces centrales du flow joueur, pas des accessoires du plan annuel

## 2. Analyse d'impact

### Fichiers impactés

| Fichier | Impact | Effort |
|---------|--------|--------|
| `src/services/program/resolveWeeklyProgramSurface.ts` | Politique de routing : supprimer la beta gate, ajouter `'unavailable'` | Medium |
| `src/pages/ProgramPage.tsx` | Supprimer ~300 LOC legacy, ajouter fatigue compact + ACWR monitoring | High |
| `src/pages/WeekPage.tsx` | Supprimer contenu legacy, garder shell annual compact | High |
| `src/pages/SessionDetailPage.tsx` | Supprimer branche legacy ~120 LOC | Medium |
| `src/services/program/buildProgramSessionLog.ts` | Humaniser sessionLabel | Low |
| `src/services/program/sessionLogPresentation.ts` | Helper `isRawMotherSessionId` + labels FR | Low |
| `src/pages/ProfilePage.tsx` | Masquer sélecteur langue EN | Low |
| `src/components/motherSession/MotherSessionView.tsx` | Retirer fond froid wrapper | Low |
| `src/components/motherSession/MotherSessionWeekPanel.tsx` | Retirer fond froid wrapper sélectionné | Low |
| Tests | Mettre à jour pour annual-first + `'unavailable'` | Medium |

### Éléments non impactés

- Moteur annual planning (`detectAnnualPlanningContext`, `buildAthletePlanningInputs`) — inchangé
- Parser mother-session — inchangé
- Onboarding — inchangé (fixes acquis préservés)
- HistoryPage / ProgressPage — inchangés (logs déjà compatibles)
- Pages staff / sandbox — hors scope

## 3. Approche recommandée : Ajustement direct

### 3.1 Politique de surface (`resolveWeeklyProgramSurface.ts`)

**Règle :**
- `mother_session` = surface joueur canonique dès qu'une résolution exploitable existe
- Si résolution absente / vide / invalide → `primarySource = 'unavailable'` (pas de fallback legacy)
- Le type `WeeklyProgramPrimarySource` passe à `'mother_session' | 'unavailable'`
- Le build legacy (`buildWeekProgram`) est supprimé du chemin principal
- Le champ `result.legacy` n'est plus peuplé

**Code :**
```ts
const msExploitable = motherSessionResult.status !== 'missing_session'
  && motherSessionResult.sessions.length > 0

if (msExploitable) {
  primarySource = 'mother_session'
  decisionReason = `Programme annuel — ${planningContext.weekLabel}`
} else {
  primarySource = 'unavailable'
  decisionReason = 'Résolution annual indisponible.'
  warnings.push('Le plan annuel n\'a pas pu être résolu pour cette semaine.')
}
```

**Aucun fallback implicite vers legacy.** Le `'legacy'` disparaît du type union.

### 3.2 ProgramPage — vue d'ensemble semaine courante

`/program` n'est pas une page "plan annuel complet". C'est une **vue d'ensemble compacte centrée sur la semaine courante**.

**Structure cible :**
1. Header joueur (avatar, nom)
2. Résumé de contexte compact (`AnnualPlanningSummaryCard`) — cycle, phase, semaine, fatigue
3. Fatigue compact (toggle OK/Fatigué) + ACWR monitoring si données suffisantes
4. **Liste des séances de la semaine** (tabs mother-session via `MotherSessionWeekPanel`) — c'est le contenu principal
5. Complétion séance (sélecteur + bouton "Marquer comme faite")
6. Si `unavailable` : état propre "Programme en préparation"

**Suppressions :**
- Bloc `isLegacyPrimary` (~300 LOC) : week selector, session cards legacy, RPE modal legacy, fatigue selector legacy
- Section secondaire `<details>` (plus de coexistence)
- Badge source (`'Moteur annuel'` / `'Moteur historique'`)
- Variables `isLegacyPrimary` / `isMotherSessionPrimary`

**Le `AnnualPlanningSummaryCard` reste un résumé de contexte, pas le contenu principal de la page.** La liste des séances de la semaine est le cœur de la vue.

### 3.3 WeekPage — vue hebdomadaire détaillée

`/week` reste une surface centrale du flow joueur. C'est la **vue hebdomadaire détaillée** — plus de contenu visible que `/program`.

**Structure cible :**
1. Résumé de contexte compact (cycle, semaine)
2. Fatigue compact + ACWR monitoring
3. Banners match / récupération si pertinents
4. **Séances de la semaine** (tabs avec contenu développé via `MotherSessionWeekPanel`)
5. Si `unavailable` : état d'indisponibilité propre

**Suppressions :**
- Week selector chips H1/W1 — le moteur annual gère la semaine
- Session cards legacy — remplacées par les séances mother-session
- CTA séance du jour legacy — remplacé par les tabs mother-session
- ACWR widget legacy (rôle routing) — remplacé par carte monitoring compacte

**Pas de redirect vers `/program`.** `/week` est la deuxième page du flow joueur, pas un accessoire.

### 3.4 SessionDetailPage — vue d'une séance

`/session/:id` reste la troisième surface du flow joueur. C'est la **vue d'une seule séance** — blocs, exercices, complétion.

**Structure cible :**
1. Header séance (titre humanisé FR)
2. `MotherSessionView` (blocs, exercices, notes de coaching)
3. Notes joueur + RPE
4. Bouton complétion
5. Si slot non trouvé ou `unavailable` : "Séance introuvable — retour au programme"

**Suppressions :**
- Branche `isLegacyPrimary` (~120 LOC : SessionView legacy, session identity card)

### 3.5 Logs — humaniser sessionLabel

**Persistance (buildProgramSessionLog.ts) :**
```ts
sessionLabel: formatTitleFromMotherSessionId(slot.session.metadata.id, 'fr'),
```

**Présentation (sessionLogPresentation.ts) :**
```ts
function isRawMotherSessionId(label: string): boolean {
  return /^[A-Z][A-Z0-9_]+_V\d+$/.test(label)
}

export function getSessionLogDisplayTitle(log: SessionLog): string {
  if (log.motherSessionId && log.sessionLabel && isRawMotherSessionId(log.sessionLabel)) {
    return formatTitleFromMotherSessionId(log.motherSessionId, 'fr')
  }
  if (log.sessionLabel) return log.sessionLabel
  return SESSION_TYPE_LABELS[log.sessionType] ?? log.sessionType
}
```

**Labels FR :**
- `getSessionLogSourceLabel` : `'Programme annuel'` / `'Programme historique'`

### 3.6 Langue — FR propre, EN masqué

- Expérience joueur = FR uniquement
- Sélecteur langue supprimé de `ProfilePage` (code commenté, conditionné à `false`)
- `preferredLanguage` reste dans le modèle (pas de migration destructive)
- Composants mother-session gardent `lang='fr'` en dur
- Dict `motherSessionLabels.ts` conserve les traductions EN (prêt pour plus tard)

### 3.7 Harmonisation visuelle

- `MotherSessionView` : retirer `bg-[#0f1114]` et `rounded-[2rem]` du wrapper principal
- `MotherSessionWeekPanel` : retirer `bg-[#0f1114]/60` du wrapper de la vue sélectionnée
- Les blocs enfants gardent leur propre fond — supprime l'effet "module externe"

### 3.8 Badges, états vides et tests pour `'unavailable'`

**Type :**
```ts
export type WeeklyProgramPrimarySource = 'mother_session' | 'unavailable'
```

**État vide sur ProgramPage / WeekPage :**
```tsx
{primarySource === 'unavailable' && (
  <section className="rounded-[24px] border border-amber-500/25 bg-amber-900/10 p-5 space-y-3">
    <p className="text-sm font-bold text-amber-300">Programme en préparation</p>
    <p className="text-xs text-white/50">
      Le plan annuel n'a pas pu être résolu pour cette semaine. Vérifie ton profil ou réessaie après une mise à jour.
    </p>
  </section>
)}
```

**Tests à mettre à jour :**
- Tous les tests qui assertent `primarySource === 'legacy'` → remplacer par `'unavailable'` ou supprimer
- Tous les tests qui cherchent `'Moteur historique'` → supprimer
- Ajouter un test `'unavailable' → écran de préparation visible`
- Ajouter un test `mother_session exploitable → surface annual visible, pas de legacy`

## 4. Widgets legacy — décision par widget

| Widget | Décision | Implémentation |
|--------|----------|----------------|
| Fatigue selector (OK/FATIGUE) | **Garder** compact dans annual | Carte "Comment te sens-tu ?" avec toggle, alimente `useFatigue()` |
| ACWR zone | **Garder** monitoring secondaire | Mini-carte si `hasSufficientACWRData` |
| Week selector (H1-W8) | **Supprimer** | Le moteur annual gère la semaine |
| Deload recommendation | **Supprimer** | Géré par `isDeloadWeek` |
| RPE modal post-séance | **Garder** | Utile pour logs enrichis |

## 5. Implémentation — handoff

**Scope : Moderate** — implémentation directe par le dev.

**Ordre d'exécution :**
1. Type `WeeklyProgramPrimarySource` + `resolveWeeklyProgramSurface` (fondation)
2. `buildProgramSessionLog` + `sessionLogPresentation` (logs propres)
3. `ProgramPage` (surface principale annual-only + fatigue + ACWR)
4. `WeekPage` (shell annual compact)
5. `SessionDetailPage` (annual-only)
6. `ProfilePage` (masquer sélecteur EN)
7. `MotherSessionView` + `MotherSessionWeekPanel` (harmonisation visuelle)
8. Tests
9. Vérification manuelle du flow complet

**Critères de succès :**
- `/program` affiche le plan annual comme surface unique
- `/week` affiche une vue hebdomadaire annual compacte
- `/session/:id` affiche la séance mother-session
- Le legacy n'apparaît nulle part dans le flow joueur
- Les logs mother-session ont des labels FR humanisés
- Les anciens logs avec IDs bruts sont humanisés à la présentation
- L'app est propre en FR, pas de promesse EN partielle
- La fatigue joueur reste fonctionnelle
- Aucune régression sur onboarding, history, progress
