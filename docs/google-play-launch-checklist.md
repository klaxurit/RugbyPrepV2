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

### App access - quoi declarer pour RugbyForge

RugbyForge ne doit PAS etre declare comme "all functionality available without restrictions":

- l'app principale exige un compte et une connexion
- la plupart des routes app sont protegees apres login / onboarding
- certaines fonctionnalites sont Premium et Google Play ne peut pas acheter ni demarrer un essai librement pendant la review

Conclusion pratique: dans Play Console, choisir l'option indiquant que l'acces est limite pour tout ou partie de l'app, puis fournir un compte de review dedie avec acces complet.

#### Compte de review recommande

- creer un compte email dedie et stable, en anglais si possible
- confirmer l'email avant soumission
- terminer l'onboarding sur ce compte
- accorder Premium a ce compte pour que les reviewers puissent voir toutes les fonctionnalites sans achat
- ne pas fournir un compte personnel
- ne pas fournir un mot de passe temporaire / expirable

#### Helper SQL deja present dans le repo pour accorder Premium

La migration `supabase/migrations/20260504100000_tester_premium_helpers.sql` expose:

```sql
select public.grant_premium_to_tester(id)
from auth.users
where email = 'reviewer@example.com';
```

Cette fonction donne les entitlements Premium sans abonnement Play/Stripe, ce qui est ideal pour la review Play Store.

#### Texte pret a coller dans Play Console

Instruction name:

```text
Review account - full access
```

Any other information required for access:

```text
Use the email address and password provided above on the login screen.

This review account is pre-configured and already has full Premium access. No separate purchase, invitation code, 2-step verification, or location-based access is required.

If a CAPTCHA is shown on the login screen, complete it and continue with the same credentials.

Onboarding is already completed on this review account. After sign-in, all main sections are available from the in-app navigation.
```

#### Notes utiles pour la soumission

- cocher l'autorisation permettant a Android d'utiliser ces identifiants pour les tests de compatibilite est OK si le compte est dedie a la review
- garder ces identifiants a jour pour chaque mise a jour soumise
- si le mot de passe change, mettre immediatement a jour Play Console

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
