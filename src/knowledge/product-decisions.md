# Décisions produit — RugbyPrep

> **Couche 2.** Ce n’est pas de la science. Ce sont les choix du préparateur
> pour *cette* app : amateur FFR, club + match, 2–3 séances S&C.
> Une étude peut argumenter un autre choix. Changer une ligne ici = décision
> explicite, pas un « l’étude dit ».

Les fourchettes scientifiques vivent dans les fichiers domaine +
`evidence-clusters.md`. Les interdits de sécurité vivent dans
`evidence-register.md` (rails). Ici : **l’enveloppe d’ambition**.

---

## Public

| Choix | Valeur | Pourquoi |
|---|---|---|
| Public | Amateur club, 1–5 ans S&C | Pas un programme pro / gym-only |
| Fréquence S&C | 2 ou 3 (4 = option rare) | Le club occupe déjà 2–3 soirs |
| Durée séance Performance | 50–60 min (cap souple 75) | Tenir un créneau semaine ; 75 min n’est pas un rail blessure |
| Langue effort | **RER** (jamais RIR dans l’UI) | Ancre produit |
| Priorité | Sécurité ≥ disponibilité club > perf gym > « sensation lourde » | Confirmé par les programmes empilés (surcharge ressentie) |

---

## Enveloppe d’ambition (négociable)

Hors saison / pré-saison, on **peut** viser le haut des fourchettes KB
(hypertrophie ~10–20 séries fractionnelles/groupe, Force-Pont lourd).

En saison, on **reste volontairement** sous le MAV literature : le club n’est
pas dans le compteur gym. Plafond audit `in_season` = 14 séries/groupe
(`muscleVolume.ts`) — **décision**, pas Pelland.

| Zone | Conservateur (défaut actuel) | Ambitieux (option Performance) | Interdit |
|---|---|---|---|
| Jours gym / sem | 3 | 3 densifiés, pas 4 par défaut | Empiler gym + vitesse max + club le même jour |
| Intensité Force-Pont | 85–90 %, RER 1–2 | Idem ; charges vraiment au % | Échec systématique (Robinson = argument, pas un 4e jour) |
| Isolation / pump | 1 bloc prévention + peu d’armes | Finisher optionnel hors saison | Circuit 100 reps + lourd le même soir |
| Décharge | −40 % volume, intensité = | Coupe de blocs d’abord ; allège les séries seulement si la coupe ne suffit pas | Deload « séance vide » / baisser les % |
| Contrastes | 1 lourd de qualité / séance | 2 si Full et budget neural OK | 4+ contrastes / semaine (Bauer + audits) |
| Vitesse | Slot Speed salle/maison (mur + 3–5 pas) | 8 m couloir si dispo ; 10–20 m seulement si piste déclarée | Piste obligatoire / luge 130 % BW + lower + club |
| Contact club | 2 boutons : séance complète / plus courte (défaut complète) | Plus courte = club a tapé (light, ≤3 blocs) | Chronométrer 15 min comme un pro |
| Horloge FFR sans calendrier | Juin–début juil. = transition (récup, **max 4 sem.**, pas d’hypertrophie). Juillet = pré-saison 1 (force + hypertrophie). Août = pré-saison 2–3 (force → puissance). Sept.–mai = en saison. Trêve ~15 déc.–4 janv. = **deload** (pas `treve_deep`). Avril–mai restent en saison (pas de taper playoffs inventé). **Aucun match inventé.** | Idem + CTA club/match | Faux matchs / primers J-2 fantômes / cycle piloté par blessure |
| Club / 1er match à l’onboarding | Club FFR + date de prochain match **optionnels** sur l’étape planning (hors inter-saison). Skip = horloge. Date → `firstMatchDateOverride` (semaine N, pas de J-2). Sync FFR = profil. | Sync compétition dans le tunnel | Bloquer first-run sur un import FFR |
| 1 match / semaine | Amateur = toujours 1 match. Deux dates la même semaine ISO = doublon : on garde coupe/championnat, sinon la plus tôt. UI calendrier peut lister les deux. | — | Protocole charge « 2 matchs » / inventer un 2e match |
| Rail J-2 runtime | Date séance vs **date du match réel** (event calendrier). Dimanche → J-2 = vendredi. Pas le « jour habituel » club, pas un samedi fantôme. `variant: light` + `maxBlocks` ≤ 2, bumps coupés. Sans event → rien. | — | Light 2 j. avant samedi par défaut / fenêtre 48 h midi / light hors calendrier réel |
| Blessures / stores | Pas de diagnostic, protocole rehab, ni localisation du cycle via douleur. L’horloge et `detectAnnualPlanningContext` **ignorent** `injuries` / `painFlags`. Préhab = échauffement général, pas un traitement. | — | App « médicale » (Play / App Store) : suivi de blessure, douleur à l’onboarding, rehab guidé |
| Cou | Tip off-season + mini-bloc Upper (mains, 3 directions) | Élastique en Alternatives | Séance cou dédiée / harnais lourd |

Quand l’utilisateur (ou le prépa IA) demande une **mise à jour programme**,
proposer au moins **A conservateur** (statut quo) et **B ambitieux** dans
cette enveloppe. C seulement si les rails le permettent et si le club est
calme (off-season / semaine sans match).

---

## Ce qui n’est pas une décision figée

- Volume hypertrophie exact (Pelland : dose-réponse). Off hyp : primes salle 5 séries
  (runtime), plafond audit 22 inchangé. In-season hors match : bloc force 4 séries
  (runtime), plafond audit 14 inchangé.
- Densité Speed hors saison.

*Dernière mise à jour : 2026-08-17*
