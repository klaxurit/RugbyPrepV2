# Quick Spec — M4 Push Transport Réel

**Projet :** RugbyForge  
**Date :** 2026-03-09  
**Milestone :** M4 — Push notifications réelles  
**Statut :** Ready for implementation

## 1. Contexte

Le pipeline notifications est partiellement en place :

- l’utilisateur peut s’abonner côté navigateur
- l’abonnement est enregistré de façon sécurisée via `register-push-subscription`
- `send-training-reminders` filtre les joueurs et écrit des lignes `queued` dans
  `notification_delivery_logs`
- le Service Worker sait déjà recevoir un événement `push` et afficher une notification

Le maillon manquant est le **transport Web Push serveur** entre les lignes
`queued` et la réception effective côté navigateur.

## 2. Problème

Aujourd’hui, le système sait décider **qui doit recevoir un rappel**, mais pas
encore **envoyer** le rappel.

Conséquences :

- aucune notification réelle n’est délivrée
- `notification_delivery_logs` n’est qu’un journal de décision, pas de livraison
- le produit premium “notifications avancées” n’est pas encore réellement exploitable

## 3. Objectif

Ajouter un transport Web Push réel, sûr et observable, sans casser les règles
produit existantes :

- sécurité jamais premium-gatée
- backend source de vérité
- transport idempotent
- observabilité minimale des envois

## 4. Hors périmètre

Ce quick spec ne couvre pas :

- notifications email
- notifications in-app riches
- segmentation marketing
- orchestration multi-device sophistiquée
- refonte complète de la logique ACWR côté scheduler

## 5. État actuel constaté dans le code

### Front

- `src/hooks/useNotifications.ts`
  - souscription navigateur OK
  - sync serveur OK
- `src/sw.ts`
  - réception `push` OK
  - `notificationclick` OK

### Backend

- `supabase/functions/register-push-subscription/index.ts`
  - enregistre endpoint + clés + jours + timezone
- `supabase/functions/unsubscribe-push/index.ts`
  - désactive l’abonnement
- `supabase/functions/send-training-reminders/index.ts`
  - sélectionne les destinataires
  - écrit des logs `queued`
  - **n’envoie pas encore**

### Données

- `push_subscriptions`
  - contient déjà endpoint, clés, ownership, état actif
- `notification_preferences`
  - contient horaires et préférences user
- `notification_delivery_logs`
  - contient statut, payload, raison de skip, timestamps

## 6. Solution recommandée

### 6.1 Architecture

Conserver la séparation actuelle :

1. `send-training-reminders`
   - décide quoi envoyer
   - crée des lignes `queued`
2. nouvelle fonction `dispatch-push-queue`
   - lit les lignes `queued`
   - envoie le Web Push réel
   - met à jour `notification_delivery_logs`

Cette séparation est meilleure qu’une fonction unique :

- plus simple à observer
- plus simple à rejouer
- plus simple à rendre idempotente
- meilleure base pour les retries

### 6.2 Transport

Utiliser le standard **Web Push + VAPID** depuis Supabase Edge Functions.

Secrets requis :

- `VAPID_PUBLIC_KEY` déjà utilisé côté front
- `VAPID_PRIVATE_KEY` à ajouter côté Supabase
- `VAPID_SUBJECT` recommandé, ex. `mailto:bonjour@rugbyforge.fr`

### 6.3 Nouveau flux

1. cron appelle `send-training-reminders`
2. des lignes `queued` sont créées
3. cron secondaire ou appel enchaîné appelle `dispatch-push-queue`
4. chaque ligne `queued` est jointe à `push_subscriptions`
5. un payload final est rendu selon `template_key`
6. envoi Web Push
7. mise à jour du log :
   - `sent` si succès
   - `failed` si erreur
   - `expired` si abonnement mort / endpoint invalide
8. si endpoint mort (`404` / `410`) :
   - désactiver `push_subscriptions.is_active = false`

## 7. Changements de données recommandés

Le schéma actuel suffit pour un premier envoi, mais il manque un minimum
d’observabilité de retry.

### Migration recommandée

Ajouter à `notification_delivery_logs` :

- `attempt_count integer not null default 0`
- `last_attempt_at timestamptz`
- `provider_status_code integer`

Index recommandé :

- `(status, scheduled_for)`

Pourquoi :

- retries propres
- tri opérationnel plus simple
- debug sans parse manuel de `error_message`

## 8. Templates à supporter en V1

### `training_reminder_standard`

Payload minimal :

- `title`
- `body`
- `url`
- `tag`

Exemple :

- title: `RugbyForge`
- body: `Ta séance du jour est prête. Ouvre l’app pour voir le programme.`
- url: `/week`
- tag: `training-reminder-standard`

### `training_reminder_advanced`

Même structure, mais copy plus contextualisée :

- phase
- niveau
- rappel horaire
- éventuellement focus séance

Important :

- tant que le scheduler n’est pas pleinement safety-aware, rester sur un copy
  **neutre** et non prescriptif
- ne pas envoyer un message du type “séance intense aujourd’hui” sans avoir
  intégré le contexte charge/fatigue côté serveur

## 9. Exigences produit et sécurité

### Exigences obligatoires

1. Une ligne `queued` ne doit être envoyée qu’une fois par tentative.
2. Les endpoints invalides doivent être désactivés automatiquement.
3. Le payload ne doit pas contenir de données médicales ou sensibles.
4. Le système doit rester compatible free/premium :
   - `notifications_basic` -> template standard
   - `advanced_notifications` -> template avancé
5. En cas de doute clinique, préférer un message neutre plutôt qu’un message prescriptif.

### Règle de sécurité produit

Le transport push ne doit pas introduire une régression clinique.

Donc :

- si la logique charge/sécurité n’est pas encore suffisamment exposée au scheduler,
  la première version doit envoyer un rappel neutre d’ouverture d’app
- le message détaillé “adapté à la charge” vient en V1.1, pas dans une V1 trompeuse

## 10. Implémentation proposée

### Phase A — Transport réel minimal et sûr

1. Ajouter la migration `notification_delivery_logs`
2. Ajouter helper serveur Web Push (VAPID)
3. Créer `dispatch-push-queue`
4. Supporter `training_reminder_standard` et `training_reminder_advanced`
5. Marquer `sent/failed/expired`
6. Désactiver les abonnements morts

### Phase B — Durcissement

1. Retry simple sur erreurs transitoires
2. Ajout `provider_status_code`
3. Dashboard SQL / vue admin de delivery

### Phase C — Safety-aware messaging

1. Exposer côté scheduler le contexte charge/fatigue réellement utile
2. Sélectionner template/copy selon risque
3. Introduire des règles “do not escalate load by push”

## 11. Critères d’acceptation

### Fonctionnels

- un utilisateur abonné reçoit une vraie notification push
- le clic ouvre bien l’app sur la bonne route
- un endpoint invalide est désactivé automatiquement
- les logs passent de `queued` à `sent` ou `failed`

### Produit

- les users free reçoivent le template standard
- les users premium avec `advanced_notifications` reçoivent le template avancé
- aucun message push n’expose de donnée médicale ou d’ACWR brut

### Ops

- possibilité d’identifier facilement :
  - combien ont été `queued`
  - combien ont été `sent`
  - combien ont échoué
  - pourquoi ils ont échoué

## 12. Plan de test

### Manuel

1. S’abonner depuis un navigateur compatible
2. Vérifier `push_subscriptions`
3. Créer une ligne `queued`
4. Lancer `dispatch-push-queue`
5. Vérifier réception réelle
6. Cliquer la notification
7. Vérifier la route ouverte

### Cas négatifs

1. Endpoint expiré
2. User sans `notifications_basic`
3. Subscription inactive
4. Payload vide / template inconnu
5. Browser unsubscribed côté client mais endpoint encore stocké

## 13. Ordre d’exécution recommandé

1. Implémenter `dispatch-push-queue`
2. Tester en environnement preview
3. Ajouter migration de logs/retries
4. Brancher cron réel
5. Ensuite seulement enrichir le copy “advanced”

## 14. Décision

La bonne suite n’est **pas** de refondre tout le scheduler.

La bonne suite est :

1. rendre le transport réel
2. garder les messages neutres
3. observer
4. enrichir ensuite les templates avec davantage de contexte charge/sécurité

Cela permet d’ouvrir la fonctionnalité sans compromettre la cohérence clinique
du produit.
