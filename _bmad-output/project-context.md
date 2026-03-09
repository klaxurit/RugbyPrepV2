---
project_name: 'RugbyPrepV2'
user_name: 'Coach'
date: '2026-03-09'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 47
optimized_for_llm: true
---

# Project Context for AI Agents

_Ce fichier contient les règles critiques et patterns que les agents IA doivent suivre lors de l'implémentation de code dans ce projet. Focus sur les détails non-évidents que les LLMs risquent de manquer._

---

## Technology Stack & Versions

| Technologie | Version | Contrainte |
|---|---|---|
| React | 19.2 | react-jsx, named exports (pas de default) |
| TypeScript | ~5.9 | strict, verbatimModuleSyntax, noUnusedLocals |
| Vite | 7.2 | @tailwindcss/vite plugin (pas de PostCSS) |
| Tailwind CSS | 4.1 | Utility-first exclusif, pas de CSS custom |
| Supabase JS | 2.97 | Auth + PostgreSQL + Edge Functions Deno |
| react-router-dom | 7.13 | — |
| Framer Motion | 12.34 | Animations modals/transitions |
| Recharts | 3.7 | Graphiques progression |
| Lucide React | 0.574 | Source unique d'icônes |
| PostHog | 1.357 | Analytics |
| vite-plugin-pwa | 1.2 | injectManifest, SW custom src/sw.ts |
| Workbox | 7.4 | Precaching |
| Vitest | 4.0 | Tests unitaires, env node |
| ESLint | 9.39 | Flat config + Prettier 3.8 |

**Contraintes critiques :**
- `verbatimModuleSyntax: true` → `import type { X }` obligatoire pour tout import de type
- `target: ES2022` + `module: ESNext` → syntaxe moderne, pas de CommonJS
- Tailwind 4 via `@tailwindcss/vite` — pas de fichier PostCSS, pas de tailwind.config.js
- PWA strategy `injectManifest` → service worker custom dans `src/sw.ts`
- Pas de path aliases (`@/`) — tous les imports sont relatifs

## Critical Implementation Rules

### Règles TypeScript

**Configuration compilateur :**
- `strict: true` — pas de `any` implicite, null checks obligatoires
- `noUnusedLocals` + `noUnusedParameters` — code mort interdit
- `erasableSyntaxOnly: true` — pas de `enum` runtime, utiliser unions de string littéraux (`type X = 'a' | 'b'`)

**Import/Export :**
- `import type { X }` obligatoire pour tout import de type (enforced par compilateur)
- Named exports partout (`export function X` / `export const X`) — jamais `export default` sauf `App.tsx`
- Imports relatifs uniquement — jamais de `@/` ni path alias
- Ordre : React → libs tierces → services → hooks → composants → types

**Types :**
- `interface` pour objets multi-champs (`UserProfile`, `TrainingBlock`)
- `type` pour unions et primitives (`Equipment`, `CycleWeek`, `Result<T,E>`)
- Champs optionnels : `field?: Type` (pas `field: Type | undefined`)
- Types DB row (`type XxxRow = {...}`) toujours locaux au hook — jamais exportés
- Pattern Result : `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`

**Gestion d'erreurs :**
- Supabase : `const { data, error } = await supabase.from(...)` → guard `if (error || !data) return`
- localStorage : `try/catch` silencieux, retour valeur par défaut
- Pas de `throw` dans les services — retourner un `Result` ou gérer silencieusement

### Règles React / Framework

**Pattern data hook (localStorage + Supabase sync) :**
1. `STORAGE_KEY = 'rugbyprep.<domain>.v<version>'` — constante module-level
2. Helpers purs `readFromStorage()` / `saveToStorage()` — hors du hook, niveau module
3. Mapping DB `rowToXxx()` / `xxxToRow()` — niveau module, types `XxxRow` locaux non exportés
4. State initialisé via lazy initializer : `useState<T[]>(readFromStorage)`
5. `useEffect([userId])` pour sync Supabase au montage
6. Mutations via `useCallback` — écriture optimiste localStorage + fire-and-forget Supabase

**Hooks :**
- Context accessor : `useContext` + throw si null (provider guard)
- Computation : `useMemo` pour tout calcul dérivé
- Tous les hooks en named export (`export const useXxx` ou `export function useXxx`) — jamais default

**Composants :**
- Pages : `export function XxxPage()` — named export, suffixe `Page`
- Props : `interface XxxProps` définie juste avant le composant, même fichier
- Constantes module-level (lookup objects, presets) avant le composant
- Types locaux non exportés si usage interne uniquement

**State management :**
- 2 contextes : `AuthContext` + `WeekContext` — pas de Redux/Zustand
- Context value wrappée dans `useMemo` dans le Provider
- Pattern split : `xxxContext.ts` (createContext) / `XxxProvider.tsx` (Provider) / `xxxStorage.ts` (helpers purs)

**UI :**
- Icônes : `lucide-react` exclusivement
- Animations : `framer-motion` pour modals/transitions
- Styling : Tailwind classes uniquement — jamais de CSS custom, `style={{}}`, CSS modules
- Classes conditionnelles : `clsx` + `tailwind-merge`

### Règles de test

- Framework : Vitest 4.0, environment `node`, pattern `src/**/*.test.ts`
- Tests sur services purs uniquement — pas de tests hooks/pages
- `describe` / `it` en anglais
- Pas de mocks Supabase — tester la logique pure extraite dans les services
- Tout nouveau service pur → fichier `.test.ts` associé obligatoire
- Edge cases moteur : tester combinaisons profil × équipement × blessure × ACWR
- Commandes : `npm run test` (run once) · `npm run test:watch` (watch)

### Code Quality & Style

**Linting :**
- ESLint 9 flat config + Prettier — `npm run lint` obligatoire
- Plugins : `react-hooks`, `react-refresh`
- Ignores : `dist`, `node_modules`, `.agents`, `.cursor`, `.claude`

**Organisation fichiers :**
- `src/pages/` — PascalCase + suffixe `Page`
- `src/components/` — PascalCase, sous-dossiers par feature (`modals/`, `auth/`)
- `src/hooks/` — camelCase, préfixe `use`
- `src/services/` — logique pure, sous-dossiers par domaine (`program/`, `athleticTesting/`, `ui/`)
- `src/types/` — types par domaine, camelCase `.ts`
- `src/data/` — données statiques, suffixe `.v1` versionné
- `src/knowledge/` — base scientifique Markdown (~3700 lignes, 186+ refs)
- `src/contexts/` — pattern split : `xxxContext.ts` / `XxxProvider.tsx` / `xxxStorage.ts`

**Naming :**
- Variables/fonctions : camelCase · Composants/types : PascalCase
- Fichiers pages/composants : PascalCase `.tsx` · hooks/services/types : camelCase `.ts`
- Données versionnées : `.v1` (`blocks.v1.json`, `sessionRecipes.v1.ts`)
- localStorage : `rugbyprep.<domain>.v<version>`

**Langues :**
- UI et documentation utilisateur : français
- Code (variables, types, noms de fonctions) : anglais
- Pas de JSDoc systématique — seulement si logique non-évidente

### Workflow développement

**Déploiement :**
- Frontend : Cloudflare Pages — `npm run build` → `dist`
- Backend : `supabase db push` (migrations) + `supabase functions deploy` (Edge Functions)
- SPA redirect : `public/_redirects` → `/* /index.html 200`
- Variables env frontend : préfixe `VITE_` obligatoire
- Secrets Edge Functions : Dashboard Supabase uniquement (pas dans .env)

**Supabase :**
- Migrations : `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- RLS obligatoire sur toute nouvelle table : `auth.uid() = user_id`
- Edge Functions Deno : shared code dans `supabase/functions/_shared/`
- Dual client pattern : user-scoped (RLS) + service role (admin)

**Build :**
- `npm run build` inclut `tsc -b` — toujours vérifier avant commit
- `npm run lint` — ESLint + Prettier
- Pas de CI/CD — vérification locale obligatoire

### Règles critiques "Don't-Miss"

**Anti-patterns absolus :**
- **JAMAIS** appeler `buildSessionFromRecipe()` depuis une page → seul `buildWeekProgram()` est le point d'entrée programme
- **JAMAIS** de side effects dans `src/services/` → fonctions pures uniquement
- **JAMAIS** `export default` (sauf `App.tsx`)
- **JAMAIS** de `enum` TypeScript → unions de string littéraux (`type X = 'a' | 'b'`)
- **JAMAIS** de CSS custom, `style={{}}`, CSS modules → Tailwind classes uniquement
- **JAMAIS** exporter un type `XxxRow` depuis un hook → mapping DB strictement local
- **JAMAIS** de nouvelle dépendance d'icônes → `lucide-react` exclusivement

**Architecture moteur programme :**
- `buildWeekProgram(profile, week, options?)` = seule source de vérité programme
- L'IA coach ne contrôle jamais la structure du programme — explication/conseil uniquement
- L'algorithme garde le contrôle : périodisation, ACWR, réhab, cross-session exclusion
- Consulter `src/knowledge/` avant toute décision scientifique sur l'entraînement

**Sécurité :**
- RLS Supabase sur toutes les tables : `auth.uid() = user_id`
- Clé anon (publique) uniquement côté client — jamais de secret
- Stripe : signature HMAC-SHA256 vérifiée dans `billing-webhook`
- Sécurité jamais derrière le paywall — premium = analytics/coaching, pas protection données

**Edge cases moteur connus :**
- Starter + shoulder_pain + BW : slot upper en [SAFETY] → correct cliniquement
- Builder + shoulder_pain + 3x : Full Body slot upper [SAFETY] → limitation acceptée
- Performance + BW only : upper hypertrophy [SAFETY] → edge case extrême
- `selectEligibleBlocks` vérifie contraindications au niveau **exercice** (via `getExerciseById`), pas seulement bloc

---

## Usage Guidelines

**Pour les agents IA :**
- Lire ce fichier avant d'implémenter du code
- Suivre TOUTES les règles exactement comme documentées
- En cas de doute, préférer l'option la plus restrictive
- Mettre à jour ce fichier si de nouveaux patterns émergent

**Pour les humains :**
- Garder ce fichier lean et focalisé sur les besoins des agents
- Mettre à jour quand la stack technique change
- Revoir trimestriellement pour supprimer les règles obsolètes
- Retirer les règles devenues évidentes avec le temps

Dernière mise à jour : 2026-03-09
