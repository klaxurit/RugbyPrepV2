# Email templates — RugbyForge

Templates HTML pour les emails transactionnels Supabase (Auth).

Tous les templates partagent la même structure visuelle (palette crème `#F5F2EE` + bordeaux `#7B0D1E`, layout table compatible Outlook, max-width 560px responsive, CTA bulletproof VML, preheader caché, lien fallback en clair, disclaimer sécurité). Seuls le libellé (eyebrow, titre, body, CTA) et la durée d'expiration changent.

## Fichiers

| Fichier | Usage Supabase | Sujet recommandé | Expiration |
|---|---|---|---|
| `confirm-signup.html` | **Confirm signup** | `Confirme ton inscription à RugbyForge` | 24 h |
| `reset-password.html` | **Reset password** | `Réinitialise ton mot de passe RugbyForge` | 1 h |
| `magic-link.html` | **Magic Link** | `Ton lien de connexion RugbyForge` | 1 h |
| `email-change.html` | **Change Email Address** | `Confirme ton nouvel email RugbyForge` | 24 h |
| `invite-user.html` | **Invite user** | `Invitation à rejoindre RugbyForge` | — |

## Comment l'installer dans Supabase

1. Va dans **Supabase Dashboard → Authentication → Email Templates**.
2. Sélectionne le template voulu (Confirm signup, Reset password, Magic Link, Change Email, Invite user).
3. **Subject heading** : colle le sujet correspondant du tableau ci-dessus.
4. **Message body (HTML)** : copie-colle le contenu du fichier `.html` correspondant.
5. Sauvegarde.

## Variables Supabase utilisées

Tous les templates utilisent `{{ .ConfirmationURL }}` (syntaxe Go-template Supabase). Ne pas renommer. Autres variables disponibles si tu veux enrichir :

- `{{ .Email }}` — email du destinataire
- `{{ .Token }}` — OTP brut (rarement utile en template email)
- `{{ .SiteURL }}` — URL de ton site configurée dans Supabase

## Hébergement du logo

Chaque template référence :

```
https://rugbyforge.fr/images/rugbyforge-full.png
```

Ce fichier existe en local dans `/public/images/rugbyforge-full.png`. Il est servi à cette URL **dès que le site est déployé en prod** (Vite sert tout ce qui est dans `public/` à la racine).

**Vérifier après déploiement** : ouvre `https://rugbyforge.fr/images/rugbyforge-full.png` dans un navigateur — si ça s'affiche, le logo des emails aussi.

### Alternative : encoder le logo en base64

Pour que les emails affichent le logo même hors-ligne, inliner en base64. Coût : +30-80 ko par email, négligeable.

```bash
base64 -i public/images/rugbyforge-full.png | pbcopy
```

Remplace la `src` dans chaque HTML :

```html
<img src="data:image/png;base64,COLLE_ICI" ... >
```

## Tester le rendu

- **Prévisualiser localement** : ouvre le fichier `.html` dans un navigateur. Les variables `{{ .ConfirmationURL }}` resteront littérales, c'est normal.
- **Tester en vrai** : déclenche l'action correspondante (signup test, reset pwd, magic link) sur ton app en staging, regarde l'email reçu sur Gmail + Outlook + Apple Mail.
- **Délivrabilité** : [Mail-Tester](https://www.mail-tester.com) pour un score, [Litmus](https://litmus.com) pour la compat clients.

## Structure visuelle partagée

Tous les templates suivent le même squelette :

```
┌─ Logo RugbyForge (160px, haut gauche)
├─ Card blanche (radius 20px, border soft, shadow légère)
│  ├─ Eyebrow (Bienvenue / Sécurité / Connexion / …)
│  ├─ Titre (28px, poids 700)
│  ├─ Body copy (15px, leading 24px)
│  ├─ CTA bouton bordeaux (bulletproof Outlook)
│  ├─ Lien fallback en clair
│  └─ Disclaimer sécurité (border-top, 12px)
└─ Footer (rugbyforge.fr · bonjour@rugbyforge.fr)
```

**Pour ajouter un nouveau template** : copie `confirm-signup.html` comme base, change uniquement :

- Le `<title>` et le `<div preheader>` (preview inbox)
- L'eyebrow (1-2 mots, couleur bordeaux)
- Le `<h1>` (titre principal)
- La `<p>` body copy (explication du contexte)
- Le libellé du CTA (`<center>` MSO + `<a>` HTML — garder les 2 versions)
- La phrase d'expiration en pied de card

Ne touche ni la palette, ni le layout, ni la structure table — tu casserais la compat Outlook.
