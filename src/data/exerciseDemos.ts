export type ExerciseDemoLang = 'fr' | 'en'

export interface ExerciseDemoDefinition {
  cues?: Partial<Record<ExerciseDemoLang, string[]>>
  youtubeUrl?: string
  startSeconds?: number
  youtubeSearch?: Partial<Record<ExerciseDemoLang, string>>
}

export const EXERCISE_DEMOS: Record<string, ExerciseDemoDefinition> = {
  'push_horizontal__bench_press__barbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=sRuKSZLcmWM',
    cues: {
      fr: [
        'Ancre les pieds au sol avant de décoller la barre.',
        'Serre les omoplates et garde la cage haute pendant tout le mouvement.',
        'Descends la barre sous contrôle vers le bas des pectoraux puis pousse droit.',
      ],
    },
    youtubeSearch: {
      fr: 'développé couché barre technique',
      en: 'barbell bench press technique',
    },
  },
  'push_vertical__shoulder_press__machine': {
    cues: {
      fr: [
        'Colle le haut du dos au dossier et garde les côtes rentrées.',
        'Poignets empilés sous les poignées, avant-bras verticaux.',
        'Pousse vers le haut sans écraser le bas du dos dans la fin d amplitude.',
      ],
    },
    youtubeSearch: {
      fr: 'machine shoulder press technique',
      en: 'machine shoulder press technique',
    },
  },
  'push_vertical__dumbbell_press__seated': {
    youtubeUrl: 'https://www.youtube.com/watch?v=NQ-JJYay1TM',
    cues: {
      fr: [
        'Installe-toi haut sur le banc avec les abdos gainés.',
        'Monte les haltères au-dessus des épaules sans les laisser partir devant.',
        'Redescends sous contrôle jusqu à garder les épaules stables.',
      ],
    },
    youtubeSearch: {
      fr: 'développé épaules haltères assis technique',
      en: 'seated dumbbell shoulder press technique',
    },
  },
  'power__push_press__barbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=HKx22sWywxc',
    cues: {
      fr: [
        'Fais une petite flexion verticale, pas un squat complet.',
        'Pousse fort dans le sol avant de finir avec les bras.',
        'Passe rapidement la tête sous la barre pour terminer verrouillé.',
      ],
    },
    youtubeSearch: {
      fr: 'push press barre technique',
      en: 'barbell push press technique',
    },
  },
  'pull_vertical__pull_up__neutral': {
    cues: {
      fr: [
        'Pars suspendu gainé, épaules abaissées avant de tirer.',
        'Ramène les coudes vers les côtes plutôt que le menton vers la barre.',
        'Garde une montée propre sans balancer les jambes.',
      ],
    },
    youtubeSearch: {
      fr: 'tractions prise neutre technique',
      en: 'neutral grip pull up technique',
    },
  },
  'pull_vertical__pull_up__neutral__assisted': {
    cues: {
      fr: [
        'Utilise juste assez d assistance pour garder une vraie traction.',
        'Commence par sortir la poitrine et abaisser les épaules.',
        'Contrôle bien la descente complète avant la répétition suivante.',
      ],
    },
    youtubeSearch: {
      fr: 'assisted neutral grip pull up technique',
      en: 'assisted neutral grip pull up technique',
    },
  },
  'pull_vertical__lat_pulldown__machine': {
    cues: {
      fr: [
        'Poitrine sortie et buste légèrement incliné, sans tirer en arrière.',
        'Ramène la barre vers le haut des pectoraux avec les coudes vers le bas.',
        'Remonte sous contrôle sans perdre la tension des dorsaux.',
      ],
    },
    youtubeSearch: {
      fr: 'tirage vertical machine technique',
      en: 'lat pulldown technique',
    },
  },
  'pull_horizontal__cable_row__seated': {
    cues: {
      fr: [
        'Grandis-toi avant de tirer et fixe le buste.',
        'Ramène les coudes près du corps sans hausser les épaules.',
        'Marque un court temps de contraction avant de revenir proprement.',
      ],
    },
    youtubeSearch: {
      fr: 'rowing poulie assis technique',
      en: 'seated cable row technique',
    },
  },
  'pull_horizontal__chest_supported_row__machine': {
    cues: {
      fr: [
        'Reste collé au support poitrine du début à la fin.',
        'Tire avec les coudes sans casser les poignets.',
        'Cherche la sensation dans le haut du dos, pas un gros élan.',
      ],
    },
    youtubeSearch: {
      fr: 'chest supported row machine technique',
      en: 'chest supported row machine technique',
    },
  },
  'pull_horizontal__tbar_row': {
    youtubeUrl: 'https://www.youtube.com/watch?v=iO0xxKVTT9E',
    cues: {
      fr: [
        'Pose-toi solide dans la hanche avant de démarrer la série.',
        'Tire vers le bas du sternum avec les coudes qui montent derrière toi.',
        'Garde le dos fixe et évite de finir le tirage avec une extension du buste.',
      ],
    },
    youtubeSearch: {
      fr: 't-bar row technique',
      en: 't-bar row technique',
    },
  },
  'squat__front_squat__barbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=uYumuL_G_V0',
    cues: {
      fr: [
        'Garde les coudes hauts et la barre posée sur les épaules, pas dans les mains.',
        'Respire fort dans le ventre avant chaque descente.',
        'Descends entre les hanches en gardant le tronc le plus vertical possible.',
      ],
    },
    youtubeSearch: {
      fr: 'front squat barre technique',
      en: 'front squat technique',
    },
  },
  'squat__goblet_squat__dumbbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=M0zQn0ZCkAU',
    cues: {
      fr: [
        'Colle l’haltère contre le haut du buste pour rester gainé.',
        'Ouvre les genoux dans l axe des pieds pendant la descente.',
        'Remonte en poussant tout le pied dans le sol, pas seulement les pointes.',
      ],
    },
    youtubeSearch: {
      fr: 'goblet squat technique',
      en: 'goblet squat technique',
    },
  },
  'squat__leg_press__machine': {
    youtubeUrl: 'https://www.youtube.com/watch?v=_bkqGYB-fWI',
    cues: {
      fr: [
        'Place les pieds stables au milieu de la plateforme avant de décrocher.',
        'Descends sous contrôle jusqu à garder le bassin collé au siège.',
        'Pousse avec tout le pied sans verrouiller brutalement les genoux.',
      ],
    },
    youtubeSearch: {
      fr: 'leg press technique',
      en: 'leg press technique',
    },
  },
  'squat__hack_squat__machine': {
    youtubeUrl: 'https://www.youtube.com/watch?v=rYgNArpwE7E',
    cues: {
      fr: [
        'Colle bien le dos et les épaules au support de la machine.',
        'Contrôle le bas du mouvement sans laisser les genoux s effondrer.',
        'Remonte en poussant tout le pied dans la plateforme.',
      ],
    },
    youtubeSearch: {
      fr: 'hack squat machine technique',
      en: 'hack squat machine technique',
    },
  },
  'hinge__rdl__barbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=xgusDooVfKU',
    cues: {
      fr: [
        'Garde une légère flexion des genoux puis pousse les hanches en arrière.',
        'Fais glisser la barre près des cuisses et des tibias.',
        'Arrête la descente dès que le dos risque de s arrondir.',
      ],
    },
    youtubeSearch: {
      fr: 'romanian deadlift barre technique',
      en: 'barbell romanian deadlift technique',
    },
  },
  'hinge__rdl__dumbbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=O2dUYS-YYus',
    cues: {
      fr: [
        'Laisse les haltères suivre la ligne des jambes sans partir devant toi.',
        'Pense hanches en arrière plus que buste en avant.',
        'Reviens en serrant fort les fessiers en haut, sans hyperextension.',
      ],
    },
    youtubeSearch: {
      fr: 'romanian deadlift haltères technique',
      en: 'dumbbell romanian deadlift technique',
    },
  },
  'hinge__deadlift__trap_bar': {
    youtubeUrl: 'https://www.youtube.com/watch?v=FYx76NSijfU',
    cues: {
      fr: [
        'Prends l’air, verrouille le tronc et charge les jambes avant de tirer.',
        'Pousse le sol fort avec les pieds plutôt que de tirer avec le dos.',
        'Monte et redescends la trap bar en gardant la cage haute.',
      ],
    },
    youtubeSearch: {
      fr: 'trap bar deadlift technique',
      en: 'trap bar deadlift technique',
    },
  },
  'push_vertical__landmine_press__kneeling': {
    youtubeUrl: 'https://www.youtube.com/watch?v=39lH32_Ukos',
    cues: {
      fr: [
        'Serre les fessiers et garde les côtes basses pendant toute la presse.',
        'Pousse dans l arc naturel de la landmine sans tourner le buste.',
        'Termine bras long devant toi puis reviens sous contrôle.',
      ],
    },
    youtubeSearch: {
      fr: 'half kneeling landmine press technique',
      en: 'half kneeling landmine press technique',
    },
  },
  'power__landmine_press__speed': {
    youtubeUrl: 'https://www.youtube.com/watch?v=p-skt3yYHn8',
    cues: {
      fr: [
        'Installe un appui stable avant de chercher de la vitesse.',
        'Pousse explosif sur la montée puis freine proprement au retour.',
        'Le buste reste gainé, la vitesse vient du bras qui perce vers l avant.',
      ],
    },
    youtubeSearch: {
      fr: 'landmine press explosive technique',
      en: 'explosive landmine press technique',
    },
  },
  'power__medball_chest_pass__wall': {
    cues: {
      fr: [
        'Tiens la med ball proche de la poitrine pour partir vite.',
        'Projette les mains et les épaules ensemble vers le mur.',
        'Récupère la balle en restant gainé pour la répétition suivante.',
      ],
    },
    youtubeSearch: {
      fr: 'med ball chest pass technique',
      en: 'med ball chest pass technique',
    },
  },
  'power__medball_rotational_throw__wall': {
    cues: {
      fr: [
        'Charge d’abord la hanche arrière avant de lancer.',
        'Tourne hanches et tronc ensemble, puis laisse les bras finir.',
        'Reste équilibré après le lancer, sans tourner sur une jambe molle.',
      ],
    },
    youtubeSearch: {
      fr: 'med ball rotational throw technique',
      en: 'med ball rotational throw technique',
    },
  },
  'power__medball_throw__supine': {
    cues: {
      fr: [
        'Pieds bien ancrés au sol et med ball tenue au-dessus de la poitrine.',
        'Fais une petite mise en tension avant de lancer verticalement.',
        'Relance vite sans perdre le gainage du tronc.',
      ],
    },
    youtubeSearch: {
      fr: 'supine med ball throw technique',
      en: 'supine med ball throw technique',
    },
  },
  'power__cable_press__explosive': {
    youtubeUrl: 'https://www.youtube.com/watch?v=CLyqpDS2OpU',
    cues: {
      fr: [
        'Travaille en unilatéral avec une position solide et légèrement décalée.',
        'Pousse vite devant toi sans laisser le tronc tourner.',
        'Ramène la poignée sous contrôle pour garder tension et alignement.',
      ],
    },
    youtubeSearch: {
      fr: 'explosive cable press technique',
      en: 'explosive cable press technique',
    },
  },
  'core_rotation__cable_rotation__explosive': {
    youtubeUrl: 'https://www.youtube.com/watch?v=d3LM-5X7P7s',
    cues: {
      fr: [
        'Initie la rotation avec les hanches puis laisse suivre le tronc.',
        'Garde les bras longs pour transmettre la vitesse du câble.',
        'Freine la fin du geste pour rester propre et équilibré.',
      ],
    },
    youtubeSearch: {
      fr: 'explosive cable rotation technique',
      en: 'explosive cable rotation technique',
    },
  },
  'core_rotation__cable_chop': {
    youtubeUrl: 'https://www.youtube.com/watch?v=gcGNypjIQDo',
    cues: {
      fr: [
        'Verrouille le bassin et fais voyager les mains en diagonale contrôlée.',
        'Expire en fin de chop pour mieux verrouiller le tronc.',
        'Reviens lentement sans te laisser ramener par la poulie.',
      ],
    },
    youtubeSearch: {
      fr: 'cable chop technique',
      en: 'cable chop technique',
    },
  },
  'power__hang_clean_pull__barbell': {
    youtubeUrl: 'https://www.youtube.com/watch?v=oD-vky21IfM',
    cues: {
      fr: [
        'Commence barre proche des cuisses avec un dip court et solide.',
        'Pousse fort dans le sol puis finis par une extension violente des hanches.',
        'La barre monte près du corps, les coudes montent haut et dehors.',
      ],
    },
    youtubeSearch: {
      fr: 'hang clean pull technique',
      en: 'hang clean pull technique',
    },
  },
}
