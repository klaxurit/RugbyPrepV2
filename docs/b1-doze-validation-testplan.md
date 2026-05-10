# B1 — Validation rest-end push notification sous Android Doze

**Status** : ⏳ Test plan prêt — exécution empirique côté user (≥2 devices Android).
**Décision pivot** : #54 dans `docs/release-v1-plan.md` (à clôturer après tests).
**Effort** : 0.5 jour validation côté user.

## 1. Contexte (audit code statique côté agent)

### 1.1 Mécanisme actuel

Le rest timer in-session a deux couches :

1. **In-app** (`RestTimerCard` + bip in-app) : visible quand l'app est au premier plan.
2. **Service Worker** : programme une notification système quand l'app passe en background.

### 1.2 Code lu

| Fichier | Ligne | Rôle |
|---|---|---|
| `src/contexts/SessionRunContext.tsx` | 183-223 | Détecte `visibilitychange`. Si app cachée + rest timer actif → poste `SCHEDULE_REST_END` au SW avec secondes restantes. À la reprise → poste `CANCEL_REST_END`. |
| `src/sw.ts` | 36-74 | Service Worker : reçoit `SCHEDULE_REST_END`, programme `setTimeout(secondes*1000)`, à l'expiration appelle `registration.showNotification` (tag `rugbyforge-rest-end`, vibrate, badge). |
| `src/hooks/useNotifications.ts` | 102-117 | Vérifie `Notification.permission` et présence de `serviceWorker`. Pré-requis : permission accordée AVANT le rest. |

### 1.3 Risques connus identifiés à l'audit

| # | Risque | Sévérité | Mitigation possible |
|---|---|---|---|
| R1 | Android Doze (≥30 min idle) tue les SW timers | Moyen | Non applicable pour rest ≤5min (Doze ne s'active pas en session active) |
| R2 | Samsung One UI "Sleeping apps" agressif | Élevé | User désactive l'optim batterie pour RugbyForge |
| R3 | Xiaomi MIUI / Huawei EMUI / Oppo ColorOS | Critique | User active "Auto-start" + désactive "Battery saver" |
| R4 | Chrome OOM kills SW | Faible | Pas de mitigation V1 (architecture SW) |
| R5 | iOS Safari PWA ne survit pas aux setTimeout en background | Documenté | V1 accepté ; V1.1 = push serveur différé |
| R6 | `sw.controller` null si SW pas encore activé | Très faible | Login flow garantit SW ready (acceptable) |
| R7 | Si permission non accordée, notif silencieusement ignorée | Moyen | Onboarding step demande permission AVANT première session |

### 1.4 Verdict audit

Le mécanisme est **techniquement correct pour Android Chrome vanilla** sur des rest timers ≤5 min. La validation empirique sert à révéler quels OEMs cassent le contrat — la résolution est **côté user (config OS)**, pas côté code, pour V1.

**Aucune mitigation code prioritaire identifiée**. Si la validation révèle un échec ≥30% des devices, escalation à V1.1 architecture push-serveur (3-5j).

## 2. Test plan empirique (à exécuter côté user)

### 2.1 Devices recommandés (≥2 marques différentes)

| # | Device | OS | Build OEM | Battery optim |
|---|---|---|---|---|
| D1 | Pixel 7 / 8 (vanilla Android) | Android 14+ | AOSP-pure | Default |
| D2 | Samsung Galaxy S22+ ou A53+ | One UI 5+ | Samsung | "Sleeping apps" ON pour test |
| D3 (optionnel) | Xiaomi Redmi Note 11+ | MIUI 13+ | Xiaomi | Default agressif |
| D4 (optionnel) | Oppo / Huawei récent | ColorOS / EMUI | OEM-agressif | Default |

D1 + D2 = strict minimum. D3 / D4 = bonus si accessibles.

### 2.2 Préparation de chaque device

1. Installer la PWA via TWA (depuis Play Store si publiée, sinon side-load via test track).
2. Login + complete onboarding.
3. Démarrer une séance.
4. **Vérifier permissions** :
   - `Settings → Apps → RugbyForge → Notifications` : ON.
   - `Settings → Apps → RugbyForge → Battery → Unrestricted` (Android vanilla) ou équivalent OEM.
5. Sur Samsung : `Settings → Battery → Background usage limits → Sleeping apps` : RugbyForge **NON listée**.

### 2.3 Matrix de tests par device

Démarrer une séance contenant un block force avec rest configurable. À chaque test :
1. Lancer un set, déclencher le rest timer.
2. Verrouiller l'écran (bouton power) **immédiatement**.
3. Attendre la durée + 5s.
4. Noter si la notif système s'affiche (vibration + son + texte "Repos terminé 💪").

| Test | Durée rest | État écran | Battery optim | D1 (Pixel) | D2 (Samsung) | D3 (Xiaomi) | D4 (autre) |
|---|---:|---|---|:---:|:---:|:---:|:---:|
| T1 | 60s | Verrouillé | Default | ☐ | ☐ | ☐ | ☐ |
| T2 | 90s | Verrouillé | Default | ☐ | ☐ | ☐ | ☐ |
| T3 | 180s | Verrouillé | Default | ☐ | ☐ | ☐ | ☐ |
| T4 | 300s | Verrouillé | Default | ☐ | ☐ | ☐ | ☐ |
| T5 | 180s | App backgroundée (home) | Default | ☐ | ☐ | ☐ | ☐ |
| T6 | 180s | Verrouillé | **Restricted** (OEM) | ☐ | ☐ | ☐ | ☐ |

Cocher ☑ si la notif arrive dans `[expected, expected + 5s]`. Cocher ☒ avec note si :
- Notif n'arrive pas
- Notif arrive en retard >5s
- Notif arrive avec délai >30s (signal Doze)

### 2.4 Critères pass / fail

**PASS** :
- T1-T5 OK sur D1 (Pixel vanilla) ⟹ implémentation fonctionnelle.
- T1-T5 OK sur D2 (Samsung default) ⟹ acceptable pour V1.
- T6 fail attendu — c'est le scénario OEM-restrictif documenté.

**FAIL** :
- T1-T5 fail sur D1 ⟹ bug majeur, escalade B1 P0.
- ≥2 fails sur D2 ⟹ ajouter onboarding step "désactive Sleeping apps Samsung".
- T1-T5 fail sur D3/D4 ⟹ documenter dans known-limits public, recommander Pixel/Samsung en priorité pour V1 testeurs.

## 3. Résultats observés (à remplir par user après tests)

### Résultats D1 — Pixel ___

| Test | Résultat | Délai observé | Notes |
|---|---|---|---|
| T1 60s | | | |
| T2 90s | | | |
| T3 180s | | | |
| T4 300s | | | |
| T5 180s bg | | | |
| T6 180s restricted | | | |

### Résultats D2 — Samsung ___

| Test | Résultat | Délai observé | Notes |
|---|---|---|---|
| T1 60s | | | |
| T2 90s | | | |
| T3 180s | | | |
| T4 300s | | | |
| T5 180s bg | | | |
| T6 180s restricted | | | |

### Résultats D3/D4 (si applicable)

___

## 4. Décisions à prendre selon résultats

| Scénario | Action V1 |
|---|---|
| Tout PASS sauf T6 attendu | Décision #54 = SHIPPED, B1 clôturé. Doc known-limits OEM. |
| ≥1 fail sur D1 | B1 escaladé P0 → ajout mitigation push serveur OU report V1.1. |
| ≥2 fails sur D2 ou D3/D4 | Ajouter onboarding step "désactive battery optim pour ce device" (1-2h dev). |
| Délai >30s récurrent (Doze) | Documenter limite "rest >5min non garanti", recommander rest <5min. |

## 5. Ressources externes

- [Android Doze documentation](https://developer.android.com/training/monitoring-device-state/doze-standby)
- [Don't Kill My App ranking OEM](https://dontkillmyapp.com/) — base de données empirique des restrictions OEM.
- [Service Worker lifecycle Chrome](https://developer.chrome.com/docs/workbox/service-worker-overview/)
- [Web Push reliability](https://web.dev/push-notifications-overview/) (V1.1 reference)
