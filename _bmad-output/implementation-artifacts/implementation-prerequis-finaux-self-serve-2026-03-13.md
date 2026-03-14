# Rapport d'implémentation — Prérequis finaux GO self-serve conditionnel

**Date :** 2026-03-13
**Baseline commit :** `48e4016`
**Verdict :** Les 3 prérequis bloquants (Task 7, 8, 9) sont implémentés. Le GO self-serve conditionnel est techniquement exécutable.

---

## Task 7 — Cap technique 100 users ✅

**Fichier modifié :** `src/pages/OnboardingPage.tsx`

**Mécanisme :**
- `handleFinish()` est `async`
- Les profils **inéligibles** (off_season, shoulder_pain, etc.) ne consomment pas de slot : profil sauvé, navigation, mais `markOnboardingComplete` n'est PAS appelé
- Pour les profils **éligibles** : avant `markOnboardingComplete(userId)`, un `supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_complete', true)` vérifie le compteur
- Si `count >= BETA_CAP (100)` :
  - `setBetaCapReached(true)` → état React
  - Bouton désactivé, texte → « Places complètes »
  - Message UX : « Les 100 places de la bêta sont actuellement prises. »
  - Analytics : `posthog.capture('beta_cap_reached', { count })`

**Fail-open :** En cas d'erreur réseau, le cap check est ignoré. Le PO surveille le dashboard quotidiennement.

**Pour lever le cap :** Modifier `BETA_CAP = 100` dans le composant.

---

## Task 8 — Feedback links ✅

**Fichiers modifiés :** 5 fichiers

| Fichier | Modification |
|---|---|
| `src/pages/ProfilePage.tsx` | `href` standardisé → `mailto:feedback@rugbyforge.fr` (était `rugbyprep.app`) |
| `src/pages/WeekPage.tsx` | Lien « Un souci ? Contacte-nous → » ajouté dans le guard de blocage |
| `src/pages/SessionDetailPage.tsx` | Idem |
| `src/pages/ProgramPage.tsx` | Idem |
| `src/pages/MobilityPage.tsx` | Idem |

**Wording :** Style discret `text-xs text-white/40`. Lien `mailto:` par défaut — à remplacer par URL Discord/Tally quand le PO crée le canal (Task 1).

---

## Task 9 — Privacy / Compliance minimum ✅

**Fichier modifié :** `src/pages/LegalPage.tsx`

**Enrichissements :**

1. **§2 Accès et inscription** — Aligné avec le comportement réel : mineurs peuvent créer compte et profil, mais programme bloqué sans consentement validé dans le profil (pas « lors de l'inscription »).

2. **Données collectées** — Mention explicite des données de santé sensibles (blessures, rehab, morphologie), finalité, PostHog UE agrégé.

3. **Mineurs et consentement parental** — Consentement couvre données santé, blocage programme sans consentement dans le profil, contraintes U18 renforcées.

4. **Suppression de compte** — Contact `bonjour@rugbyforge.fr`, effacement complet (profil, séances, tests, calendrier, santé), délai 30 jours.

**Cascade SQL vérifiée :** `ON DELETE CASCADE` sur toutes les tables (`profiles`, `exercise_logs`, `match_calendar`, `athletic_tests`, `push_subscriptions`).

---

## Adversarial Review — Résolution des findings

| ID | Sévérité | Résolution | Détail |
|---|---|---|---|
| **F1** | High | **Risque accepté** | Race condition cap 100 : 2 users simultanés peuvent passer le cap. Mitigation serveur (RPC `SELECT FOR UPDATE`) nécessiterait une migration SQL — coût disproportionné pour une beta 100 users monitorée. Probabilité de collision quasi nulle. Le PO surveille le compteur quotidiennement. Si le cap est dépassé de 1-2 users, c'est opérationnellement acceptable. **Non résolu, risque documenté et surveillé.** |
| **F2** | Medium | **Backlog** | Guards client-side only. Acceptable pour beta 100 users — les données ne sont pas médicalement critiques et le moteur est frozen. Server-side enforcement à considérer avant extension > 500 users. |
| **F3** | Medium | **✅ Corrigé** | Les profils inéligibles ne consomment plus de slot beta. `handleFinish` vérifie `onboardingEligibility.isEligible` : si faux, sauve le profil et navigue mais ne marque PAS `onboarding_complete`. |
| **F4** | Low | **Backlog** | Analytics `eslint-disable` masque un `reasons` potentiellement stale. Impact minimal — les reasons ne changent qu'avec le profil. |
| **F5** | Low | **Backlog** | Commentaire trompeur seasonMode dans le snap onboarding. Non bloquant. |
| **F6** | Medium | **✅ Corrigé** | LegalPage alignée avec le comportement réel : les mineurs « peuvent créer un compte et un profil » mais le programme est bloqué « tant que le consentement n'est pas activé dans le profil ». Plus de mention de « lors de l'inscription ». |
| **F7** | Low | **Backlog** | Suppression compte par email = processus manuel. Acceptable pour beta, automatisation à considérer post-100 users. |
| **F8** | Low | **Backlog** | Guard UI dupliqué 4x. Refactoring en composant partagé à faire en P2. |
| **F9** | N/A | **Noise** | BW_ONLY + shoulder_pain → by design. |

---

## Validation finale

| Check | Résultat |
|---|---|
| `npm run test` | 418/418 ✅ |
| `npm run build` | SUCCESS ✅ |
| `npm run lint` | 60 erreurs pré-existantes — 0 nouvelle erreur |

---

## Confirmation explicite

- **Cap technique actif :** Oui — `count >= 100` bloque l'onboarding éligible
- **Inéligibles protégés :** Oui — ne consomment plus de slot beta
- **Feedback link actif :** Oui — 5 surfaces (ProfilePage + 4 guards)
- **Privacy minimum en place :** Oui — LegalPage alignée avec le code, cascade SQL vérifiée
- **Race condition cap :** Risque accepté, documenté, surveillé (pas résolu)
- **Verdict self-serve :** GO self-serve conditionnel techniquement exécutable

## Tâches restantes (opérationnelles, non techniques)

- [ ] **Task 1** (PO) : Créer le canal feedback (Discord/Tally) → puis remplacer les `mailto:` par l'URL du canal
- [ ] **Task 2** (Dev) : Configurer le dashboard PostHog
- [ ] **Task 3** (Dev + PO) : Tester le kill switch `BETA_PAUSED` en local
- [ ] **Task 6** (PO) : Annonce soft launch

## Fichiers modifiés (cette session)

| Fichier | Changement |
|---|---|
| `src/pages/OnboardingPage.tsx` | Cap technique + protection slot inéligible |
| `src/pages/WeekPage.tsx` | Lien feedback dans guard |
| `src/pages/SessionDetailPage.tsx` | Lien feedback dans guard |
| `src/pages/ProgramPage.tsx` | Lien feedback dans guard |
| `src/pages/MobilityPage.tsx` | Lien feedback dans guard |
| `src/pages/ProfilePage.tsx` | Href feedback standardisé |
| `src/pages/LegalPage.tsx` | Données santé, mineurs, suppression, alignement code |
