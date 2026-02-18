# Auth Supabase

## Ce qui est en place
- Authentification migrée de localStorage vers Supabase Auth.
- Connexion et création de compte via Supabase (`email/password`).
- Session restaurée au chargement de l'app.
- Écoute temps réel de session (`onAuthStateChange`) pour mettre à jour l'état auth.
- Routes protégées inchangées: utilisateur non connecté redirigé vers `/auth/login`.

## Configuration projet
Client Supabase utilisé dans:
- `src/services/supabase/client.ts`

Variables recommandées:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Valeurs actuelles par défaut (fallback) configurées:
- URL: `https://iplrydnzbevicilulmsy.supabase.co`
- Key publishable: `sb_publishable_a85TtaiqChULojIBxFF_5Q_P0bEpvNE`

## Prérequis Supabase dashboard
Dans **Authentication > Providers > Email**:
- Email provider activé.
- Confirmation email configurée selon ton besoin produit:
  - OFF: connexion immédiate après signup.
  - ON: l'utilisateur doit confirmer son email avant connexion.

## Limites / notes
- Aucun mot de passe stocké côté front.
- La chaîne `postgresql://...` n'est pas utilisée par l'app front (normal).
  Elle sert pour des usages serveur/DB admin, pas pour le client React.

## TODO recommandé (prochaine étape)
- Ajouter table `profiles` liée à `auth.users` et RLS pour stocker `display_name` proprement.
- Ajouter reset password.
- Ajouter écrans d'état pour email non confirmé.
