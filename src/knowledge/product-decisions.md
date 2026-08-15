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
| Contact club | Compte dans le budget (proxy semaine de match) | Slider club dur / normal / léger (Vague 3) | Chronométrer 15 min comme un pro |
| Cou | Tip off-season (Vague 2) | Mini-bloc isométrique Upper (Vague 3) | Séance cou dédiée / harnais lourd |

Quand l’utilisateur (ou le prépa IA) demande une **mise à jour programme**,
proposer au moins **A conservateur** (statut quo) et **B ambitieux** dans
cette enveloppe. C seulement si les rails le permettent et si le club est
calme (off-season / semaine sans match).

---

## Ce qui n’est pas une décision figée

- Volume hypertrophie exact (Pelland : dose-réponse). Off hyp : primes salle 5 séries
  (runtime), plafond audit 22 inchangé.
- Densité Speed hors saison.

*Dernière mise à jour : 2026-08-15*
