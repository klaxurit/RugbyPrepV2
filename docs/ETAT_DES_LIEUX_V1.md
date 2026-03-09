# État des lieux RugbyForge V1 — Déploiement App Store / Play Store

> Note: ce document est historique. Pour l’état actuel du projet, utiliser
> `docs/PROJECT_STATUS.md`.

**Date :** 3 mars 2026  
**Objectif :** V1 sérieuse, testable, déployable sur les stores

---

## 1. Vue d’ensemble de l’app

| Aspect | État |
|--------|------|
| **Stack** | React 19, Vite 7, TypeScript, Tailwind 4, Supabase |
| **Auth** | Supabase Auth (email, OAuth) |
| **Offline** | PWA + service worker (injectManifest), cache localStorage |
| **Monétisation** | Stripe (checkout, webhook, sync) — en place côté backend |
| **Analytics** | PostHog (useAnalytics) |

---

## 2. Fonctionnalités : ce qui est en place ✅

### 2.1 Core fonctionnel

| Domaine | Statut | Notes |
|---------|--------|------|
| Auth + profil joueur | ✅ | Login, signup, callback, RequireAuth, profil complet (morpho, équipement, blessures, etc.) |
| Programme algorithmique | ✅ | Starter / Builder / Performance, buildWeekProgram, session recipes |
| 3 modes saison | ✅ | In-season, off-season, pré-saison + calendrier annuel |
| Calendrier match / agenda club | ✅ | match_calendar, club_code, events, add/remove/update |
| Monitoring ACWR | ✅ | useACWR, charge aiguë/chronique, zones (ok/caution/danger/critical) |
| Prehab automatique | ✅ | Intégré aux blocs, filtrage contra-indications |
| Sessions mobilité | ✅ | MobilityPage, buildMobilitySession |
| Protocoles retour blessure | ✅ | P1/P2/P3, rehab_injury, filtrage exercices |
| Blocs conditionnement | ✅ | Off/pré-saison |
| Tests physiques | ✅ | CMJ, Sprint, 1RM, YYIR1 — ProgressPage, estimateOneRM, baselines |
| Chat Coach IA | ✅ | Claude Haiku, multi-turn, 5 msg/jour free, illimité premium |
| PWA + Push | ✅ | vite-plugin-pwa, manifest, icons 192/512, sw.ts |
| Enregistrement charges | ✅ | block_logs, SessionView, RPEModal, addBlockLog |
| Progression | ✅ | Graphes W1→W4, history, recaps |

### 2.2 Features stratégiques (doc .ini vs code)

Le document « État des lieux stratégique » indiquait #20, #21, #22 comme manquants.  
**En fait, ces trois features sont déjà implémentées.**

| # | Feature | Statut réel | Référence code |
|---|---------|-------------|----------------|
| **#21** | Progressive overload (charges réelles, +2.5 kg) | ✅ Implémenté | `suggestions.ts` (LOAD_INCREMENT_KG=2.5), `SessionView.tsx` (affichage suggestion) |
| **#22** | Input charge post-match (RPE × durée → ACWR) | ✅ Implémenté | `useACWR.ts` (matchAsLogs), `CalendarPage.tsx` (EventRow, updateMatchLoad), `useCalendar.ts` |
| **#20** | Planning club → sync jours S&C | ✅ Implémenté | `scheduleOptimizer.ts`, `club_schedule` / `sc_schedule`, ProfilePage, OnboardingPage |

### 2.3 Distribution (Free vs Premium)

| Feature | Free | Premium |
|---------|------|---------|
| Programme hebdo | ✅ | ✅ |
| Calendrier | ✅ | ✅ |
| Suivi séances | ✅ | ✅ |
| Mobilité | ✅ | ✅ |
| Tests physiques | ✅ | ✅ |
| Chat IA | 5 msg/jour | Illimité |
| ACWR | ✅ Basique | ✅ Avancé (+ matchs) |
| Progressive overload | ✅ (suggestion) | ✅ (mémoire) |
| Stripe checkout | — | ✅ (create-checkout-session, billing-webhook) |

---

## 3. Manques pour une V1 solide et déployable

### 3.1 Critique (avant distribution)

| # | Manque | Priorité | Action |
|---|--------|----------|--------|
| 1 | **Mur payant visible** | 🔴 | Stripe côté app : usePremiumCheckout, PremiumUpsellCard existent — à valider le flux complet (redirect, sync entitlements) |
| 2 | **Variables d’environnement** | 🔴 | Vérifier `.env.example` complet (Supabase URL/anon, Stripe price IDs, PostHog) et doc pour déploiement |
| 3 | **Build production sans erreur** | ✅ | `npm run build` passe (corrections TypeScript faites — ClubSchedule, types updateMatchLoad) |

### 3.2 Important (qualité v1)

| # | Manque | Priorité | Action |
|---|--------|----------|--------|
| 4 | **Tests** | 🟡 | Quelques tests (vitest) : buildWeekProgram, programDataIntegrity. Étendre couverture critique (ACWR, suggestions) |
| 5 | **CI/CD** | 🟡 | Pas de GitHub Actions. Ajouter : lint, build, tests sur push/PR |
| 6 | **Onboarding** | 🟡 | Flow existe (OnboardingPage) — à simplifier pour 3 étapes max si prévu |
| 7 | **Pages légales** | 🟡 | LegalPage existe — vérifier CGU, Politique confidentialité, mentions légales pour stores |
| 8 | **Erreurs / offline** | 🟡 | Gestion d’erreurs utilisateur (toasts, messages clairs) et fallback offline cohérent |

### 3.3 Nice-to-have (post v1)

| # | Manque | Priorité |
|---|--------|----------|
| 9 | Vidéos / démos exercices | 🟠 |
| 10 | Tests E2E (Playwright) | 🟠 |

---

## 4. Déploiement sur les stores

### 4.1 Google Play Store (Android)

**Techno : PWA en Trusted Web Activity (TWA)**

- ✅ PWA prête : manifest, icons, service worker, HTTPS requis
- **Étapes :**
  1. Publier l’app sur un domaine HTTPS (ex. rugbyforge.app)
  2. Utiliser [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) pour générer un Android App Bundle
  3. Créer un compte Google Play Developer (~25 €)
  4. Configurer les Digital Asset Links entre le site et l’app
  5. Soumettre l’app et passer la review

**Ressource :** [PWA in Play - Google Developers](https://developers.google.com/codelabs/pwa-in-play)

### 4.2 Apple App Store (iOS)

**Limitation : les PWA ne sont pas acceptées**

Apple rejette les PWA « repackaged » (Guideline 4.2). Pour l’App Store, il faut :

1. **Wrapper natif (Capacitor ou équivalent)**  
   - Capacitor : wrapper le projet Vite/React dans une app Xcode  
   - Générer un binaire iOS, soumettre via App Store Connect  

2. **Compte Apple Developer**  
   - 99 USD/an  

3. **Publier la v1 en PWA Android uniquement**  
   - Stratégie rapide : lancer d’abord sur Play Store  
   - App Store après validation du modèle (ROI, adoption)  

---

## 5. Checklist pré-déploiement

### 5.1 Technique

- [x] `npm run build` réussit
- [x] `npm run lint` sans erreurs bloquantes
- [x] Tests existants passent (`npm test`) — 6 tests
- [x] `.env.example` à jour et documenté
- [ ] Pas de secrets dans le code (clés API, mots de passe)
- [ ] Manifest PWA : `name`, `short_name`, `icons`, `start_url` cohérents
- [ ] Favicon + apple-touch-icon présents

### 5.2 Contenu / Légal

- [ ] CGU, Politique de confidentialité, mentions légales
- [ ] Politique de confidentialité accessible depuis l’app (footer, paramètres)
- [ ] Données collectées explicitées (RGPD si ciblant l’Europe)

### 5.3 Hébergement

- [ ] Domaine en HTTPS (Vercel, Netlify, ou autre)
- [ ] Supabase projet de production configuré
- [ ] Webhooks Stripe pointant vers l’URL de prod

### 5.4 Stores

- [ ] Google Play : compte dev, assets (screenshots, description, icône)
- [ ] Apple (si Capacitor) : compte dev, provisioning, App Store Connect

---

## 6. Résumé exécutif

| Élément | État |
|---------|------|
| **Fonctionnalités métier** | ✅ Complètes (y compris #20, #21, #22) |
| **Paiement Stripe** | ✅ Backend prêt ; flux client à valider |
| **PWA** | ✅ Prête pour TWA Android |
| **Tests / CI** | ⚠️ Couverture limitée, pas de CI |
| **App Store iOS** | ❌ Nécessite Capacitor — à programmer après v1 |
| **Google Play** | ✅ Faisable rapidement (TWA + Bubblewrap) |

**Recommandation :**  
1. Valider le flux Stripe (checkout → entitlements → paywall)  
2. Corriger build/lint et ajouter une CI basique  
3. Déployer la PWA en production (HTTPS)  
4. Publier sur Google Play via TWA  
5. Reporter l’App Store à une v1.1 avec Capacitor une fois le modèle validé  

---

*Document généré à partir de l’analyse du code et de la doc projet.  
À mettre à jour au fil des livraisons.*
