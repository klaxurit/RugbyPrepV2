# Checklist Google Play - RugbyForge

## Ce qui est deja branche dans le repo

- Package Android TWA: `fr.rugbyforge.app`
- Domaine PWA/TWA: `https://rugbyforge.fr`
- Produits Play attendus dans le code:
  - `fr.rugbyforge.premium.monthly`
  - `fr.rugbyforge.premium.yearly`
- Verification serveur d'achat Google Play via Supabase Edge Function: `verify-play-purchase`
- URL publique de confidentialite: `https://rugbyforge.fr/legal`
- URL publique de suppression de compte: `https://rugbyforge.fr/delete-account`

## Pre-requis techniques avant envoi

- Installer ou selectionner un JDK 17 pour Gradle.
  - Etat constate le 2026-04-09: `./gradlew :app:bundleRelease` echoue car l'environnement utilise Java 11.
- Verifier les secrets Supabase:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_SERVICE_ACCOUNT_KEY`
- Activer l'API Google Play Developer pour le projet Google Cloud rattache au service account.
- Donner au service account l'acces a l'application dans Play Console.

## Play Console

- Creer l'application `fr.rugbyforge.app` si ce n'est pas deja fait.
- Publier une premiere build sur une piste de test interne.
  - Cette etape debloque la configuration des produits de facturation.
- Creer et activer les abonnements:
  - `fr.rugbyforge.premium.monthly`
  - `fr.rugbyforge.premium.yearly`
- Configurer au moins un base plan actif avec prix, pays et renouvellement.
- Ajouter les testeurs de licence Google Play pour valider les achats avant production.

## App content / policy

- Renseigner la privacy policy avec `https://rugbyforge.fr/legal`
- Renseigner l'account deletion URL avec `https://rugbyforge.fr/delete-account`
- Completer Data safety
- Completer Content rating
- Declarer Ads = non, si l'app ne diffuse pas de publicite
- Completer App access si certaines fonctions exigent un login
- Completer les declarations Health / Fitness si Play Console les demande pour le type de donnees traitees

## Store listing

- Nom public
- Description courte
- Description complete
- Icône 512x512
- Captures telephone Android
- Banniere feature graphic
- Email de contact
- Site web et support

## Recommandations monetisation

- Tester le flux achat initial dans la TWA Android
- Tester le flux `Restaurer mes achats`
- Verifier que les droits premium remontent bien dans `user_subscriptions` et `user_entitlements`
- Recommander la mise en place de RTDN (Real-time developer notifications) pour suivre automatiquement renouvellements, annulations, grace period et account hold
