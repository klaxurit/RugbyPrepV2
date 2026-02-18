# Program Engine — règles déterministes

## Étapes de sélection (ordre)
1) **Éligibilité** : matériel + contre‑indications.
2) **Préférences poste** : tags préférés/évités.
3) **Préférences phase** : FORCE vs POWER.
4) **Tags de recette** : `preferredTags`.
5) **Tie‑break** : `blockId` ascendant (déterministe).

## Ancrage des blocs principaux
- Intents ancrés : `activation`, `contrast`, `force` (si requis par la recette).
- L’ancre est conservée sur la phase (W1–W4 ou W5–W8).
- Si l’ancre devient inéligible, elle est remplacée par le meilleur candidat éligible.

## Rotation contrôlée
- Rotation **uniquement** pour : `neural`, `neck`, `core`, `carry`.
- Rotation déterministe dans une phase (index 0–3).

## EMOM
- Un EMOM doit toujours indiquer une “dose” (reps ou temps par minute).
- Pas d’affichage du repos pour EMOM (repos implicite).
