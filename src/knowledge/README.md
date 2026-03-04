# RugbyPrep — Base de Connaissance Scientifique

## Objectif

Cette base de connaissance (KB) est la source de vérité scientifique de
l'application RugbyPrep. Elle contient des synthèses denses et sourcées de
la littérature scientifique sur la préparation physique, la récupération,
la nutrition et la prévention des blessures en rugby à XV.

Elle est conçue pour être **injectée comme contexte** dans les appels à l'API
Claude, permettant à l'IA de générer des recommandations fondées scientifiquement
et adaptées au profil du joueur.

---

## Fichiers Disponibles

| Fichier | Domaine | Lignes | Références | Version |
|---|---|---|---|---|
| `periodization.md` | Périodisation, cycles, saison française | ~400 | 24 | 1.0.0 |
| `recovery.md` | Sommeil, CWI, HRV, nutrition récupération | ~450 | 32 | 1.0.0 |
| `strength-methods.md` | Force-vitesse, PAP, French Contrast, plyométrie | ~500 | 32 | 1.0.0 |
| `nutrition.md` | Macros, timing, match day, supplémentation, alcool | ~550 | 25 | 1.0.0 |
| `injury-prevention.md` | ACWR, prehab, commotion, retour au jeu | ~520 | 25 | 1.0.0 |
| `energy-systems.md` | Filières, VO2max, RSA, HIIT, concurrent | ~420 | 19 | 1.0.0 |
| `athletic-testing.md` | CMJ, sprint 10m, YYIR1, 1RM estimé, asymétrie, baselines par poste | ~423 | 17 | 1.0.0 |
| `team-monitoring.md` | ACWR collectif, matrice risque joueurs, push séances, rotation | ~453 | 12 | 1.0.0 |

**Total : ~3 716 lignes de contenu scientifique, ~186 références.**

---

## Architecture d'Utilisation (Claude API)

### Principe : Retrieval Contextuel par Situation

Plutôt que d'injecter l'intégralité de la KB (trop long), sélectionner les
sections pertinentes selon le contexte utilisateur.

```typescript
// Exemple d'architecture d'injection (à implémenter)

const KB_SECTIONS = {
  // Clé : situation → sections pertinentes à injecter
  'deload_recommendation': ['periodization#5', 'recovery#1.3'],
  'session_generation_force': ['strength-methods#2', 'strength-methods#3'],
  'session_generation_power': ['strength-methods#4', 'energy-systems#4'],
  'post_match_advice': ['recovery#3', 'nutrition#3.2'],
  'injury_alert': ['injury-prevention#10', 'injury-prevention#7'],
  'nutrition_match_day': ['nutrition#3.2', 'nutrition#4'],
  'sleep_advice': ['recovery#2'],
  'supplement_question': ['nutrition#6'],
  'vo2max_conditioning': ['energy-systems#3', 'energy-systems#4'],
}

// Prompt type
const buildPrompt = (situation: string, playerProfile: Profile) => `
Tu es un préparateur physique spécialisé en rugby à XV.
Profil du joueur : ${JSON.stringify(playerProfile)}
Contexte : ${situation}

DONNÉES SCIENTIFIQUES DE RÉFÉRENCE :
${getKBSections(KB_SECTIONS[situation])}

En te basant UNIQUEMENT sur ces données, réponds en français de manière
claire et adaptée à un joueur amateur. Vulgarise sans perdre la précision.
`
```

### Règles d'Injection

1. **Ne jamais injecter toute la KB** en une fois (> 100k tokens, coût élevé)
2. **Sélectionner 1-3 sections** maximum par requête selon la situation
3. **Toujours inclure le profil utilisateur** (poste, semaine de cycle, fatigue)
4. **Les recommandations de sécurité** (commotion, douleurs, surcharge) doivent
   toujours injecter `injury-prevention#10` en plus du contexte principal

---

## Fiabilité des Sources

### Ce qui est garanti
- Tous les chercheurs, journaux et thèmes cités correspondent à de vraies
  publications dans les domaines concernés.
- Les directions des effets (positif/négatif, plus/moins) sont fiables.
- Les protocoles officiels (World Rugby, ISSN, ACSM) sont vérifiables publiquement.

### Ce qui mérite vérification avant usage commercial
- Numéros de volume/page/année exacts : ±1 an possible sur certaines références
- Valeurs statistiques très précises : vérifier les 10-15 statistiques
  critiques sur PubMed avant production
- Commandes de vérification rapide :
  ```
  # Sur PubMed (gratuit)
  Site : pubmed.ncbi.nlm.nih.gov
  Recherche : "[Auteur] [mot-clé] [année]"
  Exemple : "van der Horst nordic hamstring 2015"
  ```

### Priorité de vérification (par ordre de criticité sécurité)
1. Protocole commotion cérébrale — `injury-prevention.md#7` (World Rugby officiel ✓)
2. ACWR zones de risque — `injury-prevention.md#3` (Hulin et al. 2016 ✓)
3. Protocole NHE — `injury-prevention.md#5.2` (van der Horst 2015 ✓)
4. Fenêtre de récupération post-commotion — `injury-prevention.md#7.3`
5. Seuils supplémentation (créatine, caféine) — `nutrition.md#6`

---

## Comment Enrichir la KB

### 1. Mise à Jour Manuelle (Nouvelle Étude)

Ajouter une étude dans la section concernée en respectant le format :

```markdown
**[Auteur A] & [Auteur B]** ([année]). [Titre court ou finding clé].
*[Nom du journal]*, [volume]([numéro]), [pages].
```

Mettre à jour la date et le numéro de version en bas du fichier concerné :
```
*Dernière mise à jour : AAAA-MM-JJ | Version : X.Y.Z*
```

### 2. PubMed API (Automatisation Future)

Script à développer pour enrichissement automatique :

```bash
# Exemple de requête PubMed API (NCBI E-utilities — gratuit)
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi\
?db=pubmed&term=rugby+union+injury+prevention&retmax=10&sort=date\
&api_key=YOUR_KEY" > results.xml

# Parser les abstracts et formater en markdown
# → Ajouter dans src/knowledge/research/AAAA-MM-topic.md
```

### 3. Observations Terrain (field-notes.md)

Créer `src/knowledge/field-notes.md` pour noter ce qui fonctionne en pratique
mais n'est pas encore dans la littérature formelle. Format libre.

### 4. Dossier research/ (Articles Indexés)

Pour les articles complets (open access via PubMed Central) :
```
src/knowledge/research/
  2024-concurrent-training-rugby.md
  2025-sleep-extension-contact-sport.md
  ...
```

---

## Sujets Non Encore Couverts (Roadmap)

| Sujet | Priorité | Notes |
|---|---|---|
| Psychologie de la performance | Haute | Cohésion d'équipe, gestion de la pression, préparation mentale |
| Gestion des charges en double semaine (match + match) | Haute | Très pertinent fin de saison |
| Femmes joueuses de rugby | Moyenne | Hormones, cycle menstruel, RED-S spécifique |
| Joueur de moins de 18 ans | Moyenne | Spécificités de la croissance, charges adaptées |
| Retour blessure longue durée (LCA, etc.) | Haute | Protocoles complets de rééducation |
| Prévention des commotions à long terme | Haute | CTE, recherche émergente 2023-2025 |
| Thermorégulation (chaleur, humidité) | Basse | Matchs en conditions extrêmes |

---

## Contexte Utilisateur Cible

- **Profil** : joueur amateur, club fédéral FFR, 2-3 séances S&C/semaine
- **Saison** : calendrier FFR/Fédérale, septembre → mai
- **Niveau** : intermédiaire (1-5 ans de pratique S&C structurée)
- **Langue app** : français
- **Priorité** : sécurité > performance > convivialité

---

*KB initialisée le 2026-02-24 par RugbyPrep V2.*
*Révision recommandée : à chaque nouvelle méta-analyse majeure sur le rugby ou
 mise à jour des guidelines officielles (World Rugby, ISSN, ACSM).*
