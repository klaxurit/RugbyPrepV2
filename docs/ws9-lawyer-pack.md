# RugbyForge — Pack revue juridique (WS9)

**Destinataire** : avocat·e en droit du numérique / RGPD / contrats consommateurs (France)
**Demandeur** : Axurit (éditeur de RugbyForge)
**Contact** : bonjour@rugbyforge.fr
**Date d'envoi** : 2026-05-08
**Budget indicatif** : €500 HT (forfait revue + une passe d'amendements)
**Délai souhaité** : retour sous 1-2 semaines

---

## 1. Contexte produit (lecture rapide)

**Produit** : RugbyForge, application mobile (Android via Play Store / web PWA via Stripe) de préparation physique à destination des joueurs et joueuses de rugby **amateurs majeurs** (18+).

**Modèle métier** :
- **Algorithmique** : génère automatiquement des programmes d'entraînement personnalisés à partir d'un profil (poste, niveau, équipement, mode saison, fréquence hebdo, fatigue déclarée). Aucune intervention humaine en boucle.
- **Pas de coach humain**, pas de praticien de santé, pas de validation médicale ou kinésithérapique. L'application est un outil d'aide à l'entraînement, **pas un dispositif médical**.
- **Pas de claim médical** : zéro contenu de soin / réadaptation / guérison / prévention de blessure ciblée surfacé dans les programmes actifs (volet rehab supprimé du périmètre V1, voir Décision #47).
- **Coach IA** (fonctionnalité premium) : conversation textuelle avec un LLM (Anthropic Claude) sur la nutrition, récupération, sommeil, motivation. **Ne pose pas de diagnostic** ; rappel intégré dans le system prompt + UI.

**Monétisation** :
- Freemium. Abonnement premium 7-9 €/mois ou 59-79 €/an. Offre Founding (limitée à 100-300 utilisateurs précoces, prix réduit à vie).
- **Android** : encaissement obligatoirement via **Google Play Billing** (politique Google).
- **iOS** (V1.1 envisagée, pas V1) : non concerné par V1.
- **Web (PWA)** : encaissement via **Stripe** (carte bancaire SCA EU). Abonnement web ne donne PAS accès Android Play (deux entitlements distincts).

**Hébergement / sous-traitants** :
- Frontend : Cloudflare Pages
- Backend / DB / Auth : **Supabase** (PostgreSQL EU, Édimbourg)
- Push : Firebase Cloud Messaging (FCM) — VAPID natif WebCrypto
- Analytics : **PostHog** (UE, ingest via posthog.com EU cluster)
- IA : **Anthropic** (API Claude, US ; transferts encadrés par DPA Anthropic + clauses contractuelles types CCT EU-US)
- Paiements : **Google Play Billing** (Android) ; **Stripe** (web, Stripe France SA)
- Erreurs : Sentry (envisagé V1.1, non actif V1)

**Audience** :
- **Strictement 18+**. Vérifié par auto-déclaration au signup.
- Pas de population vulnérable visée. Pas d'enfants, pas de personnes en convalescence post-opératoire.
- Marché initial France métropolitaine. UE en pratique via Play Store.

**Statut V1** : pré-lancement. Bêta interne (10-20 testeurs) en cours, ouverture publique visée fin juin 2026 (anchor pré-saison rugby FR juillet/août).

---

## 2. Questions ciblées pour la revue

Merci de prioriser :

1. **Disclaimer médical au signup (hard gate)** : la copie courte proposée (§4.1) est-elle suffisante pour limiter la responsabilité de l'éditeur en cas de blessure ou de plainte d'un utilisateur ? Faut-il une formulation plus explicite mentionnant l'absence de qualité médicale du service ? La rédaction passive actuelle de la `LegalPage` (§3.3) est-elle juridiquement équivalente ou doit-elle être renforcée ?

2. **Algorithme prescrivant des charges** : un algorithme proposant `4×5 reps @ 85% 1RM` à un amateur sans encadrement humain pose-t-il un risque de qualification en "exercice illégal de la médecine" ou en "dispositif médical non certifié" en droit FR/UE ? Les clauses de §3.1 art. 4 ("Limitation de responsabilité") sont-elles suffisamment robustes ?

3. **Coach IA (LLM)** : la rédaction §3.2 ("ne réalise aucun diagnostic médical") est-elle suffisante au regard de l'**AI Act** (entrée en vigueur progressive 2025-2027) ? Y a-t-il des obligations d'information utilisateur supplémentaires à intégrer (transparence sur l'usage IA, étiquetage de contenu généré) ?

4. **CGU Play Billing** : les clauses CGU actuelles (§3.1) sont-elles complètes pour un produit encaissé via Google Play ? Manque-t-il des mentions sur le **droit de rétractation 14 jours** (DDADUE 2014/83/UE), la **résiliation**, la **gestion des remboursements via Play Store**, le **transfert des litiges paiement à Google** ?

5. **Privacy / RGPD** : la politique de confidentialité (§3.2) est-elle complète vis-à-vis du RGPD ? Manque-t-il : DPO contact (non requis ici, à confirmer), durée de conservation détaillée par type de donnée, base légale par traitement (consentement vs intérêt légitime vs contrat), procédure de notification de violation, mention du droit à la limitation du traitement ?

6. **Cookies & traceurs (PostHog)** : PostHog est un outil d'analytique qui pose des cookies de session et utilise un identifiant utilisateur après login. La copie banner cookies proposée (§4.3) et le mécanisme **opt-in avant init PostHog** sont-ils conformes ? Faut-il distinguer cookies "essentiels" (auth Supabase) vs "analytiques" (PostHog) avec consentement séparé ?

7. **Transfert hors UE (Anthropic US)** : le traitement Coach IA envoie des données personnelles (profil sportif, historique récent) à Anthropic (US). Sur la base des CCT EU-US et de la décision d'adéquation Data Privacy Framework 2023, l'information utilisateur §3.2 est-elle suffisante ou faut-il un consentement explicite séparé ?

8. **Mentions légales obligatoires** : la rubrique Contact (§3.4) est-elle complète au regard de l'art. 6 III LCEN ? Manque-t-il : SIREN/SIRET, capital social, RCS, directeur de la publication, hébergeur (raison sociale + adresse) ?

9. **Auto-déclaration âge 18+** : suffit-elle juridiquement ? Y a-t-il une procédure de vérification renforcée à mettre en place compte tenu de la nature physique du produit (charges, intensité) ?

---

## 3. Documents en revue (verbatim production V1)

### 3.1 CGU actuelles (LegalPage.tsx, dernière màj avril 2026)

**0. Éditeur du service**

RugbyForge est un service édité par Axurit, organisation responsable de la publication de l'application et du site rugbyforge.fr.

Pour toute demande liée au compte développeur Google Play, au support utilisateur ou à la protection des données, vous pouvez nous contacter à bonjour@rugbyforge.fr.

**1. Objet**

RugbyForge est une application de préparation physique destinée aux joueurs et joueuses de rugby adultes (18 ans et plus). Elle génère des programmes d'entraînement personnalisés basés sur votre profil et votre historique.

En accédant à l'application, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU).

**2. Accès et inscription**

L'utilisation de RugbyForge nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions réalisées depuis votre compte.

RugbyForge est réservé aux personnes majeures (18 ans ou plus). En créant un compte, vous confirmez avoir au moins 18 ans.

**3. Propriété intellectuelle**

L'ensemble du contenu de l'application (programmes, algorithmes, textes, design) est la propriété exclusive de RugbyForge. Toute reproduction, modification ou redistribution est interdite sans autorisation écrite préalable.

**4. Limitation de responsabilité**

RugbyForge est fourni "tel quel", sans garantie d'adéquation à un usage particulier. Nous ne sommes pas responsables des blessures, pertes de performances ou tout autre préjudice résultant de l'utilisation des programmes générés.

Les programmes sont générés automatiquement par algorithme et ne se substituent pas à l'accompagnement d'un professionnel de santé ou d'un coach qualifié.

**5. Modifications**

RugbyForge se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication dans l'application. L'utilisation continuée du service vaut acceptation des nouvelles CGU.

### 3.2 Politique de confidentialité actuelle (LegalPage.tsx, RGPD UE 2016/679)

**Données collectées**

Nous collectons : adresse email, prénom (optionnel), données de profil sportif (poste, niveau, équipement), historique des séances, données de tests physiques.

Nous collectons également des données liées à la personnalisation de votre programme : zones sensibles déclarées (épaule, genou, dos, etc.) et morphologie (taille, poids). Ces données sont utilisées exclusivement pour adapter les exercices et les charges de votre programme d'entraînement.

Ces données sont nécessaires au fonctionnement du service et ne sont pas vendues.

Lorsque vous utilisez la fonctionnalité Coach IA, les données nécessaires à la génération de conseils (profil sportif, zones sensibles déclarées, historique récent) sont transmises à un fournisseur externe de traitement par intelligence artificielle (Anthropic). Ces données sont envoyées uniquement pour produire la réponse demandée. Leur conservation éventuelle par le fournisseur est régie par sa politique de conservation des données API en vigueur. Le Coach IA fournit des conseils de préparation physique et ne réalise aucun diagnostic médical.

Les données analytiques collectées via PostHog (hébergé en UE) sont agrégées et ne contiennent pas de données personnelles individuelles.

**Hébergement et sous-traitants**

Vos données sont hébergées sur Supabase (infrastructure PostgreSQL sécurisée, EU). Le traitement IA du Coach est assuré par Anthropic (API Claude). Des outils d'analyse anonymisés (PostHog) peuvent collecter des données d'usage agrégées pour améliorer l'application. Les paiements sont traités par Google Play Billing sur Android et par Stripe sur le web.

**Paiements et données bancaires**

RugbyForge ne conserve pas vos informations de carte bancaire. Sur Android, les abonnements sont encaissés via Google Play Billing / Google Payments. Sur le web, les paiements sont sécurisés par Stripe. Consultez les politiques de confidentialité des prestataires de paiement concernés pour plus de détails sur le traitement des données de paiement.

**Vos droits (RGPD)**

Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données.

Pour exercer ces droits ou pour toute question, contactez-nous à : bonjour@rugbyforge.fr

**Suppression de compte et droit à l'effacement**

Vous pouvez demander la suppression de votre compte à tout moment depuis la page dédiée /delete-account ou en nous contactant à bonjour@rugbyforge.fr. La suppression entraîne l'effacement de toutes vos données personnelles : profil, historique de séances, tests physiques et calendrier.

La suppression est effective dans un délai de 30 jours suivant la demande. Les données analytiques agrégées et anonymisées peuvent être conservées à des fins statistiques.

### 3.3 Disclaimer médical actuel (LegalPage.tsx, bandeau passif)

> **Avertissement important**
>
> Les programmes d'entraînement générés par RugbyForge sont fournis à titre indicatif et ne remplacent pas l'avis d'un médecin, kinésithérapeute ou préparateur physique certifié.
>
> Avant de commencer tout programme d'entraînement intensif, consultez un professionnel de santé, en particulier si vous avez des antécédents médicaux, des blessures en cours ou si vous reprenez l'activité après une longue pause.
>
> **En cas de douleur, arrêtez immédiatement l'exercice et consultez un médecin.**

**Mode actuel** : passif. Affiché en haut de la page `/legal`, accessible librement, mais **pas de hard gate ni d'acceptation traçable au signup**.

### 3.4 Contact actuel (LegalPage.tsx)

> Service édité par **Axurit**.
>
> Pour toute question relative aux présentes mentions légales ou à vos données personnelles :
> bonjour@rugbyforge.fr
> [Demander la suppression du compte](/delete-account)

---

## 4. Documents proposés (à valider)

### 4.1 Disclaimer médical — copie courte pour hard gate signup (proposée)

**Mode visé** : checkbox bloquante au signup, séparée de la checkbox "18+ et CGU/Privacy". Soumission impossible sans coche. Timestamp persisté en base (`profiles.medical_consent_accepted_at`).

> **Disclaimer médical**
> Je comprends que RugbyForge propose des programmes basés sur des règles générales et ne remplace pas l'avis d'un médecin ou d'un kinésithérapeute. Je m'engage à arrêter en cas de douleur. [Lire le détail](/legal#disclaimer)

**Demande à l'avocat** : valider la copie ou proposer une formulation amendée. Confirmer si la traçabilité timestamp + acceptation séparée constitue une preuve de consentement informé suffisante.

### 4.2 Play Billing — addendum CGU proposé

**Insertion proposée** : nouvelle section CGU "**6. Abonnements et paiements (Google Play / Stripe)**".

> **6. Abonnements et paiements**
>
> 6.1 — Sur Android, les abonnements RugbyForge Premium sont encaissés exclusivement via Google Play Billing (Google Payments). Les conditions de paiement, de renouvellement automatique et de remboursement sont régies par le Contrat Google Play que vous acceptez à l'inscription au Play Store.
>
> 6.2 — Sur le web (PWA), les abonnements sont encaissés via Stripe Payments Europe Ltd. Les conditions de Stripe s'appliquent au traitement de la transaction.
>
> 6.3 — **Droit de rétractation** : conformément à l'article L221-28 du Code de la consommation, vous disposez d'un délai de rétractation de 14 jours à compter de l'achat de l'abonnement. Pour exercer ce droit, contactez Google Play (Android) ou Stripe (web) selon le canal d'achat. RugbyForge ne traite pas directement les remboursements.
>
> 6.4 — Les abonnements souscrits via Play Store sont gérés exclusivement depuis votre compte Google (paramètres Play Store → Paiements et abonnements). Les abonnements Stripe sont gérés depuis votre espace utilisateur RugbyForge.
>
> 6.5 — En cas de litige paiement, RugbyForge vous oriente vers le canal de paiement concerné (Google Play ou Stripe) qui assume la responsabilité de la transaction.

**Demande à l'avocat** : compléter / amender. Vérifier conformité au droit français + DGCCRF + arrêté DDADUE.

### 4.3 Cookies banner — copie proposée (PostHog opt-in)

**Mode visé** : bannière non bloquante affichée au premier visit, persistance localStorage, opt-out réversible depuis LegalPage. PostHog **n'est PAS initialisé** avant consent (refus = pas d'analytique).

> **Cookies & analytique**
>
> Nous utilisons des cookies techniques pour assurer le fonctionnement du service (authentification, sauvegarde de session) — toujours actifs, indispensables.
>
> Avec votre accord, nous utilisons aussi PostHog pour mesurer comment l'application est utilisée et l'améliorer. Aucune donnée personnelle individuelle n'est revendue.
>
> [Tout accepter] [Refuser] [Personnaliser]

**Demande à l'avocat** : valider la séparation cookies essentiels vs analytiques. Confirmer que le pattern "init PostHog après opt-in" est conforme CNIL recommandation 2020.

### 4.4 Mentions légales — proposition d'extension (LCEN art. 6 III)

À compléter selon la structure d'Axurit (à valider avec le user) :

> **Éditeur** : Axurit, [forme juridique], capital social [XX €], RCS [Ville XXX XXX XXX], SIRET [14 chiffres], siège social [adresse complète].
> **Directeur de la publication** : [Prénom NOM]
> **Contact** : bonjour@rugbyforge.fr
> **Hébergeur** : Cloudflare, Inc. (frontend) — 101 Townsend St, San Francisco, CA 94107, USA
> **Hébergeur backend / DB** : Supabase Inc. — 970 Toa Payoh North #07-04, Singapore 318992 (data EU, région eu-west-2 Édimbourg)

**Demande à l'avocat** : confirmer périmètre minimal LCEN + valider présentation hébergeurs.

---

## 5. Livrables attendus

À l'issue de la revue (forfait €500 HT) :

1. **Mémo écrit** (3-5 pages) répondant aux 9 questions du §2, avec niveau de risque (vert / jaune / orange / rouge) par sujet.
2. **Versions amendées** des 3.1, 3.2, 4.1, 4.2, 4.3 si modifications proposées (markdown ou Word, peu importe).
3. **1 passe d'amendements** : si on revient avec des questions sur les modifs, une réponse écrite (sans nouvelle facturation).
4. **Recommandations hors-périmètre** (optionnel) : pointer les risques que le forfait n'a pas le temps de creuser, à traiter ultérieurement (audit dédié si V1.1 ou V2 le justifie).

---

## 6. Logistique

- Envoi par email à l'avocat·e retenu·e
- Accusé de réception attendu 48h
- Échéance retour : 2 semaines glissantes, idéalement avant le 22 mai 2026 (intégration en sprint amendements + ship V1 fin juin)
- Signature NDA non exigée (les textes de §3 sont déjà publics dans l'application)

**Toute clarification** : bonjour@rugbyforge.fr
