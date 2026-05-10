# WS10 — Bêta finale → Release publique : checklist consolidée

**Status** : ⚠️ partial SHIPPED 2026-05-10 (code-side fini, ops-side restant côté user).
**Décision pivot** : #53 dans `docs/release-v1-plan.md`.

Cette checklist consolide TOUT ce qui reste avant le lancement public V1. Les
docs existantes (`docs/google-play-launch-checklist.md`, `docs/google-play-store-listing.md`)
restent valides — ce fichier les complète avec les ajouts post-pricing /
post-WS9 / post-WS0 et liste les sous-tâches user-side restantes.

## ✅ Code-side livré dans WS10 (B+C)

- LandingPage : 4 cards pricing (Free / Mensuel 5,99€ / Annuel 64,99€ / **Founding 49€/an à vie**)
- Migration `20260510120000_beta_feedback.sql` (table feedback + RLS insert-own)
- Page `/feedback` accessible depuis ProfilePage (kind + message + persist Supabase + PostHog event)

**Wall-clock pending dev** : `npx supabase db push` pour appliquer la migration `20260510120000_beta_feedback.sql`.

## 🛠️ Ops-side : actions user

### 1. Bubblewrap keystore backup (Décision #34, EXISTENTIEL)

**Pourquoi** : si le keystore Android (`android.keystore` dans `.gitignore`) est perdu, **tu es banni à vie de mettre à jour l'app sur Play Console**. Aucune solution de récupération côté Google.

**Procédure de backup** :
1. Localiser `android.keystore` (généralement à la racine du projet ou dans `android/`).
2. Localiser le fichier de mot de passe / fichier d'alias associé (ou les noter d'un endroit sécurisé).
3. **Copie 1 : 1Password / Bitwarden** — ajouter le fichier en attachement secure note. Inclure :
   - Le `.keystore` lui-même
   - Le keystore password
   - L'alias + alias password
4. **Copie 2 : disque externe chiffré offline** — clé USB / disque dur dans un endroit physique séparé (idéalement coffre, ou domicile parent / membre famille de confiance).
5. **Tester la restauration** : extraire la copie 1 sur une autre machine, signer un AAB de test pour vérifier que les credentials marchent.

**Faire AVANT** : la première publication payante sur Play Store.

### 2. Supabase Pro upgrade

**Pourquoi** : la free tier a des limits (DB 500MB, 50k MAU, 2GB bandwidth/mois) qui peuvent être atteintes en bêta avec push notifs cron + 50 testeurs. Supabase Pro = 25$/mois, lève les limits + support prioritaire + DB backups journaliers.

**Procédure** :
1. Dashboard Supabase → Project Settings → Plan → Upgrade to Pro.
2. Vérifier facturation OK + nouvelle limite affichée.
3. **Activer Point-in-Time Recovery (PITR)** : avec Pro, c'est ~10$/mois supplémentaire. Recommandé pour V1 (rollback DB granulaire en cas de migration foireuse).

**Timing** : avant la fin du sprint bêta finale (avant 20-50 testeurs externes). Sinon risque de quota lock pendant le sprint.

### 3. Supabase Auth dashboard config (Décisions #46, WS9, WS2)

À vérifier / activer dans Project Settings → Auth :

- **Rate limits** :
  - Magic Link : ≤ 10 / heure / IP
  - OTP : ≤ 60 / heure / IP
  - Signup : ≤ 30 / heure / IP
- **CAPTCHA Provider** = hCaptcha (toggle ON, secret collé) — **uniquement après que la prod frontend ait `VITE_HCAPTCHA_SITEKEY` set, sinon les utilisateurs existants ne pourront plus se loguer**.
- **Prevent use of leaked passwords** : ON.
- **Allowed Redirect URLs** : vérifier que `https://rugbyforge.fr/auth/callback` et `https://rugbyforge.fr/auth/reset-password` sont listés.

### 4. Stripe — créer 3 Price objects (Décisions #52, WS0 follow-up pricing)

Dashboard Stripe → Products → RugbyForge Premium → ajouter Prices :

1. **Premium Mensuel** : 5,99 € EUR / month recurring → copier `price_xxx` → secret `STRIPE_PRICE_PREMIUM_MONTHLY`
2. **Premium Annuel** : 64,99 € EUR / year recurring → copier `price_xxx` → secret `STRIPE_PRICE_PREMIUM_YEARLY`
3. **Founding Annuel** : 49,00 € EUR / year recurring → copier `price_xxx` → secret `STRIPE_PRICE_FOUNDING_YEARLY`

Coller les 3 dans Supabase → Project Settings → Edge Functions → Secrets. Re-deploy auto par Supabase.

**Note** : un Stripe Price object **n'est pas modifiable**. Si on veut changer un prix, il faut créer un nouveau Price + mettre à jour le secret. Les abonnements existants restent sur l'ancien prix.

### 5. Google Play Console — Subscriptions + RTDN

**Subscriptions à créer** (Play Console → Monetisation → Subscriptions) :

- `fr.rugbyforge.premium.monthly` : base plan annual ❌ → **base plan monthly**, 5,99 € EUR
- `fr.rugbyforge.premium.yearly` : base plan annual, 64,99 € EUR
- `fr.rugbyforge.founding.yearly` : base plan annual, 49,00 € EUR

⚠️ Les SKU codés dans `usePlayBilling.ts` sont `premium.monthly`, `premium.yearly`, `founding.yearly` — l'IDs Play Console doivent matcher EXACTEMENT.

**Real-time Developer Notifications (RTDN)** : recommandé pour suivi automatique des renouvellements / annulations / grace period / account hold. À configurer plus tard (V1.1 si prod déjà stable). Voir [doc Google](https://developer.android.com/google/play/billing/rtdn-reference).

### 6. Play Store listing assets manquants

Référence : `docs/google-play-store-listing.md` (189 lignes, déjà rédigées).
À produire :

- [ ] Icône 512×512 (PNG 32-bit)
- [ ] Bannière feature graphic 1024×500 (cf. brief V1 §Feature graphic)
- [ ] 4-8 captures écran téléphone Android (cf. storyboard §Storyboard captures) — **post-refonte v4-pro** + **avec nouveau pricing visible**
- [ ] Optionnel : vidéo démo 30s pour le store (peut être faite plus tard)
- [ ] Description courte (80 chars max) + description complète (cf. doc §Description complete)

**Validation** : checklist `docs/google-play-launch-checklist.md` §Store listing.

### 7. Recrutement 20-50 testeurs externes (cible bêta finale)

**Plan d'approche** (mix recommandé par la review) :

1. **5-10 LinkedIn DM perso** ciblés sur joueurs amateurs FFR / coachs S&C amateurs identifiés
2. **2-3 clubs amateurs FFR** : email président + DM coach physique. Objectif : 5-10 testeurs / club. Cf. Décision #788 dans `release-v1-plan.md` ("talk to 3 clubs in week 7-8 beta").
3. **Reddit /r/rugbyunion** ou **forums rugby FR** : post avec lien d'inscription (modéré, pas de spam)
4. **Tiktok / Instagram** : non recommandé pour V1 (faible signal, distrait du focus)

**Onboarding testeur** :
- Lien direct `https://rugbyforge.fr/auth/signup` (pas Play Store tant qu'app pas publiée — Bubblewrap TWA peut être side-loaded en interne via test track Play Console).
- Email de bienvenue manuel toi-même (pour V1, pas d'infra email transactionnelle, cf. Décision #50 WS9).
- Demande explicite : compléter signup + au moins 1 séance + envoyer feedback via /feedback.

**Triage feedback** : check `beta_feedback` table chaque jour pendant la phase bêta. SQL admin :
```sql
select kind, message, app_version, created_at
from beta_feedback
order by created_at desc;
```

### 8. Founding offer — DM perso aux 20-50 testeurs (Décision #50 WS9 + #52 WS0)

Pour les testeurs qui ont déclenché `founding_offer_shown` (visible dans PostHog → Events) :

- Email / LinkedIn DM perso avec lien `https://rugbyforge.fr/founding` (= page d'atterrissage de l'offre, ouvre la modal directement si user est loggué).
- Message court : "Salut {Prénom}, tu as testé RugbyForge — bloque ton tarif Founding 49€/an à vie tant que les 100 places sont disponibles."
- Track conversion : event PostHog `founding_offer_clicked` puis `subscription_active` (côté billing-webhook).

**Cap 100** : à V1 c'est juste un message marketing dans la modal. Si conversion réelle > 100 → décider en V1.1 si on enforce hard ou si on garde le tarif pour tous les early users.

### 9. Pricing page sur landing rugbyforge.fr

**Status** : ✅ shipped en phase B (LandingPage 4 cards : Free / Mensuel / Annuel / Founding). À vérifier en prod après deploy :

```bash
curl -s https://rugbyforge.fr/landing | grep -oE "Founding|49€|64,99€|5,99€"
```

### 10. Communication launch (post-bêta, optionnel V1)

**Channels** (cf. Décision #412 review : pick ONE) :

1. ✅ **LinkedIn perso Hugo** : post lancement avec retours bêta + 3-5 testeurs cités
2. ✅ **FFR comm** : email contact FFR pour relais éventuel (low expectation)
3. ⚠️ **Clubs amateurs partenaires** : continuation de l'effort recrutement (3 clubs ciblés)
4. ❌ **Pubs payantes** : pas pour V1 (budget zéro, CAC inconnu)

## ✅ Critères de release publique (kill criteria release-v1-plan.md §454)

À valider AVANT submit Play Store :

- [ ] 0 P0 bug ouvert sur 7 jours glissants (table `beta_feedback` triée + Sentry V1.1)
- [ ] 0 erreur Sentry critique sur 7 jours (Sentry V1.1, pour V1 → check console errors PostHog)
- [ ] Au moins 5 testeurs ont complété signup → onboarding → 1ère séance
- [ ] Au moins 1 testeur a converti en payant (via founding offer ou premium)
- [ ] Migration de toutes les sous-tâches §1-9 ci-dessus
- [ ] Build Android signé + AAB uploadé sur piste de test interne Play Console + validé par Google
- [ ] Site rugbyforge.fr déployé avec `_headers` actuels (CSP + hCaptcha + cookies banner)

## Récapitulatif effort restant user-side

| Action | Effort | Priorité | Bloquant release ? |
|---|---:|---|---|
| §1 Bubblewrap keystore backup | 30min | P0 | OUI |
| §2 Supabase Pro upgrade | 10min | P0 | OUI (quotas bêta) |
| §3 Auth dashboard config | 15min | P0 | OUI (hCaptcha) |
| §4 Stripe 3 Prices | 20min | P0 | OUI |
| §5 Play Console 3 SKU + RTDN | 1h | P0 | OUI |
| §6 Play Store assets | 2-4h | P0 | OUI |
| §7 Recrutement testeurs | 1 semaine wall | P0 | OUI |
| §8 DM Founding | 2-3h cumul | P1 | NON |
| §9 Vérif prod landing | 5min | P0 | OUI (smoke test) |
| §10 Communication launch | 1 semaine wall | P2 | NON (post-release) |

**Total ops-side avant submit** : ~1.5j de travail focal + ~1 semaine wall-clock (recrutement testeurs).
