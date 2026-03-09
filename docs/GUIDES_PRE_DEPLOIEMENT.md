# Guides pré-déploiement — RugbyForge V1

Ces guides t'accompagnent pour les tâches que tu dois accomplir toi-même, en sécurité.

**App :** RugbyForge · **Domaine :** rugbyforge.fr

---

## 1. Valider le flux Stripe (checkout → entitlements → paywall)

### Statut

**Déjà fait.** Le flux complet (checkout, paiement test, sync entitlements, paywall) a été validé.

### Référence rapide (pour debug futur)

- Carte test : `4242 4242 4242 4242`
- Webhook prod : `https://[PROJET].supabase.co/functions/v1/billing-webhook`
- Événements : `checkout.session.completed`, `customer.subscription.created/updated/deleted`

---

## 2. Vérifier l'absence de secrets dans le code

### Objectif

S'assurer qu'aucune clé API, mot de passe ou secret n'est en dur dans le code.

### Méthode rapide

```bash
# Depuis la racine du projet
rg -i "sk_live|sk_test|whsec_|eyJ[A-Za-z0-9_-]+\.eyJ|password\s*=\s*['\"]|api_key\s*=\s*['\"]" --type-add 'code:*.{ts,tsx,js,jsx,json}' -t code .
```

### Checklist

- [ ] `git status` : `.env.local` n'est pas tracké
- [ ] Aucune clé `sk_`, `whsec_`, token JWT complet dans le code source

---

## 3. CGU, Politique de confidentialité et mentions légales

### Statut

**Fait.** RugbyForge, rugbyforge.fr, mention Stripe (paiements) intégrés dans `LegalPage.tsx`.

- CGU, Politique de confidentialité, disclaimer santé
- Accessible via `/legal` et Profil → « Mentions légales »
- URL prod : `https://rugbyforge.fr/legal`

---

## 4. Déployer la PWA sur Cloudflare Pages (rugbyforge.fr)

### Objectif

Héberger l'app en production avec HTTPS pour activer la PWA et préparer le Play Store (TWA).

### Prérequis

- Compte Cloudflare
- Domaine rugbyforge.fr (enregistré chez un registrar)
- Repo GitHub avec le projet RugbyPrepV2

---

### Étape 1 : Créer le projet Pages

1. Va sur [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create application** → **Pages** → **Connect to Git**
3. Connecte ton compte GitHub et choisis le repo `RugbyPrepV2` (ou le nom de ton repo)
4. Configure le build :
   - **Framework preset :** None (ou Vite si proposé)
   - **Build command :** `npm run build`
   - **Build output directory :** `dist`
   - **Root directory :** `/` (laisser vide si le projet est à la racine)
5. **Save and Deploy**

Ton app sera disponible sur `rugbyprep-v2.pages.dev` (ou un nom similaire).

---

### Étape 2 : Variables d'environnement

1. Dans le projet Pages → **Settings** → **Environment variables**
2. Clique **Add variable**
3. Ajoute chaque variable pour **Production** (et optionnellement Preview) :

| Variable | Valeur | Secret |
|---------|--------|--------|
| `VITE_SUPABASE_URL` | Ton URL Supabase | Non |
| `VITE_SUPABASE_ANON_KEY` | Ta clé anon | Oui |
| `VITE_VAPID_PUBLIC_KEY` | Clé publique VAPID (push) | Non |
| `VITE_POSTHOG_KEY` | Clé PostHog (si utilisé) | Non |

4. **Redéploie** pour prendre en compte les variables (Deployments → … → Retry deployment)

---

### Étape 3 : Domaine personnalisé rugbyforge.fr

1. Dans **Workers & Pages** → ton projet → **Custom domains**
2. Clique **Set up a custom domain**
3. Saisis `rugbyforge.fr`
4. Cloudflare te propose :
   - **Si le domaine est déjà sur Cloudflare :** simple enregistrement CNAME ou proxy
   - **Si le domaine est ailleurs :** tu devras ajouter un enregistrement chez ton registrar
5. Suis les instructions (souvent : CNAME `rugbyforge.fr` → `rugbyprep-v2.pages.dev` ou équivalent)
6. Attends la propagation DNS (quelques minutes à quelques heures)
7. Cloudflare provisionne automatiquement le certificat SSL (HTTPS)

---

### Étape 4 : Support des routes SPA (React Router)

Par défaut, une PWA React avec routage côté client peut renvoyer 404 sur les routes directes (ex. `/legal`, `/profile`). Cloudflare Pages gère cela via un fichier `_redirects` ou `_headers` dans `public/`.

1. Crée ou mets à jour `public/_redirects` :

   ```
   /*    /index.html   200
   ```

   Cela indique à Cloudflare de servir `index.html` pour toutes les routes, ce qui permet au routeur React de gérer l'URL.

2. Vérifie que `public/_redirects` existe — sinon crée-le
3. Rebuild et redéploie

---

### Checklist

- [ ] Build Cloudflare Pages réussi
- [ ] App accessible en HTTPS sur rugbyforge.fr
- [ ] Variables d'environnement configurées
- [ ] PWA installable (icône « Ajouter à l'écran d'accueil » sur mobile)
- [ ] Routes directes OK (ex. rugbyforge.fr/legal)

### Sécurité

- Ne jamais ajouter `STRIPE_SECRET_KEY` ou `ANTHROPIC_API_KEY` sur Cloudflare : ces clés restent côté Supabase Edge Functions

### Ressources

- [Cloudflare Pages - Vite](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Custom domains on Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/)

---

## 5. Configurer webhooks Stripe et Supabase en production

### URL de l'app

Les `success_url` et `cancel_url` de Stripe doivent pointer vers `https://rugbyforge.fr`.

### Webhook Stripe en production

1. [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) → Add endpoint
2. URL : `https://[TON-PROJET].supabase.co/functions/v1/billing-webhook`
3. Événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Récupère le `whsec_xxx` et mets-le dans les secrets Supabase

---

## 6. Google Play : PWA → TWA (guide approfondi)

### Objectif

Publier RugbyForge sur le Play Store en enveloppant la PWA dans une **Trusted Web Activity (TWA)**. L'app Android affiche ton site web en plein écran, sans barre d'URL.

---

### Prérequis

- PWA déployée en HTTPS sur `https://rugbyforge.fr`
- Web App Manifest accessible à `https://rugbyforge.fr/manifest.webmanifest`
- Compte Google Play Developer (~25 €, paiement unique)
- Node.js installé

---

### Étape 1 : Installer Bubblewrap

Bubblewrap est l'outil officiel Google pour créer une TWA à partir d'une PWA.

```bash
# Option A : via npx (recommandé)
npx @bubblewrap/cli init --manifest=https://rugbyforge.fr/manifest.webmanifest

# Option B : installation globale
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://rugbyforge.fr/manifest.webmanifest
```

> **Important :** L'URL du manifest doit être celle de ta PWA **déjà en production** sur rugbyforge.fr.

---

### Étape 2 : Configuration Bubblewrap (wizard)

Bubblewrap pose des questions. Valeurs recommandées pour RugbyForge :

| Question | Valeur |
|----------|--------|
| Application name | RugbyForge |
| Package name | `app.rugbyforge` ou `fr.rugbyforge.app` (format inverse domaine) |
| Host (start URL) | `https://rugbyforge.fr` |
| Launch URL | `https://rugbyforge.fr` |
| Icon URL | `https://rugbyforge.fr/icons/icon-512.png` |
| Maskable icon URL | idem ou URL d'une icône 512×512 maskable |
| Theme color | `#e11d48` (ou ton theme_color du manifest) |
| Background color | `#ffffff` |
| Display mode | `standalone` |

---

### Étape 3 : Clé de signature (Signing Key)

Google Play exige que l'app soit signée.

- **Première app :** laisse Bubblewrap générer une clé (il te demande un chemin et un mot de passe). **Sauvegarde cette clé** — tu en auras besoin pour les mises à jour.
- **App existante :** fournis le chemin vers ta clé existante (keystore `.jks` ou `.keystore`).

---

### Étape 4 : Générer l'Android App Bundle (AAB)

```bash
cd [répertoire du projet Bubblewrap]
bubblewrap build
```

Résultat :
- `app-release-bundle.aab` — à uploader sur le Play Console
- `app-release-signed.apk` — pour tests directs sur un appareil (`bubblewrap install`)

---

### Étape 5 : Créer l'app dans Play Console

1. [play.google.com/console](https://play.google.com/console) → Create app
2. Remplis :
   - App name : RugbyForge
   - Default language : Français
   - App or game : App
   - Free or paid : Free (avec achats in-app via Stripe web)
3. Accepte les déclarations (politique de confidentialité obligatoire)

---

### Étape 6 : Digital Asset Links (essential pour TWA fullscreen)

**Sans Digital Asset Links, l'app s'ouvre mais la barre d'URL reste visible.**

1. **Obtenir le SHA-256 du certificat de signature**
   - Si tu as utilisé **Play App Signing** (recommandé) : Play Console → ton app → Release → Setup → App integrity → App signing key certificate → copie le **SHA-256 certificate fingerprint**
   - Sinon (clé locale) :
     ```bash
     keytool -list -v -keystore [chemin/keystore.jks] -alias [alias] | grep SHA256
     ```
   - Copie la valeur hex (ex. `BD:92:64:B0:1A:B9:08:08:FC:FE:...`)

2. **Ajouter le fingerprint à Bubblewrap**
   ```bash
   bubblewrap fingerprint add [SHA256_FINGERPRINT]
   ```
   Exemple : `bubblewrap fingerprint add BD:92:64:B0:1A:B9:08:08:FC:FE:7F:94:B2:...`

3. **Générer assetlinks.json**
   Bubblewrap crée/met à jour `assetlinks.json` dans ton projet.

4. **Héberger assetlinks.json**
   Le fichier doit être accessible à :
   ```
   https://rugbyforge.fr/.well-known/assetlinks.json
   ```
   - Crée le dossier `public/.well-known/` dans ton projet Vite
   - Copie le `assetlinks.json` généré dans `public/.well-known/assetlinks.json`
   - Déploie (ou copie le contenu dans ton hébergement)

5. **Vérifier**
   ```bash
   curl https://rugbyforge.fr/.well-known/assetlinks.json
   ```
   Ou utilise [Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)

---

### Étape 7 : Préparer les assets Play Store

| Asset | Spécifications |
|-------|----------------|
| Icône haute résolution | 512×512 PNG, sans transparence |
| Feature graphic | 1024×500 (optionnel mais recommandé) |
| Screenshots | Au moins 2, téléphone (16:9 ou 9:16) |
| Description courte | 80 caractères max |
| Description longue | 4000 caractères max |
| Politique de confidentialité | URL obligatoire : `https://rugbyforge.fr/legal` |

---

### Étape 8 : Test interne puis production

1. **Internal testing**
   - Release → Testing → Internal testing → Create new release
   - Upload `app-release-bundle.aab`
   - Crée une liste de testeurs (emails)
   - Start rollout

2. **Tester sur ton appareil**
   - Copie le lien d'opt-in des testeurs
   - Ouvre-le sur ton Android → installe l'app
   - Vérifie : app fullscreen, pas de barre d'URL, PWA fonctionnelle

3. **Production**
   - Quand tout est OK : Release → Production → Create new release
   - Upload le même AAB
   - Remplis la fiche store (description, screenshots, catégorie Sport/Fitness)
   - Submit for review

---

### Checklist TWA

- [ ] PWA en prod sur rugbyforge.fr
- [ ] Bubblewrap init avec manifest URL
- [ ] AAB généré avec `bubblewrap build`
- [ ] Compte Play Developer créé
- [ ] SHA-256 récupéré (Play App Signing ou keytool)
- [ ] `assetlinks.json` à `/.well-known/assetlinks.json`
- [ ] Test interne : app fullscreen sans barre d'URL
- [ ] Assets Play Store prêts
- [ ] Politique de confidentialité : rugbyforge.fr/legal

### Ressources

- [PWA in Play - Codelab Google](https://developers.google.com/codelabs/pwa-in-play)
- [Bubblewrap GitHub](https://github.com/GoogleChromeLabs/bubblewrap)
- [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)

---

## 7. Lien vers la politique de confidentialité (stores)

### Statut

- LegalPage accessible via Profil → « Mentions légales »
- URL prod : `https://rugbyforge.fr/legal` — à indiquer dans les fiches Play Store et App Store

---

## Récapitulatif

| # | Tâche | Statut |
|---|-------|--------|
| 1 | Flux Stripe | ✅ Fait |
| 2 | Secrets dans le code | À vérifier |
| 3 | CGU / Confidentialité | ✅ Fait |
| 4 | Déploiement Cloudflare | Guide §4 |
| 5 | Webhooks + Supabase prod | Guide §5 |
| 6 | Google Play TWA | Guide §6 (approfondi) |
| 7 | Lien confidentialité | rugbyforge.fr/legal |

---

*Document mis à jour pour RugbyForge — domaine rugbyforge.fr.*
