/**
 * SYNC — Ce fichier est une traduction manuelle des mother sessions markdown.
 * Il doit être mis à jour à chaque modification des sessions sources dans docs/training/mother-sessions/.
 * Si une session est ajoutée ou modifiée, vérifier que le contenu FR correspond toujours.
 *
 * Couverture V1 : 10 sessions in-season + recovery.
 * Les sessions non traduites utilisent maintenant un fallback FR généré à partir du contenu source
 * pour éviter les écrans mixtes FR/EN dans l'app.
 */

import { getExerciseName } from '../../data/exercises'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { MotherSession } from '../../types/motherSession'
import { resolveExerciseId } from './motherSessionExerciseMap'

export interface SessionContentFr {
  goals: string[]
  sessionIdentity: string[]
  warmUpExercises: Array<{ name: string; prescription?: string }>
  warmUpNotes: string[]
  blocks: Array<{
    name: string
    format: string
    exercises: Array<{ name: string; prescription?: string }>
    coachingNotes: string[]
    fallbackOptions?: string[]
  }>
  progressionRules: string[]
  positionAccent: string[]
  coachingWarnings: string[]
}

const SESSION_CONTENT_FR: Record<string, SessionContentFr> = {

  // ---------------------------------------------------------------------------
  // 1. FULL_OFFSEASON_RECOVERY_A_V1 — 3 blocs
  // ---------------------------------------------------------------------------
  FULL_OFFSEASON_RECOVERY_A_V1: {
    goals: [
      'Réintroduire un entraînement full-body après la saison sans pression de performance.',
      'Répéter les cinq patterns de base à faible coût : squat, hinge, push, pull, tronc.',
      'Le joueur doit repartir en se sentant mieux, plus mobile et plus confiant qu\'à son arrivée.',
    ],
    sessionIdentity: [
      'Ceci est une session de reprise post-saison, pas une session de force ni un jour d\'hypertrophie.',
      'Spécifique au rugby par la restauration simple des patterns full-body et l\'attention portée au tronc, aux adducteurs et à la qualité de mouvement.',
      'Ne pas transformer cette session en circuit de conditionnement, en session de congestion ou en session de performance déguisée.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'adductor rock-back', prescription: '1x8/côté' },
      { name: 'scap push-up', prescription: '1x8' },
      { name: '1 tour de montée en charge très léger', prescription: '' },
      { name: 'Goblet Squat', prescription: '' },
      { name: 'DB Romanian Deadlift', prescription: '' },
    ],
    warmUpNotes: [
      'Garder l\'échauffement à `3-5 min` maximum.',
      'Les premières répétitions du Bloc 1 doivent encore faire partie du processus de reprise.',
      'Le joueur peut garder son propre échauffement court s\'il couvre chevilles, adducteurs, tronc et épaules.',
    ],
    blocks: [
      {
        name: 'Reprise Squat / Hinge',
        format: '3 tours, `60-90s` de repos après la paire',
        exercises: [
          { name: 'Goblet Squat', prescription: '3x8' },
          { name: 'DB Romanian Deadlift', prescription: '3x8' },
        ],
        coachingNotes: [
          'Garder les deux mouvements autour de `RPE 4-5`.',
          'L\'objectif est de restaurer le rythme, la position et la confiance sous charge légère.',
          '`Goblet Squat` doit rester droit et contrôlé, sans forcer.',
          'Le hinge doit être propre et simple, pas un test de chaîne postérieure.',
        ],
        fallbackOptions: [
          'A : `Box-Assisted Goblet Squat`',
          'B : `Glute Bridge`',
        ],
      },
      {
        name: 'Reprise Push / Pull',
        format: '3 tours, `60-90s` de repos après la paire',
        exercises: [
          { name: 'DB Bench Press', prescription: '3x8-10' },
          { name: 'Inverted Row', prescription: '3x8-10' },
        ],
        coachingNotes: [
          'Garder les deux mouvements autour de `RPE 4-5`.',
          'Laisser l\'épaule trouver un chemin confortable sur le `DB Bench Press`.',
          'Le tirage doit réveiller le contrôle scapulaire et le rythme de traction, pas créer de fatigue.',
          'Si le joueur est déconditionné ou sensible de l\'épaule, passer immédiatement à l\'alternative plus facile.',
        ],
        fallbackOptions: [
          'A : `Push-Up`',
          'B : `Cable Row`',
        ],
      },
      {
        name: 'Tronc / Mobilité / Reset Tissulaire',
        format: '2 tours, enchaîner en continu avec repos minimal',
        exercises: [
          { name: 'Dead Bug', prescription: '2x8/côté' },
          { name: 'Adductor Rock-Back', prescription: '2x8/côté' },
          { name: 'World\'s Greatest Stretch', prescription: '2x4/côté' },
        ],
        coachingNotes: [
          'Ce bloc est en partie reset du tronc, en partie réintroduction des adducteurs, en partie mobilité globale.',
          'Bouger avec fluidité et respirer normalement.',
          'Rien ici ne doit sembler intense.',
          'Le joueur doit finir ce bloc en se sentant plus ouvert, pas plus fatigué.',
        ],
      },
    ],
    progressionRules: [
      '`S1` : utiliser des charges conservatrices et s\'arrêter bien avant que l\'effort devienne significatif.',
      '`S2` : augmenter la charge légèrement uniquement si toutes les répétitions sont propres, confortables et sans symptôme.',
      'Progresser en confort et amplitude de mouvement avant de progresser en charge.',
      'Si le joueur se sent fatigué ce jour-là, réduire la charge d\'abord, puis un tour du Bloc 1 ou Bloc 2, celui qui semble le plus lourd.',
      'Ne pas ajouter de blocs supplémentaires à cette session en phase de récupération.',
    ],
    positionAccent: [
      'Cette session est volontairement commune.',
      'Accent premières lignes :',
      'un peu plus de conscience du gainage sur squat et bench',
      'pas de travail cervical en phase de récupération',
      'Accent trois-quarts arrière :',
      'un peu plus de fluidité et d\'amplitude sur hinge et tirage',
      'pas de travail de vitesse ou pliométrique encore',
      'Le squelette reste identique pour les deux groupes.',
    ],
    coachingWarnings: [
      'Cette session ne doit jamais donner l\'impression de "se remettre en forme en un jour".',
      'Ne pas chercher les courbatures, la congestion ou la charge.',
      'Garder tous les mouvements assez simples pour que le joueur puisse s\'y installer sereinement.',
      'Si le joueur repart en se sentant lourd ou vidé, la session était trop agressive.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. FULL_OFFSEASON_RECOVERY_B_V1 — 3 blocs
  // ---------------------------------------------------------------------------
  FULL_OFFSEASON_RECOVERY_B_V1: {
    goals: [
      'Offrir au joueur une deuxième session de récupération qui soit plus légère, plus libre et légèrement plus athlétique que la Recovery A.',
      'Restaurer la tolérance au mouvement unilatéral, à la locomotion légère, au push/pull de base, et au support jambes/adducteurs.',
      'Maintenir la dynamique d\'entraînement sans créer de fatigue ni donner l\'impression que la saison a déjà repris.',
    ],
    sessionIdentity: [
      'Ceci est une session de reset post-saison, pas un jour de conditionnement déguisé ni une session d\'hypertrophie réduite.',
      'Spécifique au rugby par le mouvement unilatéral simple, la locomotion légère, le contrôle du tronc, le soin des adducteurs et le support des jambes.',
      'Ne pas surcharger cette session avec des objectifs de force, de longs circuits ou de la complexité « fonctionnelle ».',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: '90/90 hip switch', prescription: '1x6/côté' },
      { name: 'scap push-up', prescription: '1x8' },
      { name: '1 tour de préparation facile', prescription: '' },
      { name: 'Reverse Lunge', prescription: '' },
      { name: 'Incline Push-Up', prescription: '' },
    ],
    warmUpNotes: [
      'Garder l\'échauffement à `3-5 min` maximum.',
      'La session doit commencer comme un travail de mouvement, pas une préparation à du lourd.',
      'Le joueur peut garder son propre échauffement court s\'il couvre hanches, épaules et chevilles.',
    ],
    blocks: [
      {
        name: 'Reset Unilatéral / Locomotion',
        format: '2-3 tours, `60-75s` de repos après la paire',
        exercises: [
          { name: 'Reverse Lunge', prescription: '2-3x6/côté' },
          { name: 'Bear Crawl', prescription: '2-3x10-15m' },
        ],
        coachingNotes: [
          'Garder les deux exercices fluides et contrôlés.',
          'La fente doit restaurer le rythme, l\'équilibre et la tolérance de la hanche, pas challenger la force.',
          'Le crawl doit être coordonné et athlétique, jamais précipité.',
          'Arrêter le tour avant qu\'il commence à ressembler à du conditionnement.',
        ],
        fallbackOptions: [
          'A : `Split Squat` au poids du corps',
          'B : `Bird Dog`',
        ],
      },
      {
        name: 'Reset Push / Pull',
        format: '2-3 tours, `60-90s` de repos après la paire',
        exercises: [
          { name: 'Incline Push-Up', prescription: '2-3x8-10' },
          { name: 'Half-Kneeling Cable Row', prescription: '2-3x8/côté' },
        ],
        coachingNotes: [
          'Garder les pompes assez faciles pour que chaque répétition soit identique.',
          'Le tirage doit restaurer le rythme scapulaire et la position du tronc, pas créer de fatigue.',
          'La position à genoux est utilisée ici pour garder le bloc ancré et coordonné.',
        ],
        fallbackOptions: [
          'A : `Push-Up` sur surface surélevée',
          'B : `Seated Cable Row`',
        ],
      },
      {
        name: 'Jambes · Adducteurs · Tronc',
        format: '',
        exercises: [
          { name: 'Single-Leg Calf Raise', prescription: '2x10/côté' },
          { name: 'Wall Tibialis Raise', prescription: '2x12' },
          { name: 'Side Plank', prescription: '2x20s/côté' },
          { name: 'Supine Adductor Squeeze', prescription: '2x20s' },
        ],
        coachingNotes: [
          'Ce bloc restaure la raideur de la cheville, le contrôle du tronc et la tolérance douce des adducteurs.',
          'Garder tout propre et sous-maximal.',
          'Le travail d\'adducteurs doit être une réintroduction, pas une contrainte.',
          'Enchaîner `Calf Raise + Tibialis Raise` d\'abord, puis `Side Plank + Adductor Squeeze`.',
          'Le joueur doit finir ce bloc en se sentant reconstruit, pas challengé.',
        ],
      },
    ],
    progressionRules: [
      '`S1` : garder le volume en bas de fourchette si le joueur se sent encore lourd de la saison.',
      '`S2` : passer de 2 à 3 tours uniquement si la session entière était facile et propre.',
      'Réduire la difficulté des exercices avant d\'ajouter de la charge.',
      'Si le joueur se sent fatigué ce jour-là, garder tous les blocs à 2 tours.',
      'Ne pas ajouter de finishers ou de conditionnement à cette session en phase de récupération.',
    ],
    positionAccent: [
      'Cette session est volontairement commune.',
      'Accent premières lignes :',
      'un peu plus de contrôle et de gainage sur les fentes et crawls',
      'pas de travail cervical en phase de récupération',
      'Accent trois-quarts arrière :',
      'un peu plus de fluidité et d\'amplitude sur fentes, mollets et rythme du crawl',
      'pas de progression de vitesse ou pliométrique encore',
      'Le squelette reste identique pour les deux groupes.',
    ],
    coachingWarnings: [
      'Cette session doit être restauratrice et légèrement athlétique, pas exigeante.',
      'Ne pas laisser le crawl devenir un challenge de conditionnement.',
      'Ne pas forcer le travail d\'adducteurs ou de mollets si les tissus sont encore irritables après la saison.',
      'Si le joueur repart plus fatigué que mobile, la session était trop ambitieuse.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. LOWER_IN_SEASON_FRONT_ROW_V1 — 3 blocs
  // ---------------------------------------------------------------------------
  LOWER_IN_SEASON_FRONT_ROW_V1: {
    goals: [
      'Maintenir la force du bas du corps utile pour la mêlée, le contact et les actions de force courte.',
      'Garder une exposition claire force -> puissance du bas du corps sans créer de fatigue excessive.',
      'Maintenir la force de la chaîne postérieure et le contrôle unilatéral.',
      'Finir avec un travail de tronc/carry/adducteurs spécifique premières lignes pour la robustesse au contact.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par un contraste lower lisible, un travail solide hinge/gainage, et un finisher premières lignes.',
      'Spécifique premières lignes par l\'expression de force, la raideur du tronc, la robustesse des adducteurs et la demande de portage plutôt que de vitesse.',
      'Ne pas diluer cette session avec trop de volume pliométrique ou de travail d\'accessoire type bodybuilding.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'adductor rock-back', prescription: '1x8/côté' },
      { name: 'glute bridge', prescription: '1x8' },
      { name: 'bodyweight squat', prescription: '1x8' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Le joueur peut garder son propre échauffement lower s\'il prépare chevilles, hanches, adducteurs et tronc.',
      'Garder ça court et ciblé.',
      'L\'objectif est la disponibilité, pas le volume.',
    ],
    blocks: [
      {
        name: 'Contraste Lower Force-Puissance',
        format: '4 tours, repos complet `3 min` après chaque tour',
        exercises: [
          { name: 'Box Squat', prescription: '4x3 @ 80-85%' },
          { name: 'Broad Jump', prescription: '3 reps' },
        ],
        coachingNotes: [
          'Le `Box Squat` doit rester rapide et techniquement propre.',
          'Pas de répétitions laborieuses.',
          'Les `Broad Jump` doivent être puissants et nets, jamais bâclés.',
          'Utiliser le box pour standardiser la profondeur et renforcer la production de force depuis une position stable.',
          'Ceci est un contraste force -> projection, pas un bloc de fatigue.',
        ],
      },
      {
        name: 'Force Lower',
        format: '3 tours, `90-120s` de repos après la paire',
        exercises: [
          { name: 'Barbell Romanian Deadlift', prescription: '3x5-6' },
          { name: 'Rear-Foot Elevated Split Squat or Reverse Lunge', prescription: '3x5/côté' },
        ],
        coachingNotes: [
          'Le `RDL` reste strict, gainé et dominé par la chaîne postérieure.',
          'Le pattern unilatéral maintient le contrôle de la hanche et de l\'aine sans transformer la session en jour de volume quadriceps.',
          'Ce bloc doit sembler fort et utile, pas épuisant.',
        ],
      },
      {
        name: 'Finisher Premières Lignes',
        format: '`EMOM 8\'`',
        exercises: [
          { name: 'Sled Push', prescription: '15-20m' },
          { name: 'Copenhagen Plank', prescription: '15-20s/côté' },
        ],
        coachingNotes: [
          'Le `Sled Push` renforce la force horizontale, le gainage et la projection type mêlée sans ajouter beaucoup de fatigue excentrique.',
          'Le `Copenhagen Plank` donne une exposition utile adducteurs/tronc pour les demandes de mêlée et de contact.',
          'Ce bloc doit sembler robuste, pas épuisant.',
          'Si pas de sled disponible, remplacer par `Zercher Carry` ou `Farmer Carry` sur `20m`.',
        ],
      },
    ],
    progressionRules: [
      'Prioriser la vitesse de barre et la qualité de position plutôt que les sauts de charge.',
      'Le squat peut progresser de `+2.5 à +5 kg` uniquement si toutes les séries restent nettes.',
      'La hauteur du box doit rester constante avant de progresser en charge.',
      'Le `RDL` et le travail unilatéral progressent graduellement en gardant `RIR 2-3`.',
      'Si la fatigue de la semaine est élevée :',
      'réduire le Bloc 3 en premier',
      'puis retirer un tour du Bloc 2',
      'garder le Bloc 1 comme exposition qualité clé si le joueur est encore assez frais',
    ],
    positionAccent: [
      'Le squelette lower commun sera partagé avec les autres postes.',
      'L\'accent premières lignes vient de :',
      'un biais de force légèrement plus élevé',
      'plus d\'emphase sur le tronc/gainage',
      'robustesse adducteurs/contact',
      'moins de biais vitesse-réactif que les trois-quarts arrière',
    ],
    coachingWarnings: [
      'Ne pas laisser le `Box Squat` devenir du travail de survie lent.',
      'Ne pas chercher la distance du `Broad Jump` une fois que la qualité de décollage baisse.',
      'Ne pas laisser le `RDL` devenir un exercice de bas du dos.',
      'Garder le finisher ciblé et contrôlé.',
      'Le `Sled Push` doit rester net et puissant ; si la vitesse s\'effondre, la charge est trop lourde.',
      'En semaine de match, placer cette session assez tôt pour récupérer pleinement avant le weekend.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. LOWER_IN_SEASON_BACK_THREE_V1 — 3 blocs
  // ---------------------------------------------------------------------------
  LOWER_IN_SEASON_BACK_THREE_V1: {
    goals: [
      'Maintenir la force du bas du corps utile pour l\'accélération, le support de vitesse et le contact en terrain ouvert.',
      'Garder une exposition claire force -> projection du bas du corps sans créer de fatigue résiduelle lourde.',
      'Maintenir la force de la chaîne postérieure et le contrôle unilatéral.',
      'Finir avec un bloc athlétique court qui soutient la raideur, le contrôle du tronc et les qualités d\'accélération.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par un contraste lower lisible, un travail solide de chaîne postérieure, un contrôle unilatéral, et un finisher court de transfert terrain.',
      'Spécifique trois-quarts arrière par un biais vitesse légèrement plus marqué, plus d\'emphase unilatérale, et moins d\'emphase de gainage au contact que les premières lignes.',
      'Ne pas diluer cette session avec trop de volume, trop de sauts, ou du travail de force lent et laborieux.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'adductor rock-back', prescription: '1x8/côté' },
      { name: 'low pogo hops', prescription: '1x10' },
      { name: 'single-leg glute bridge', prescription: '1x6/côté' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Le joueur peut garder son propre échauffement lower s\'il prépare chevilles, hanches et chaîne postérieure.',
      'Garder ça court et ciblé.',
      'L\'objectif est la disponibilité et la raideur, pas la fatigue.',
    ],
    blocks: [
      {
        name: 'Contraste Lower Vitesse-Projection',
        format: '4 tours, repos complet `2 min 30 à 3 min` après chaque tour',
        exercises: [
          { name: 'Trap Bar Deadlift', prescription: '4x3 @ 75-80%' },
          { name: 'Broad Jump', prescription: '3 reps' },
        ],
        coachingNotes: [
          'Les répétitions de `Trap Bar` doivent rester nettes et techniquement propres.',
          'Pas de répétitions laborieuses.',
          'Les `Broad Jump` doivent être puissants et nets, pas poussés une fois que la qualité baisse.',
          'Ceci est un contraste force -> projection avec un profil légèrement plus rapide que la version premières lignes.',
        ],
      },
      {
        name: 'Chaîne post. & Unilatéral',
        format: '3 tours, `75-90s` de repos après la paire',
        exercises: [
          { name: 'Barbell Hip Thrust', prescription: '3x5-6' },
          { name: 'Rear-Foot Elevated Split Squat or Reverse Lunge', prescription: '3x5/côté' },
        ],
        coachingNotes: [
          'Le `Hip Thrust` reste puissant et propre, avec un verrouillage dur et pas d\'hyperextension lombaire.',
          'Le pattern unilatéral soutient la mécanique de sprint, l\'application de force et la robustesse en changement de direction.',
          'En format `2x/semaine`, le contraste trap bar reste l\'exposition hinge principale de la semaine, donc garder le Bloc 1 net avant de chercher plus de volume support ici.',
          'Ce bloc doit sembler athlétique et utile, pas comme un jour lower lourd type bodybuilding.',
        ],
      },
      {
        name: 'Finisher Trois-Quarts Arrière',
        format: '`EMOM 8\'`',
        exercises: [
          { name: 'Light Sled Push', prescription: '15-20m' },
          { name: 'Copenhagen Hold', prescription: '15-20s/côté' },
        ],
        coachingNotes: [
          'La charge du sled doit rester assez légère pour préserver la vitesse et la posture.',
          'Le `Copenhagen` doit renforcer les adducteurs, le contrôle du tronc et la robustesse en changement de direction sans devenir un concours de fatigue.',
          'Si la charge d\'adducteurs est déjà élevée cette semaine, remplacer par `Pallof Hold` ou `Side Plank`.',
          'Si pas de sled disponible, remplacer par `Suitcase Carry` `20m/côté`.',
        ],
      },
    ],
    progressionRules: [
      'Prioriser la vitesse de mouvement et la qualité de projection plutôt que les sauts de charge.',
      'La `Trap Bar` peut progresser de `+2.5 à +5 kg` uniquement si toutes les séries restent nettes.',
      'Le `Hip Thrust` et le travail unilatéral progressent graduellement en gardant `RIR 2-3`.',
      'Si la fatigue de la semaine est élevée :',
      'réduire le Bloc 3 en premier',
      'puis retirer un tour du Bloc 2',
      'garder le Bloc 1 si le joueur bouge encore de façon explosive',
    ],
    positionAccent: [
      'Le squelette lower commun reste partagé avec la session lower premières lignes.',
      'L\'accent trois-quarts arrière vient de :',
      'un profil de force légèrement plus rapide',
      'plus d\'emphase unilatérale et chaîne postérieure',
      'un travail de projection horizontale plus léger',
      'moins de biais collision/gainage que les premières lignes',
    ],
    coachingWarnings: [
      'Ne pas laisser le `Trap Bar Deadlift` devenir du travail de survie lent.',
      'Ne pas chercher la distance du `Broad Jump` une fois que la qualité de décollage baisse.',
      'Ne pas laisser le `Hip Thrust` devenir de l\'hyperextension lombaire.',
      'Garder le sled assez rapide pour rester athlétique.',
      'En semaine de match, placer cette session assez tôt pour récupérer pleinement avant le weekend.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. UPPER_IN_SEASON_FRONT_ROW_V1 — 4 blocs
  // ---------------------------------------------------------------------------
  UPPER_IN_SEASON_FRONT_ROW_V1: {
    goals: [
      'Maintenir la force du haut du corps utile pour le contact.',
      'Garder une exposition claire force -> vitesse sur le poussé horizontal.',
      'Maintenir un tirage horizontal solide et une demande de tronc/gainage.',
      'Finir avec une signature premières lignes : portage plus travail cervical contrôlé.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par un contraste upper lisible, un tirage horizontal solide, et une robustesse au contact premières lignes.',
      'Spécifique premières lignes par le gainage, le portage et les isométriques cervicaux plutôt que du travail upper orienté vitesse.',
      'Ne pas diluer cette session avec du fluff de bras, de multiples blocs explosifs, ou du remplissage style réhab pour des joueurs sains.',
    ],
    warmUpExercises: [
      { name: 'thoracic rotation', prescription: '1x8/côté' },
      { name: 'scap push-up', prescription: '1x8-10' },
      { name: 'band pull-apart or TYI light', prescription: '1-2x10' },
      { name: 'bench press', prescription: '2 séries progressives' },
    ],
    warmUpNotes: [
      'Si le joueur a déjà une routine upper fiable, il peut la garder.',
      'Pour les joueurs sensibles de l\'épaule, l\'échauffement est fortement recommandé.',
      'Garder ça court et ciblé ; ça doit préparer la session, pas devenir un entraînement à part.',
    ],
    blocks: [
      {
        name: 'Contraste Upper Push',
        format: '4 tours, repos complet `3 min` après chaque tour',
        exercises: [
          { name: 'Bench Press', prescription: '4x4 @ 80-85%' },
          { name: 'Plyo Push-Up', prescription: '4-5 reps' },
        ],
        coachingNotes: [
          'L\'excentrique du `Bench Press` reste contrôlé pendant `1-2s`.',
          'L\'intention concentrique est maximale.',
          'Pas de répétitions laborieuses.',
          'Les `Plyo Push-Up` s\'arrêtent dès que la hauteur ou la raideur baisse clairement.',
          'Ceci est un bloc de contraste propre, pas un circuit.',
        ],
      },
      {
        name: 'Force Push/Pull',
        format: '3 tours, `90-120s` de repos après la paire',
        exercises: [
          { name: 'Single-Arm Landmine Press', prescription: '3x6/côté' },
          { name: 'Pendlay Row', prescription: '3x5-6' },
        ],
        coachingNotes: [
          'Le `Landmine Press` doit être assez lourd pour exiger la raideur du tronc, mais jamais bâclé.',
          'Le `Pendlay Row` part d\'un arrêt complet à chaque répétition.',
          'Garder le tirage explosif mais techniquement strict.',
          'Ce bloc remplace un format plus hypertrophie pour rester aligné avec les besoins en saison.',
          'Si c\'est la seule session upper de la semaine, envisager de remplacer `Single-Arm Landmine Press` par `Neutral-Grip Pull-Up 3x4-5` pour conserver une exposition de traction verticale.',
        ],
      },
      {
        name: 'Finisher Premières Lignes',
        format: '`EMOM 8\'`',
        exercises: [
          { name: 'Farmer Carry or Zercher Carry', prescription: '20m' },
          { name: 'Neck Isometric', prescription: '15-20s' },
        ],
        coachingNotes: [
          'Le choix du portage dépend du matériel et du confort du joueur.',
          'Alterner les directions de cou entre les tours : flexion, extension, latéral gauche, latéral droit.',
          'Ce bloc doit sembler ciblé et robuste, pas épuisant.',
        ],
      },
      {
        name: 'Micro-Bloc Préhab Épaule',
        format: '1 tour, `20-30s` de repos entre les exercices',
        exercises: [
          { name: 'Band External Rotation', prescription: '10-12 reps' },
          { name: 'Serratus Reach', prescription: '8-10 reps' },
          { name: 'Scap Push-Up', prescription: '8 reps' },
        ],
        coachingNotes: [
          'Optionnel, mais recommandé quand le volume de poussé est élevé ou que le joueur a un historique d\'épaule.',
          'Ceci doit prendre environ `2 min`, pas devenir un bloc d\'accessoire à part.',
        ],
      },
    ],
    progressionRules: [
      'Prioriser la vitesse de barre et la qualité d\'exécution plutôt que les sauts de charge.',
      'Le `Bench Press` peut progresser de `+2.5 kg` uniquement si les quatre séries restent nettes.',
      'Le `Landmine` et le `Pendlay` peuvent progresser graduellement quand le joueur garde `RIR 2-3` avec une mécanique propre.',
      'Si la fatigue est élevée dans la semaine, réduire le volume avant l\'intensité :',
      'Bloc 3 en premier',
      'puis un tour du Bloc 2',
      'garder le Bloc 1 comme exposition qualité clé si possible',
    ],
    positionAccent: [
      'Le squelette commun reste le même que les autres sessions upper en saison.',
      'L\'accent premières lignes vient de :',
      'une demande de gainage plus forte',
      'moins de biais vitesse',
      'plus de robustesse portage/contact',
      'un travail cervical explicite',
    ],
    coachingWarnings: [
      'Ne pas laisser le `Bench Press` devenir un grind juste pour protéger la charge prescrite.',
      'Ne pas laisser le `Plyo Push-Up` devenir du travail de fatigue lent.',
      'Ne pas chercher le volume de `Pendlay Row` avec une position du torse bâclée.',
      'Garder le finisher ciblé, pas écrasant.',
      'Placer cette session assez tôt dans la semaine pour récupérer avant les exigences du match.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. UPPER_IN_SEASON_BACK_THREE_V1 — 3 blocs
  // ---------------------------------------------------------------------------
  UPPER_IN_SEASON_BACK_THREE_V1: {
    goals: [
      'Maintenir la force du haut du corps sans créer de fatigue inutile.',
      'Garder une exposition claire force -> vitesse du haut du corps.',
      'Maintenir la force de tirage horizontal et le contrôle scapulaire.',
      'Finir avec un travail de tronc et portage qui soutient la vitesse, le contact et la robustesse en terrain ouvert.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par un contraste upper, un bloc solide push/pull de force, et un finisher athlétique court.',
      'Spécifique trois-quarts arrière par une expression de force légèrement plus rapide, moins d\'emphase gainage au contact que les premières lignes, et plus de saveur tronc/portage unilatéral.',
      'Ne pas transformer ceci en jour upper type bodybuilding ou en circuit de réhab.',
    ],
    warmUpExercises: [
      { name: 'thoracic rotation', prescription: '1x8/côté' },
      { name: 'scap push-up', prescription: '1x8-10' },
      { name: 'band pull-apart or TYI light', prescription: '1-2x10' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Si le joueur a déjà un échauffement upper fiable, il peut le garder.',
      'Garder ça court et ciblé.',
      'L\'objectif est la disponibilité, pas la fatigue.',
    ],
    blocks: [
      {
        name: 'Contraste Upper Vitesse-Puissance',
        format: '4 tours, repos complet `2 min 30 à 3 min` après chaque tour',
        exercises: [
          { name: 'Bench Press', prescription: '4x3-4 @ 75-80%' },
          { name: 'Med Ball Chest Pass', prescription: '4-5 reps' },
        ],
        coachingNotes: [
          'Le `Bench Press` reste rapide et techniquement propre.',
          'L\'intention concentrique est maximale.',
          'Pas de répétitions laborieuses.',
          'Le lancer de `Med Ball` doit être net et balistique, pas lourd.',
          'Ceci est un contraste orienté vitesse, pas un cluster de force max.',
        ],
      },
      {
        name: 'Force Push/Pull',
        format: '3 tours, `75-90s` de repos après la paire',
        exercises: [
          { name: 'Single-Arm Landmine Press', prescription: '3x5-6/côté' },
          { name: 'Chest-Supported Row or T-Bar Row', prescription: '3x6' },
        ],
        coachingNotes: [
          'Le `Landmine` reste propre, rapide et contrôlé au niveau du tronc.',
          'Le tirage reste fort sans devenir un combat du bas du dos.',
          'Comparé à la version premières lignes, ce bloc doit sembler un peu plus fluide et un peu moins brut.',
          'Si c\'est la seule session upper de la semaine, envisager de remplacer `Single-Arm Landmine Press` par `Neutral-Grip Pull-Up 3x4-5` pour conserver une exposition de traction verticale.',
        ],
      },
      {
        name: 'Finisher Trois-Quarts Arrière',
        format: '`EMOM 8\'`',
        exercises: [
          { name: 'Suitcase Carry', prescription: '20m/côté' },
          { name: 'Pallof Press Hold or Neck Isometric', prescription: '15-20s' },
        ],
        coachingNotes: [
          'La version par défaut favorise le contrôle du tronc et la raideur unilatérale.',
          'Si plus de robustesse au contact est nécessaire cette semaine, remplacer le `Pallof Hold` par des isométriques cervicaux.',
          'Ce bloc doit renforcer la posture et la stabilité athlétique, pas créer de fatigue résiduelle lourde.',
        ],
      },
    ],
    progressionRules: [
      'Prioriser la vitesse et la qualité plutôt que les sauts de charge.',
      'Le `Bench Press` peut progresser de `+2.5 kg` uniquement si toutes les séries restent nettes.',
      'Le `Landmine` et le tirage progressent graduellement quand la mécanique reste propre et que le joueur garde `RIR 2-3`.',
      'Si la fatigue de la semaine est élevée :',
      'réduire le Bloc 3 en premier',
      'puis retirer un tour du Bloc 2',
      'garder le Bloc 1 si le joueur semble encore assez frais pour bouger de façon explosive',
    ],
    positionAccent: [
      'Le squelette commun reste le même que la session upper premières lignes.',
      'L\'accent trois-quarts arrière vient de :',
      'une charge de poussé légèrement plus basse et une intention de vitesse plus élevée',
      'plus de production upper balistique',
      'plus d\'emphase tronc/portage unilatéral',
      'moins de biais cou/contact que les premières lignes par défaut',
    ],
    coachingWarnings: [
      'Ne pas laisser le `Bench Press` perdre en vitesse.',
      'Ne pas transformer le lancer de `Med Ball` en travail de fatigue.',
      'Ne pas laisser le tirage devenir un exercice de compensation du torse.',
      'Garder le finisher athlétique et net.',
      'Cette session doit laisser le joueur en se sentant activé, pas aplati.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. FULL_BODY_IN_SEASON_FRONT_ROW_V1 — 5 blocs
  // ---------------------------------------------------------------------------
  FULL_BODY_IN_SEASON_FRONT_ROW_V1: {
    goals: [
      'Maintenir la force full-body et le support musculaire utile en semaines sans match.',
      'Garder une identité athlétique claire avec un peu plus de support musculaire que la session primer.',
      'Exposer le joueur à une paire lower power, un bloc push/pull upper de force, un bloc support chaîne postérieure, et un bloc support premières lignes.',
      'Garder la session lisible, utile, et compatible avec la récupération en saison.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par la puissance lower, un travail push/pull solide, le support hinge, et la robustesse au contact premières lignes.',
      'Spécifique premières lignes par un gainage plus fort, un biais horizontal/haut du corps plus lourd, un support adducteurs/cou/contact, et un petit bloc récompense optionnel.',
      'Ne pas transformer ceci en jour d\'accumulation type inter-saison.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'adductor rock-back', prescription: '1x8/côté' },
      { name: 'thoracic rotation', prescription: '1x6/côté' },
      { name: 'scap push-up', prescription: '1x8' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Garder ça court et ciblé.',
      'Le joueur peut garder son propre échauffement full-body s\'il couvre hanches, tronc et disponibilité du haut du corps.',
    ],
    blocks: [
      {
        name: 'Puissance Lower',
        format: '3 tours, repos complet `3 min`',
        exercises: [
          { name: 'Front Squat', prescription: '3x4-5' },
          { name: 'Countermovement Jump', prescription: '3 reps' },
        ],
        coachingNotes: [
          'Le `Front Squat` doit rester net, droit et gainé.',
          'Le saut reste net et explosif.',
          'Ce bloc ouvre la session avec un support de force et une production athlétique, sans dupliquer l\'ouverture du jour lower.',
        ],
        fallbackOptions: [
          'A : `Box Squat`',
          'B : `Broad Jump`',
        ],
      },
      {
        name: 'Force Push/Pull',
        format: '3 tours, `90-120s` de repos après la paire',
        exercises: [
          { name: 'Football Bar Bench Press', prescription: '3x5-6' },
          { name: 'Chest-Supported Row', prescription: '3x6-8' },
        ],
        coachingNotes: [
          'Ceci est le bloc principal de renfo upper.',
          'Garder le poussé fort et le tirage tout aussi solide.',
          'Ce bloc doit sembler robuste et utile, pas bâclé.',
          '`Football Bar Bench Press` = développé couché prise neutre avec football bar / Swiss bar.',
          'Alternative automatique si la barre n\'est pas disponible : `Neutral-Grip DB Bench Press`.',
        ],
        fallbackOptions: [
          'A1 : `Neutral-Grip DB Bench Press`',
          'A2 : `Bench Press`',
          'B : `Landmine Row`',
        ],
      },
      {
        name: 'Chaîne post. & Tronc',
        format: '3 tours, `75-90s` de repos',
        exercises: [
          { name: 'Hex Bar RDL', prescription: '3x6-8' },
          { name: 'Landmine Rotation', prescription: '2-3x6-8/côté' },
        ],
        coachingNotes: [
          'Le mouvement de hinge doit soutenir la robustesse au contact et le support de sprint sans courbatures excessives.',
          'Le travail de rotation doit rester contrôlé et athlétique.',
        ],
        fallbackOptions: [
          'A : `Barbell Hip Thrust`',
          'B : `Ab Wheel`',
        ],
      },
      {
        name: 'Premières lignes',
        format: '2-3 tours, `45-60s` de repos',
        exercises: [
          { name: 'Sled Push', prescription: '15-20m' },
          { name: 'Copenhagen Hold', prescription: '20-30s' },
          { name: 'Neck Isometric', prescription: '15-20s' },
        ],
        coachingNotes: [
          'Ce bloc soutient la force horizontale, la robustesse de l\'aine et la préparation cervicale.',
          'Garder ça utile et contrôlé.',
          'Si le joueur est déjà fatigué, réduire ce bloc en premier.',
        ],
        fallbackOptions: [
          'A : `Farmer Carry` ou `Zercher Carry`',
          'C : `Banded Neck Extension`',
        ],
      },
      {
        name: 'Récompense · Bras',
        format: '2-3 tours, `45-60s` de repos',
        exercises: [
          { name: 'Hammer Curl', prescription: '10-12 reps' },
          { name: 'French Press', prescription: '10-12 reps' },
        ],
        coachingNotes: [
          'Optionnel uniquement.',
          'Ce bloc donne au joueur une petite récompense sans changer l\'identité de la session.',
          'S\'arrêter avant l\'échec et éviter les courbatures du lendemain.',
        ],
        fallbackOptions: [
          'B : `Rope Pressdown` ou `Skull Crusher`',
        ],
      },
    ],
    progressionRules: [
      'Progresser en charge uniquement si la vitesse et l\'exécution restent élevées.',
      'Garder le volume total stable avant d\'ajouter du travail.',
      'Si la fatigue augmente, retirer le Bloc 5 optionnel en premier, puis réduire le Bloc 4, puis retirer un tour du Bloc 3.',
      'En semaines rugby denses, garder la session en bas de la fourchette de durée cible :',
      'sauter le Bloc 5 par défaut',
      'garder le Bloc 4 à 2 tours',
    ],
    positionAccent: [
      'Le squelette full-body commun peut être partagé entre les postes.',
      'L\'accent premières lignes vient de :',
      'la projection lower avec plus de biais force',
      'un support push/pull upper plus fort',
      'la robustesse hinge et tronc',
      'le support adducteurs, cou et contact',
    ],
    coachingWarnings: [
      'Ceci n\'est pas une session de volume type inter-saison.',
      'Ne pas laisser le bloc d\'ouverture power devenir lent ou bruyant.',
      'Ne pas laisser le bloc de support devenir un circuit de conditionnement aléatoire.',
      'Le bloc récompense optionnel doit rester agréable, pas coûteux.',
      'Le joueur doit se sentir robuste et athlétique à la fin.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. FULL_BODY_IN_SEASON_BACK_THREE_V1 — 5 blocs
  // ---------------------------------------------------------------------------
  FULL_BODY_IN_SEASON_BACK_THREE_V1: {
    goals: [
      'Maintenir la force et la puissance full-body en semaines sans match.',
      'Garder une identité athlétique claire avec un peu plus de support musculaire que la session primer.',
      'Exposer le joueur à une paire lower power, un bloc push/pull upper de force, un bloc support chaîne postérieure, et un finish accessoire léger.',
      'Garder la session lisible et transférable au rugby.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par une paire lower power, un travail push/pull utile, un support chaîne postérieure, et une résilience jambes/adducteurs.',
      'Spécifique trois-quarts arrière par le biais vitesse, le contrôle unilatéral, le support chaîne postérieure, et un ressenti renfo légèrement plus agréable en semaines sans match.',
      'Ne pas transformer ceci en jour long d\'accumulation, mais permettre un peu plus de travail musculaire que lors d\'un primer.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'low pogo hops', prescription: '1x10' },
      { name: 'thoracic rotation', prescription: '1x6/côté' },
      { name: 'scap push-up', prescription: '1x8' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Garder ça court et ciblé.',
      'Le joueur peut garder son propre échauffement full-body s\'il couvre cheville, tronc et disponibilité du haut du corps.',
    ],
    blocks: [
      {
        name: 'Puissance Lower',
        format: '3 tours, repos complet `3 min`',
        exercises: [
          { name: 'Back Squat', prescription: '3x2-3 @ 75-80%' },
          { name: 'Countermovement Jump', prescription: '3 reps' },
        ],
        coachingNotes: [
          'Le mouvement lower chargé reste net et techniquement propre.',
          'La vitesse de barre compte plus que la charge ici.',
          'Le saut reste net et explosif.',
          'Ce bloc ouvre la session avec de la force et de la production élastique, sans volume excessif.',
        ],
        fallbackOptions: [
          'A : `Front Squat`',
          'B : `Drop Jump`',
        ],
      },
      {
        name: 'Force Push/Pull',
        format: '3 tours, `90-120s` de repos après la paire',
        exercises: [
          { name: 'DB Incline Bench Press', prescription: '3x6-8' },
          { name: 'Chest-Supported Row', prescription: '3x6-8' },
        ],
        coachingNotes: [
          'Ceci est votre bloc principal de renfo push/pull.',
          'Garder ça fort et propre, pas bâclé.',
          'Ce bloc doit sembler utile et satisfaisant sans transformer en session uniquement upper.',
        ],
        fallbackOptions: [
          'B : `Single-Arm DB Row`',
        ],
      },
      {
        name: 'Chaîne post. & Rotation',
        format: '3 tours, `75-90s` de repos',
        exercises: [
          { name: 'Hex Bar RDL', prescription: '3x6-8' },
          { name: 'Landmine Rotation', prescription: '2-3x6-8/côté' },
        ],
        coachingNotes: [
          'Le mouvement principal doit soutenir la vitesse et la robustesse, pas créer deux jours de courbatures.',
          'Le travail de rotation doit rester net et athlétique.',
        ],
        fallbackOptions: [
          'A : `Barbell Hip Thrust`',
        ],
      },
      {
        name: 'Jambes & Adducteurs',
        format: '2-3 tours, `45-60s` de repos',
        exercises: [
          { name: 'Weighted Calf Raise', prescription: '10-12 reps' },
          { name: 'Tibialis Raise', prescription: '10-12 reps' },
          { name: 'Copenhagen Hold', prescription: '20-30s' },
        ],
        coachingNotes: [
          'Ce bloc soutient la raideur de la cheville, la résilience des jambes et la robustesse de l\'aine.',
          'Garder ça propre et simple.',
          'Si le joueur est déjà fatigué, réduire ce bloc en premier.',
        ],
      },
      {
        name: 'Récompense · Bras',
        format: '2-3 tours, `45-60s` de repos',
        exercises: [
          { name: 'Alternating DB Curl', prescription: '10-12 reps' },
          { name: 'Skull Crusher', prescription: '10-12 reps' },
        ],
        coachingNotes: [
          'Optionnel uniquement.',
          'Ce bloc donne au joueur une petite récompense sans changer l\'identité de la session.',
          'S\'arrêter avant l\'échec et éviter les courbatures du lendemain.',
        ],
        fallbackOptions: [
          'A : `Hammer Curl`',
          'B : `Rope Pressdown`',
        ],
      },
    ],
    progressionRules: [
      'Progresser en charge uniquement si la vitesse et l\'exécution restent élevées.',
      'Garder le volume total stable avant d\'ajouter du travail.',
      'Si la fatigue augmente, retirer le Bloc 5 optionnel en premier, puis réduire le Bloc 4, puis retirer un tour du Bloc 3.',
    ],
    positionAccent: [
      'Le squelette full-body commun peut être partagé entre les postes.',
      'L\'accent trois-quarts arrière vient de :',
      'la puissance lower en premier',
      'la force push/pull upper sans coût SNC élevé',
      'le support chaîne postérieure et cheville',
      'moins d\'emphase totale sur la collision que les premières lignes',
    ],
    coachingWarnings: [
      'Ceci n\'est pas une session de volume type inter-saison.',
      'Ne pas laisser le bloc d\'ouverture power devenir lent ou bruyant.',
      'Ne pas empiler la fatigue lower sans réfléchir si la semaine a déjà de l\'exposition vitesse terrain.',
      'Le bloc bras optionnel doit rester agréable, pas coûteux.',
      'Le joueur doit se sentir athlétique à la fin.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 — 4 blocs
  // ---------------------------------------------------------------------------
  FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1: {
    goals: [
      'Amorcer le système nerveux sans créer de fatigue.',
      'Garder des expositions explosives courtes lower et upper avec un biais force/gainage premières lignes.',
      'Renforcer la posture de contact, la projection et la raideur du haut du corps.',
      'Le joueur doit repartir en se sentant activé et physiquement prêt pour le contact.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par des paires explosives à faible volume, assez de repos, et zéro fatigue parasite.',
      'Spécifique premières lignes par l\'intention de force au box squat, la puissance de poussé horizontal, le tirage upper solide, et le travail optionnel cou/confiance au contact.',
      'Ne pas transformer ceci en session de force, en long échauffement, ou en bloc de conditionnement.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'adductor rock-back', prescription: '1x8/côté' },
      { name: 'thoracic rotation', prescription: '1x6/côté' },
      { name: 'scap push-up', prescription: '1x8' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Garder ça court.',
      'Le joueur peut garder sa propre routine primer s\'elle prépare la position lower, la raideur du tronc et la disponibilité du haut du corps.',
    ],
    blocks: [
      {
        name: 'Neural Lower',
        format: '3 tours, repos complet `2-3 min`',
        exercises: [
          { name: 'Banded Anderson Box Squat', prescription: '3x3 @ ~75-80% + tension élastique' },
          { name: 'Banded KB Swing', prescription: '3x5' },
        ],
        coachingNotes: [
          'Ce bloc est une question d\'intention et de production de force rapide, pas de fatigue.',
          'Chaque répétition doit sembler agressive et nette depuis une position stable.',
          'La charge doit permettre une vitesse concentrique maximale à chaque répétition.',
        ],
        fallbackOptions: [
          'A : `Box Squat`',
          'B : `Broad Jump`',
        ],
      },
      {
        name: 'Amorçage Upper Push',
        format: '3 tours, repos complet `2-3 min`',
        exercises: [
          { name: 'Football Bar Bench Press', prescription: '3x5 @ ~70-75%' },
          { name: 'Supine Med Ball Throw', prescription: '3x3' },
        ],
        coachingNotes: [
          'Le développé reste net et techniquement propre.',
          'Le lancer reste balistique et à faible volume.',
          'Ceci est un vrai primer push de semaine de match, pas un bloc de bench lourd.',
          'Utiliser une charge qui permet une vitesse de barre maximale à chaque répétition.',
          '`Football Bar Bench Press` = développé couché prise neutre avec football bar / Swiss bar.',
          'Alternative automatique si la barre n\'est pas disponible : `Neutral-Grip DB Bench Press`.',
        ],
        fallbackOptions: [
          'A1 : `Neutral-Grip DB Bench Press`',
          'A2 : `Bench Press`',
          'B : `Med Ball Chest Pass`',
        ],
      },
      {
        name: 'Amorçage Pull / Tronc',
        format: '3 tours, repos complet `90-120s`',
        exercises: [
          { name: 'Landmine Row', prescription: '3x6' },
          { name: 'Landmine Rotation', prescription: '3x5/côté' },
        ],
        coachingNotes: [
          'Ce bloc doit sembler fort, coordonné et guidé par la posture.',
          'Garder le tirage propre et le travail de tronc athlétique.',
          'Pas de recherche de fatigue.',
        ],
        fallbackOptions: [
          'A : `Power Pendlay Row`',
          'B : `Med Ball Scoop Throw`',
        ],
      },
      {
        name: 'Confiance Contact / Congestion',
        format: '2 tours, `45-60s` de repos',
        exercises: [
          { name: 'Hammer Curl', prescription: '2x10' },
          { name: 'Rope Pressdown', prescription: '2x10' },
          { name: 'Banded Neck Extension', prescription: '2x10' },
        ],
        coachingNotes: [
          'Optionnel uniquement.',
          'Utiliser quand le joueur aime un petit pump des bras et un peu de confiance cou/contact avant l\'exposition match.',
          'S\'arrêter bien avant l\'échec.',
          'Ce bloc doit créer de la confiance, pas de la fatigue ou des courbatures.',
        ],
        fallbackOptions: [
          'B : `French Press` ou `Band Pressdown`',
          'C : `Neck Isometric`',
        ],
      },
    ],
    progressionRules: [
      'Progresser uniquement si le joueur reste explosif du début à la fin.',
      'Ne pas augmenter le volume en premier ; garder la même petite dose et progresser uniquement quand la qualité est régulièrement élevée.',
      'En vraie semaine de match, il est acceptable de ne garder que deux paires si nécessaire.',
      'Le bloc confiance optionnel n\'est jamais obligatoire et doit être retiré avant de réduire tout travail neural.',
    ],
    positionAccent: [
      'Le squelette full-light primer commun peut être partagé entre les postes.',
      'L\'accent premières lignes vient de :',
      'une intention de force lower plus forte',
      'la puissance de poussé horizontal',
      'un ressenti pull/gainage plus fort',
      'le travail optionnel confiance cou/contact',
    ],
    coachingWarnings: [
      'La qualité du primer baisse vite si le joueur est déjà fatigué.',
      'Ne pas laisser un mouvement chargé devenir un grind.',
      'Ne pas laisser le bloc confiance devenir un finisher bodybuilding.',
      'Le joueur doit repartir en se sentant plus prêt que fatigué.',
    ],
  },

  // ---------------------------------------------------------------------------
  // 10. FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1 — 4 blocs
  // ---------------------------------------------------------------------------
  FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1: {
    goals: [
      'Amorcer le système nerveux sans créer de fatigue.',
      'Garder des expositions explosives courtes lower et upper avec une intention maximale.',
      'Renforcer la raideur, la projection et la préparation rotationnelle pour les actions en terrain ouvert.',
      'Le joueur doit repartir en se sentant affûté, pas fatigué.',
    ],
    sessionIdentity: [
      'Spécifique au rugby par des paires explosives à faible volume, des repos suffisamment longs, et zéro fatigue parasite.',
      'Spécifique trois-quarts arrière par le biais vitesse, la raideur, la projection, et la production balistique du haut du corps.',
      'Ne pas transformer ceci en session de force, en circuit de conditionnement, ou en mini jour full-body.',
    ],
    warmUpExercises: [
      { name: 'ankle rocks', prescription: '1x8/côté' },
      { name: 'low pogo hops', prescription: '1x10' },
      { name: 'thoracic rotation', prescription: '1x6/côté' },
      { name: 'scap push-up', prescription: '1x8' },
      { name: '2 séries de montée en charge progressive', prescription: '' },
    ],
    warmUpNotes: [
      'Garder ça bref.',
      'Le joueur peut garder sa propre routine primer si elle couvre la raideur de la cheville, la position du tronc et la disponibilité du haut du corps.',
    ],
    blocks: [
      {
        name: 'Neural Lower',
        format: '3 tours, repos complet `2-3 min`',
        exercises: [
          { name: 'Trap Bar Deadlift', prescription: '3x2-3 @ ~70-75%' },
          { name: 'Countermovement Jump', prescription: '3 reps' },
        ],
        coachingNotes: [
          'Ce bloc est une question d\'intention et de production de force rapide, pas de fatigue.',
          'Le repos doit être assez long pour garder chaque répétition nette.',
          'La `Trap Bar` doit bouger vite et propre, sans répétitions laborieuses.',
          'Le saut doit rester net et élastique sans créer de stress excentrique excessif avant le jour de match.',
        ],
        fallbackOptions: [
          'A : `Back Squat` `3x3 @ ~70-75%`',
          'B : `Drop to Stick`',
        ],
      },
      {
        name: 'Amorçage Upper Push',
        format: '3 tours, repos complet `2-3 min`',
        exercises: [
          { name: 'Explosive Landmine Press', prescription: '3x5/côté' },
          { name: 'Plyo Push-Up', prescription: '3x3-5' },
        ],
        coachingNotes: [
          'Ce bloc doit sembler agressif et propre.',
          'Le mouvement chargé reste rapide et net.',
          'La variante de pompe s\'arrête dès que la réactivité baisse.',
        ],
        fallbackOptions: [
          'A : `Landmine Jammer`',
          'B : `Depth Push-Up`',
        ],
      },
      {
        name: 'Amorçage Pull / Rotation',
        format: '3 tours, repos complet `90-120s`',
        exercises: [
          { name: 'Landmine Row', prescription: '3x5-6' },
          { name: 'Med Ball Throw', prescription: '2-3 reps/côté' },
        ],
        coachingNotes: [
          'Ce bloc doit rester balistique et coordonné.',
          'Garder le lancer/rotation à faible volume et haute intention.',
          'Pas de recherche de fatigue ici.',
        ],
        fallbackOptions: [
          'A : `Power Pendlay Row`',
          'B : `Med Ball Scoop Throw` ou `Landmine Rotation`',
        ],
      },
      {
        name: 'Congestion · Bras',
        format: '2 tours, `45-60s` de repos',
        exercises: [
          { name: 'Hammer Curl', prescription: '2x10' },
          { name: 'French Press', prescription: '2x10' },
        ],
        coachingNotes: [
          'Optionnel uniquement.',
          'Utiliser quand le joueur apprécie un petit pump des bras avant l\'exposition match et récupère bien.',
          'S\'arrêter bien avant l\'échec.',
          'Ce bloc doit renforcer la confiance, pas créer de courbatures.',
        ],
        fallbackOptions: [
          'B : `Rope Pressdown` ou `Band Pressdown`',
        ],
      },
    ],
    progressionRules: [
      'Progresser uniquement si le joueur reste explosif du début à la fin.',
      'Ne pas augmenter le volume en premier ; garder la même petite dose et progresser uniquement quand la qualité est régulièrement élevée.',
      'En vraie semaine de match, il est acceptable de ne garder que deux paires si nécessaire.',
      'Le bloc bras optionnel n\'est jamais obligatoire et doit être retiré avant de réduire tout travail neural.',
    ],
    positionAccent: [
      'Le squelette full-light primer commun peut être partagé entre les postes.',
      'L\'accent trois-quarts arrière vient de :',
      'la projection et la raideur des membres inférieurs',
      'la vitesse de mouvement',
      'la fatigue totale faible',
      'le travail upper balistique plutôt que l\'emphase brute force au contact',
    ],
    coachingWarnings: [
      'La qualité du primer baisse vite si le joueur est déjà fatigué.',
      'Ne pas laisser un mouvement chargé devenir un grind.',
      'Ne pas transformer la session en challenge de conditionnement.',
      'Ne pas utiliser de pliométrie réactive à haute chute ici juste pour rendre la session plus « avancée ».',
      'Le bloc pump optionnel doit rester psychologiquement utile et physiologiquement peu coûteux.',
      'Le joueur doit quitter la session en se sentant plus activé que fatigué.',
    ],
  },
}

const BLOCK_NAME_FR: Record<string, string> = {
  'Main Lower Force': 'Force principale bas du corps',
  'Main Upper Force': 'Force principale haut du corps',
  'Main Upper Pull': 'Tirage principal haut du corps',
  'Main Full-Body Force': 'Force principale corps complet',
  'Main Full-Body Hinge': 'Hinge principal corps complet',
  'Main Full-Body Hinge Hypertrophy': 'Hypertrophie hinge principal corps complet',
  'Main Hinge / Unilateral Pair': 'Hinge principal / unilatéral',
  'Main Press / Pull Base Pair': 'Base poussée / tirage',
  'Main Upper Pull / Secondary Push Pair': 'Tirage principal / poussée secondaire',
  'Main Squat Hypertrophy': 'Hypertrophie squat principal',
  'Main Upper Push Hypertrophy': 'Hypertrophie poussée principale haut du corps',
  'Hinge + Unilateral Strength Pair': 'Charnière de hanche + force unilatérale',
  'Posterior Chain / Lower Leg Support': 'Chaîne postérieure / support bas de jambe',
  'Posterior Chain / Groin Support': 'Chaîne postérieure / support adducteurs',
  'Posterior Chain / Rotation Support': 'Chaîne postérieure / support rotation',
  'Posterior Chain / Trunk Support': 'Chaîne postérieure / support tronc',
  'Posterior Chain Force Maintenance': 'Maintien de force chaîne postérieure',
  'Position Support Finisher': 'Finisher support poste',
  'Lower Strength Pair': 'Force bas du corps',
  'Lower Power Pair': 'Puissance bas du corps',
  'Lower Neural Pair': 'Neural bas du corps',
  'Lower Support / Trunk Pair': 'Support bas du corps / tronc',
  'Lower-Leg / Groin / Trunk Support': 'Support bas de jambe / adducteurs / tronc',
  'Lower-Leg / Groin Continuity': 'Continuité bas de jambe / adducteurs',
  'Lower-Leg / Optional Reward': 'Bas de jambe / récompense optionnelle',
  'Groin / Lower-Leg Continuity': 'Continuité adducteurs / bas de jambe',
  'Groin / Trunk / Lower-Leg Support': 'Adducteurs / tronc / support bas de jambe',
  'Upper Push/Pull Strength': 'Force poussée / tirage haut du corps',
  'Upper Push/Pull Strength Pair': 'Force poussée / tirage haut du corps',
  'Upper Push/Pull Support Pair': 'Support poussée / tirage haut du corps',
  'Upper Support Strength Pair': 'Support de force haut du corps',
  'Upper Push / Pull Support': 'Support poussée / tirage haut du corps',
  'Upper Power Pair': 'Puissance haut du corps',
  'Upper Ballistic Pair': 'Balistique haut du corps',
  'Upper Ballistic / Explosive Trunk': 'Balistique haut du corps / tronc explosif',
  'Upper Push Primer': 'Primer poussée haut du corps',
  'Pull / Rotation Primer': 'Primer tirage / rotation',
  'Pull / Trunk Primer': 'Primer tirage / tronc',
  'Pull / Posterior Support': 'Tirage / support postérieur',
  'Pull Support Pair': 'Support tirage',
  'Secondary Pull Support': 'Support tirage secondaire',
  'Vertical Support Pair': 'Support vertical',
  'Shoulder / Trunk Support': 'Support épaule / tronc',
  'Arms / Shoulder Support': 'Support bras / épaule',
  'Shoulder Prehab Micro-Block': 'Micro-bloc préhab épaule',
  'Mandatory Shoulder Prehab Micro-Block': 'Micro-bloc préhab épaule obligatoire',
  'Push / Pull Re-Entry': 'Reprise poussée / tirage',
  'Push / Pull Reset': 'Reset poussée / tirage',
  'Squat / Hinge Base Pair': 'Base squat / hinge',
  'Squat / Hinge Re-Entry': 'Reprise squat / hinge',
  'Trunk / Mobility / Tissue Reset': 'Tronc / mobilité / reset tissulaire',
  'Unilateral / Locomotion Reset': 'Unilatéral / locomotion',
  'Contrast Lower Force-Power': 'Contraste force-puissance bas du corps',
  'Contrast Lower Force-Projection': 'Contraste force-projection bas du corps',
  'Contrast Lower Speed-Projection': 'Contraste vitesse-projection bas du corps',
  'Contrast Upper Force-Speed': 'Contraste force-vitesse haut du corps',
  'Contrast Upper Push': 'Contraste poussée haut du corps',
  'Contrast Upper Speed-Power': 'Contraste vitesse-puissance haut du corps',
  'Back Three Power Cluster': 'Cluster puissance ligne arrière',
  'Front Row Power Cluster': 'Cluster puissance avants',
  'Front Row Upper Power Cluster': 'Cluster puissance haut du corps avants',
  'Back Three Upper Power Cluster': 'Cluster puissance haut du corps ligne arrière',
  'Full-Body Force-Projection Pair': 'Force / projection corps complet',
  'Front Row Support': 'Support avants',
  'Front Row Finisher': 'Finisher avants',
  'Back Three Finisher': 'Finisher ligne arrière',
  'Contact Confidence / Pump': 'Confiance contact / pump',
  'Arm Pump / Confidence Block': 'Pump bras / confiance',
  'Arm Pump / Reward Block': 'Pump bras / récompense',
  'Reward Block': 'Bloc récompense',
  'Athletic Finisher': 'Finisher athlétique',
  'Athletic COD Work': 'Travail athlétique de COD',
  'COD / Athletic Change of Direction': 'COD / changements d’appuis athlétiques',
  'Sprint / Acceleration': 'Sprint / accélération',
  'Jumps / Plyometrics': 'Sauts / pliométrie',
  'Structured Plyometric Cluster': 'Cluster pliométrique structuré',
  'Optional Lower-Leg Support': 'Support bas de jambe optionnel',
}

const FORMAT_FR: Record<string, string> = {
  '`1 round`, `20-30s` rest between drills': '`1 tour`, `20-30s` de repos entre les drills',
  '`1-2 rounds`, `20-30s` rest between drills': '`1-2 tours`, `20-30s` de repos entre les drills',
  '`1-2 rounds`, `30-45s` rest': '`1-2 tours`, `30-45s` de repos',
  '`2 drills`, `3-4 reps` each, full rest `60-90s`': '`2 drills`, `3-4 reps` chacune, repos complet `60-90s`',
  '`2 drills`, `3-4 reps` each, full rest `60-90s` between reps': '`2 drills`, `3-4 reps` chacune, repos complet `60-90s` entre les reps',
  '`2 rounds`, `45-60s` rest': '`2 tours`, `45-60s` de repos',
  '`2 rounds`, `60-75s` rest': '`2 tours`, `60-75s` de repos',
  '`2 rounds`, minimal rest': '`2 tours`, repos minimal',
  '`2 rounds`, move continuously with minimal rest': '`2 tours`, enchaîner en continu avec repos minimal',
  '`2 work sets`, `90-120s` rest between sets': '`2 séries de travail`, `90-120s` de repos entre les séries',
  '`2-3 rounds`, `45-60s` rest': '`2-3 tours`, `45-60s` de repos',
  '`2-3 rounds`, `60-75s` rest after the pair': '`2-3 tours`, `60-75s` de repos après la paire',
  '`2-3 rounds`, `60-90s` rest': '`2-3 tours`, `60-90s` de repos',
  '`2-3 rounds`, `60-90s` rest after the pair': '`2-3 tours`, `60-90s` de repos après la paire',
  '`3 rounds`, `60-75s` rest after the pair': '`3 tours`, `60-75s` de repos après la paire',
  '`3 rounds`, `60-90s` rest after the pair': '`3 tours`, `60-90s` de repos après la paire',
  '`3 rounds`, `75-90s` rest': '`3 tours`, `75-90s` de repos',
  '`3 rounds`, `75-90s` rest after the pair': '`3 tours`, `75-90s` de repos après la paire',
  '`3 rounds`, `90-120s` rest': '`3 tours`, `90-120s` de repos',
  '`3 rounds`, `90-120s` rest after the pair': '`3 tours`, `90-120s` de repos après la paire',
  '`3 rounds`, full rest `2-3 min`': '`3 tours`, repos complet `2-3 min`',
  '`3 rounds`, full rest `3 min`': '`3 tours`, repos complet `3 min`',
  '`3 rounds`, full rest `3 min` after each round': '`3 tours`, repos complet `3 min` après chaque tour',
  '`3 rounds`, full rest `90-120s`': '`3 tours`, repos complet `90-120s`',
  '`3 work sets`, `2 min` rest between sets': '`3 séries de travail`, `2 min` de repos entre les séries',
  '`3 work sets`, `2-3 min` rest between sets': '`3 séries de travail`, `2-3 min` de repos entre les séries',
  '`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round': '`4 tours`, `10-15s` entre les exercices, repos complet `3-4 min` après chaque tour',
  '`4 rounds`, `90-120s` rest after the pair': '`4 tours`, `90-120s` de repos après la paire',
  '`4 rounds`, full rest `2 min 30 to 3 min` after each round': '`4 tours`, repos complet `2 min 30 à 3 min` après chaque tour',
  '`4 rounds`, full rest `3 min` after each round': '`4 tours`, repos complet `3 min` après chaque tour',
  '`4 work sets`, `2 min` rest between sets': '`4 séries de travail`, `2 min` de repos entre les séries',
  '`4 work sets`, `2-3 min` rest between sets': '`4 séries de travail`, `2-3 min` de repos entre les séries',
  '`6-8 reps`, walk-back recovery and full rest between reps': '`6-8 reps`, récupération en marchant et repos complet entre les reps',
  "`EMOM 6'`": "`EMOM 6'`",
  "`EMOM 8'`": "`EMOM 8'`",
  "`EMOM 9'`": "`EMOM 9'`",
  '`W5-W6 = 4 rounds`, `W7 = 5 rounds`, `W8 = 4 rounds`, full rest `90-120s` between reps and `2-3 min` between rounds':
    '`W5-W6 = 4 tours`, `W7 = 5 tours`, `W8 = 4 tours`, repos complet `90-120s` entre les reps et `2-3 min` entre les tours',
}

const TEXT_EXACT_FR: Record<string, string> = {
  'The player can keep their own lower-body warm-up if it prepares ankles, hips, adductors, and trunk.':
    'Le joueur peut garder son propre échauffement bas du corps s’il prépare les chevilles, les hanches, les adducteurs et le tronc.',
  'The player can keep their own upper-body warm-up if it prepares shoulders, trunk, scapular control, and pressing rhythm.':
    'Le joueur peut garder son propre échauffement haut du corps s’il prépare les épaules, le tronc, le contrôle scapulaire et le rythme de poussée.',
  'The player can keep their own full-body warm-up if it prepares hips, trunk, shoulders, and the first main pattern.':
    'Le joueur peut garder son propre échauffement full-body s’il prépare les hanches, le tronc, les épaules et le premier pattern principal.',
  'Keep this short and useful.': 'Garder ça court et utile.',
  'The goal is readiness for force production, not early fatigue.':
    'L’objectif est d’être prêt à produire de la force, pas de créer de la fatigue trop tôt.',
  'This block is the anchor of the session.': 'Ce bloc est l’ancrage de la séance.',
  'Reps must stay technically clean with `RIR 1-2`.':
    'Les répétitions doivent rester techniquement propres avec `RIR 1-2`.',
  'No grinding, no collapse at the bottom, no rushed descent.':
    'Pas de grind, pas d’effondrement en bas, pas de descente précipitée.',
  'Pins should reinforce a strong concentric start and a stable bottom position.':
    'Les pins doivent renforcer un départ concentrique fort et une position basse stable.',
  'The goal is force construction, not testing.':
    'L’objectif est de construire la force, pas de tester.',
  'RDL stays strict and posterior-chain dominant.':
    'Le RDL reste strict et dominant chaîne postérieure.',
  'The unilateral lift should support hip and groin control, not become a conditioning block.':
    'Le travail unilatéral doit soutenir le contrôle de hanche et des adducteurs, pas devenir un bloc de conditionnement.',
  'This pair should feel strong and constructive, not draining.':
    'Cette paire doit sembler forte et constructive, pas vidante.',
  'Keep the intent supportive, not maximal.':
    'Garder une intention de support, pas de maximal.',
}

const TEXT_FRAGMENT_FR: Array<[RegExp, string]> = [
  [/\blower-body\b/gi, 'bas du corps'],
  [/\bupper-body\b/gi, 'haut du corps'],
  [/\bfull-body\b/gi, 'corps complet'],
  [/\bfront row\b/gi, 'avants'],
  [/\bback three\b/gi, 'ligne arrière'],
  [/\bpre-season\b/gi, 'pré-saison'],
  [/\boff-season\b/gi, 'hors-saison'],
  [/\bin-season\b/gi, 'en saison'],
  [/\bwarm-up\b/gi, 'échauffement'],
  [/\bsession\b/gi, 'séance'],
  [/\bblock\b/gi, 'bloc'],
  [/\bplayer\b/gi, 'joueur'],
  [/\brounds\b/gi, 'tours'],
  [/\bround\b/gi, 'tour'],
  [/\bwork sets\b/gi, 'séries de travail'],
  [/\bbetween sets\b/gi, 'entre les séries'],
  [/\bbetween reps\b/gi, 'entre les reps'],
  [/\bbetween rounds\b/gi, 'entre les tours'],
  [/\bbetween drills\b/gi, 'entre les drills'],
  [/\bafter each round\b/gi, 'après chaque tour'],
  [/\bafter the pair\b/gi, 'après la paire'],
  [/\bfull rest\b/gi, 'repos complet'],
  [/\bminimal rest\b/gi, 'repos minimal'],
  [/\brest\b/gi, 'repos'],
  [/\bpair\b/gi, 'paire'],
  [/\bkeep\b/gi, 'Garder'],
  [/\breduce\b/gi, 'Réduire'],
  [/\badd\b/gi, 'Ajouter'],
  [/\bonly if\b/gi, 'seulement si'],
  [/\bif\b/gi, 'si'],
  [/\bthis week\b/gi, 'cette semaine'],
  [/\bthis pair\b/gi, 'cette paire'],
  [/\bthis session\b/gi, 'cette séance'],
  [/\bthis block\b/gi, 'ce bloc'],
  [/\bthe goal\b/gi, 'l’objectif'],
  [/\bthe player\b/gi, 'le joueur'],
  [/\bslightly\b/gi, 'légèrement'],
  [/\bheavier\b/gi, 'plus lourd'],
  [/\blighter\b/gi, 'plus léger'],
  [/\bcleaner\b/gi, 'plus propre'],
  [/\bathletic\b/gi, 'athlétique'],
  [/\bfatigue\b/gi, 'fatigue'],
  [/\brecovery\b/gi, 'récupération'],
  [/\bconstruction\b/gi, 'construction'],
  [/\btesting\b/gi, 'test'],
  [/\bforce production\b/gi, 'production de force'],
  [/\bforce construction\b/gi, 'construction de force'],
  [/\bcommon base\b/gi, 'base commune'],
  [/\bcommon terrain base\b/gi, 'base terrain commune'],
  [/\bwith light accents\b/gi, 'avec accents légers'],
  [/\bwith marked accents\b/gi, 'avec accents marqués'],
  [/\bphase 1\b/gi, 'phase 1'],
  [/\bphase 2\b/gi, 'phase 2'],
  [/\b\/side\b/gi, '/côté'],
]

function translateExerciseNameToFr(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed

  if (trimmed.includes(' or ')) {
    return trimmed
      .split(/\s+or\s+/i)
      .map((part) => translateExerciseNameToFr(part))
      .join(' ou ')
  }

  const exerciseId = resolveExerciseId(trimmed)
  if (exerciseId) return getExerciseName(exerciseId, 'fr')

  return trimmed
    .replace(/Rear-Foot Elevated Split Squat/gi, 'Split squat pied arrière surélevé')
    .replace(/Farmer Carry/gi, 'Marche du fermier')
    .replace(/Zercher Carry/gi, 'Carry Zercher')
    .replace(/Front Rack Carry/gi, 'Carry front rack')
    .replace(/Tibialis Raise/gi, 'Relevé tibial')
    .replace(/Leg curl machine/gi, 'Curl ischios machine')
    .replace(/Copenhagen Hold/gi, 'Copenhagen hold')
}

function translatePrescriptionToFr(value: string): string {
  return value
    .replace(/\/side\b/gi, '/côté')
    .replace(/\bto\b/g, 'à')
}

function translateInlineTextToFr(value: string): string {
  let next = value
  for (const [source, target] of Object.entries(TEXT_EXACT_FR)) {
    next = next.split(source).join(target)
  }
  for (const [pattern, target] of TEXT_FRAGMENT_FR) {
    next = next.replace(pattern, target)
  }
  return next
}

function translateBacktickedSegmentToFr(value: string): string {
  if (/^(W\d|RIR|EMOM|\+?\d)/.test(value) || /\d/.test(value) && /kg|min|s|m|%/.test(value)) {
    return translatePrescriptionToFr(value)
  }

  const translatedExercise = translateExerciseNameToFr(value)
  return translatedExercise === value ? translateInlineTextToFr(value) : translatedExercise
}

function translateTextToFr(value: string): string {
  const withBackticks = value.replace(/`([^`]+)`/g, (_match, inner: string) => {
    return `\`${translateBacktickedSegmentToFr(inner)}\``
  })

  return translateInlineTextToFr(withBackticks)
    .replace(/\s+/g, ' ')
    .trim()
}

function translateBlockNameToFr(name: string): string {
  return BLOCK_NAME_FR[name] ?? translateTextToFr(name)
}

function translateFormatToFr(format: string): string {
  if (!format) return format
  return FORMAT_FR[format] ?? translateTextToFr(format)
}

function buildGeneratedFrContent(session: MotherSession): SessionContentFr {
  return {
    goals: session.goal.map(translateTextToFr),
    sessionIdentity: session.sessionIdentity.map(translateTextToFr),
    warmUpExercises: session.warmUp.exercises.map((exercise) => ({
      name: translateExerciseNameToFr(exercise.name),
      prescription: translatePrescriptionToFr(exercise.prescription),
    })),
    warmUpNotes: session.warmUp.notes.map(translateTextToFr),
    blocks: session.blocks.map((block) => ({
      name: translateBlockNameToFr(block.name),
      format: translateFormatToFr(block.format),
      exercises: block.exercises.map((exercise) => ({
        name: translateExerciseNameToFr(exercise.name),
        prescription: translatePrescriptionToFr(exercise.prescription ?? ''),
      })),
      coachingNotes: block.coachingNotes.map(translateTextToFr),
      fallbackOptions: block.fallbackOptions?.map(translateTextToFr),
    })),
    progressionRules: session.progressionRules.map(translateTextToFr),
    positionAccent: session.positionAccent.map(translateTextToFr),
    coachingWarnings: session.coachingWarnings.map(translateTextToFr),
  }
}

/**
 * Returns FR content for a session **only if the session is fully translated**
 * (all blocks present and matching). Returns undefined otherwise -> the UI stays in EN.
 */
export function getSessionFr(sessionId: string): SessionContentFr | undefined {
  return SESSION_CONTENT_FR[sessionId]
}

export function getSessionFrOrFallback(session: MotherSession): SessionContentFr | undefined {
  const manual = getSessionFr(session.metadata.id)
  if (manual) return manual
  if (!MOTHER_SESSIONS_BY_ID[session.metadata.id]) return undefined
  return buildGeneratedFrContent(session)
}
