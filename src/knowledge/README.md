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

| Fichier | Domaine | Taille approx. | Statut |
|---|---|---|---|
| `periodization.md` | Périodisation, cycles, saison française | 534 lignes | Canonique |
| `strength-methods.md` | Force-vitesse, contraste, PAP, plyométrie | 854 lignes | Canonique |
| `recovery.md` | Sommeil, CWI, HRV, récupération post-match | 677 lignes | Canonique |
| `nutrition.md` | Macros, timing, match day, supplémentation | 887 lignes | Canonique |
| `injury-prevention.md` | ACWR, prehab, prévention, commotion | 804 lignes | Canonique |
| `energy-systems.md` | Filières, HIIT, concurrent training, RSA | 596 lignes | Canonique |
| `athletic-testing.md` | CMJ, sprint, YYIR1, 1RM estimé, baselines | 423 lignes | Canonique |
| `team-monitoring.md` | Monitoring collectif, rotation, alertes charge | 453 lignes | Canonique |
| `load-budgeting.md` | Budgets de volume et adaptation de charge | 122 lignes | Opérationnel |
| `return-to-play-criteria.md` | Critères d’entrée/sortie par phase de réhab | 122 lignes | Opérationnel |
| `medical-red-flags.md` | Drapeaux rouges, stop rules, renvoi médical | 123 lignes | Opérationnel |
| `double-match-weeks.md` | Gestion d’une double semaine de match | 168 lignes | Opérationnel |
| `off-season-periodization.md` | Logique off-season et reconstruction | 210 lignes | Opérationnel |
| `evidence-register.md` | Registre des seuils et sources “dures” | 107 lignes | Opérationnel |
| `beginner-programming.md` | Principes de programmation starter | 242 lignes | Complémentaire |
| `beginner-intermediate-training.md` | Progressions starter/builder et supersets | 538 lignes | Complémentaire |
| `population-specific.md` | Femmes, U18, masters, profils particuliers | 152 lignes | Complémentaire |

**Total actuel : ~7 000+ lignes de KB.**

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
| **Durée flexible des blocs** (3/4/5-6 sem) | Moyenne | KB periodization.md : 3 sem (avancés/compétitif), 4 sem (standard), 5-6 sem (débutants/off-season). Actuellement fixé à 4 sem. Adapter programPhases, buildWeekProgram, profil. |
| Psychologie de la performance | Haute | Cohésion d'équipe, gestion de la pression, préparation mentale |
| Joueuses de rugby (document dédié) | Haute | Le sujet n’est aujourd’hui couvert qu’en partie via `population-specific.md` |
| Femmes joueuses de rugby | Moyenne | Hormones, cycle menstruel, RED-S spécifique |
| Joueur de moins de 18 ans | Moyenne | Spécificités de la croissance, charges adaptées |
| Retour blessure longue durée (LCA, etc.) | Haute | Protocoles complets de rééducation |
| Prévention des commotions à long terme | Haute | CTE, recherche émergente 2023-2025 |
| Thermorégulation (chaleur, humidité) | Basse | Matchs en conditions extrêmes |
| Voyages / fatigue de déplacement | Moyenne | Déplacements, sommeil, récupération |
| Index de retrieval par use-case | Haute | Mapper précisément les sections KB aux cas d’usage IA |

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
