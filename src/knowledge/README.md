# Knowledge Base — RugbyPrep V2

Base de connaissance scientifique pour l'application RugbyPrep. Ces fichiers sont la source de vérité utilisée pour enrichir les appels à l'API Claude.

---

## Index des fichiers

| Fichier | Contenu | Lignes | Refs |
|---|---|---|---|
| `periodization.md` | Périodisation, SGA, surcompensation, modèles, saison FFR, déload, tapering | ~250 | 21 |
| `recovery.md` | Récupération, sommeil, protocoles post-match, monitoring HRV/Hooper/CMJ | ~230 | 17 |
| `injury-prevention.md` | ACWR, épidémiologie, prehab par zone, commotion, signaux d'alerte | ~280 | 13 |
| `strength-methods.md` | Courbe F-V, RFD, méthodes ME/DE/RE, French Contrast, progressions | ~240 | 9 |
| `nutrition.md` | Besoins énergie, macros, timing, suppléments, alcool | ~220 | 10 |
| `energy-systems.md` | ATP-PC/glycolyse/aérobie, VO2max, HIIT, RSA, interférence concurrent | ~200 | 7 |
| `beginner-intermediate-training.md` | Classification Starter/Builder, supersets AA, progression linéaire, bodyweight, sécurité débutants | ~380 | 16 |

---

## Architecture d'injection Claude (Phase 1 — Statique)

```typescript
// Logique de sélection des sections KB selon le contexte utilisateur
type KBContext =
  | 'deload_explanation'      // periodization.md §5 + recovery.md §1.3
  | 'post_match_recovery'     // recovery.md §3 + nutrition.md §3.3
  | 'injury_alert'            // injury-prevention.md §7 + §5
  | 'session_programming'     // strength-methods.md §3 + §6 + periodization.md §6
  | 'season_phase_change'     // periodization.md §4 + strength-methods.md §6.3

// Dans une Edge Function Supabase :
const buildPrompt = (situation: KBContext, userProfile: UserProfile) => {
  const kbSections = selectKBSections(situation) // fichiers markdown ciblés
  return `
    ## Contexte scientifique
    ${kbSections}

    ## Profil utilisateur
    Niveau: ${userProfile.level}
    Position: ${userProfile.position}
    Blessures: ${userProfile.injuries.join(', ')}

    ## Question / Situation
    [...]

    Réponds en français, de manière concise et adaptée à un joueur amateur.
  `
}
```

---

## Fiabilité des données

Les références sont des publications réelles (chercheurs, journaux, sujets de recherche exacts). Les chiffres généraux (seuils ACWR, fenêtres de récupération, pourcentages d'effet) sont des approximations cohérentes avec la littérature.

**Avant utilisation commerciale ou médicale** : vérifier les statistiques critiques sur PubMed (https://pubmed.ncbi.nlm.nih.gov/).

---

## Règle KB-First (pour Claude Code)

Avant toute décision technique ou scientifique liée à la préparation physique :
1. Consulter les fichiers KB pertinents
2. Si l'information manque → WebSearch, vérifier, ajouter dans la KB
3. **Ne jamais inventer** de références ou de chiffres

---

## Enrichissement futur

### Sources prioritaires à intégrer
- [ ] PubMed API : enrichissement automatique de nouvelles études
- [ ] World Rugby : mises à jour protocoles commotion
- [ ] Nouvelles études NHE (2022-2025)

### Topics manquants (roadmap)
- [ ] `psychology.md` : charge mentale, confiance, anxiété pré-compétition
- [x] `double-match-weeks.md` : gestion semaine avec 2 matchs *(complété)*
- [x] `beginner-intermediate-training.md` : classification Starter/Builder, supersets, progression *(complété)*
- [ ] `womens-rugby.md` : adaptations spécifiques féminines
- [ ] `u18.md` : développement du joueur jeune, Long Term Athlete Development

---

*Version : 1.0.0 | Dernière mise à jour : 2026-02-25*
