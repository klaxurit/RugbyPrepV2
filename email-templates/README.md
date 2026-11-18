# Email templates — RugbyForge

Templates HTML pour les emails RugbyForge (Auth Supabase + relance marketing).

**Design unique v2** : en-tête bordeaux `#7B0D1E`, logo crème, titre Inter 900 italique, coupe diagonale `header-cut.png`, corps crème `#FBF7F1`, CTA bulletproof Outlook, pied bordeaux, max-width **600px**, preheader caché. Light-locked (la coupe diagonale crème ne survit pas à un dark mode partiel).

## Fichiers

| Fichier | Usage | Sujet recommandé | Expiration |
|---|---|---|---|
| `confirm-signup.html` | Supabase **Confirm signup** | `Confirme ton inscription à RugbyForge` | 24 h |
| `reset-password.html` | Supabase **Reset password** | `Réinitialise ton mot de passe RugbyForge` | 1 h |
| `magic-link.html` | Supabase **Magic Link** | `Ton lien de connexion RugbyForge` | 1 h |
| `email-change.html` | Supabase **Change Email Address** | `Confirme ton nouvel email RugbyForge` | 24 h |
| `invite-user.html` | Supabase **Invite user** | `Invitation à rejoindre RugbyForge` | — |
| `onboarding-first-session.html` | Relance onboarding (hors Auth) | `Ta 1re séance RugbyForge t’attend 🏉` | — |
| `onboarding-first-session.txt` | Même relance, texte brut | idem | — |
| `render-onboarding-first-session.mjs` | Remplit `{{FIRST_NAME}}` / `{{CTA_URL}}` | — | — |
| `generate-auth-templates.mjs` | Régénère les 5 templates Auth v2 | — | — |

## Relance `onboarding-first-session`

Pour les inscrits `newsletter_opt_in = true` sans 1re séance. **Aucun envoi automatique dans ce repo**.

| Placeholder | Rôle | Défaut |
|---|---|---|
| `{{FIRST_NAME}}` | Après `Salut` : vide → `Salut,` ; sinon `Salut Hugo,` | *(vide)* |
| `{{CTA_URL}}` | CTA + lien pied | `https://rugbyforge.fr/?utm_source=email&utm_medium=relance&utm_campaign=1re_seance` |

```bash
node email-templates/render-onboarding-first-session.mjs --first-name Hugo
node email-templates/render-onboarding-first-session.mjs --format txt --out /tmp/hugo.txt
```

Consentement + désinscription « stop » : uniquement dans ce mail marketing (pas dans les Auth).

Aperçus : `previews/onboarding-first-session-600.png` et `…-375.png`. HTML ≈ 14 Ko.

## Auth Supabase — installer / mettre à jour

Les fichiers du repo sont la **source de vérité**. Supabase Dashboard ne les tire pas automatiquement.

1. `node email-templates/generate-auth-templates.mjs` (si tu as changé le shell)
2. **Supabase Dashboard → Authentication → Email Templates**
3. Pour chaque type : coller le sujet du tableau + le HTML correspondant
4. Variable unique : `{{ .ConfirmationURL }}` (ne pas renommer)

Autres variables Supabase éventuelles : `{{ .Email }}`, `{{ .Token }}`, `{{ .SiteURL }}`.

## Images (URL absolues prod)

| Asset | URL |
|---|---|
| Logo crème | `https://rugbyforge.fr/images/rugbyforge-full.png` |
| Coupe diagonale | `https://rugbyforge.fr/images/email/header-cut.png` ← fichier `public/images/email/header-cut.png` |

**Après merge sur `main`** : vérifier que `header-cut.png` répond en 200 (sinon l’en-tête finit à plat crème, le reste tient).

## Tester le rendu

- Ouvre le `.html` dans un navigateur (les `{{ .ConfirmationURL }}` restent littéraux — normal).
- Auth : déclenche signup / reset / magic link en staging, regarde Gmail + Outlook + Apple Mail.
- Relance : génère avec le script puis prévisualise / envoie un test manuel.
- Délivrabilité : [Mail-Tester](https://www.mail-tester.com), [Litmus](https://litmus.com).

## Structure visuelle partagée

```
┌─ En-tête bordeaux (logo + eyebrow + titre italique)
├─ Coupe diagonale (header-cut.png)
├─ Corps crème
│  ├─ Salut…
│  ├─ Copy
│  ├─ CTA bordeaux (VML + <a>)
│  ├─ Lien fallback (Auth) / sections marketing (relance)
│  └─ Signature Hugo
└─ Pied bordeaux (lien site · contact ou stop newsletter)
```

Pour un **nouvel email Auth** : ajoute une entrée dans `generate-auth-templates.mjs` puis régénère.
Pour un **email marketing** : pars de `onboarding-first-session.html` (placeholders + pied consentement).
