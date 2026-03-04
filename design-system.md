# Design System — RugbyForge · Stitch Edition
## Rugby Training App · Mobile First · Lexend + Dark Auth

---

## Visual Identity

Premium sports app. Warm cream light mode for training screens. Deep dark (`#1a100c`) for auth/landing.
Typographic wordmark: **RUGBY** in rugby green + **FORGE** in forge orange (custom rugby-ball O glyph), Lexend ExtraBold 800.
Confident, athletic — like a top-tier fitness platform with a rugby soul.

---

## Color Palette

### Brand Colors
- Rugby Green (primary brand): `#1a5f3f`
- Forge Orange (CTA / energy): `#ff6b35`
- Forge Orange hover: `#e55a2b`

### Backgrounds
- Page background (light / app): `#faf9f7` (warm cream) → `bg-[#faf9f7]`
- Auth / landing background (dark): `#1a100c` (warm almost-black)
- Surface / card (light mode): `#ffffff` → `bg-white`
- Surface (dark mode): `#23140f`

### Text
- Primary text (light): `text-slate-900` / `text-[#1f2937]`
- Secondary / muted: `text-slate-400` / `text-[#6b7280]`
- On dark backgrounds: `text-white`
- Muted on dark: `text-white/60`
- Brand label cap: `text-[#1a5f3f] uppercase italic text-xs font-bold tracking-widest`

### Semantic
- Error: `text-rose-600` / `bg-rose-50 border-rose-100`
- Success: `text-emerald-600` / `bg-emerald-50 border-emerald-100`
- Warning: `text-amber-600` / `bg-amber-50 border-amber-100`

---

## Typography

**Font family:** Lexend (Google Fonts) — weights 300–900
**Global class:** `font-['Lexend']` or set via global CSS

- Wordmark / hero: `text-4xl font-[800] tracking-tighter` (Lexend ExtraBold)
  - RUGBY part: `text-[#1a5f3f]`
  - FORGE part: `text-[#ff6b35]` (with rugby-ball "O" glyph — see RugbyForgeLogo component)
- Page title: `text-xl font-extrabold tracking-tight`
- Section heading: `text-sm font-black uppercase tracking-wider text-slate-400`
- Body / description: `text-sm text-slate-400 leading-relaxed`
- Stat value: `text-lg font-black tracking-tight leading-none`
- Stat label: `text-[10px] font-bold uppercase tracking-tighter text-slate-400`
- Badge text: `text-[10px] font-black tracking-widest uppercase`
- CTA button: `font-bold` (not italic in new system)
- Label/input label: `text-xs font-bold uppercase tracking-wider text-slate-500`

---

## Spacing & Layout

- Page max width: `max-w-md mx-auto`
- Horizontal padding: `px-6`
- Section gap: `space-y-5` or `space-y-6`
- Card inner padding: `p-5` to `p-6`
- Header padding: `px-6 py-4`
- Bottom nav height: `h-20 pb-safe`

---

## Border Radius

- Hero card / large surfaces: `rounded-[2rem]`
- Secondary cards: `rounded-3xl` / `rounded-[24px]`
- Buttons (pill CTA): `rounded-full`
- Buttons (standard): `rounded-2xl`
- Inputs: `rounded-2xl`
- Badges / chips: `rounded-full`
- Avatar: `rounded-full`
- Icon containers: `rounded-xl` to `rounded-2xl`

---

## Shadows

- Hero card: `shadow-2xl`
- Cards: `shadow-sm`
- CTA button (green): `shadow-lg shadow-[#1a5f3f]/30`
- CTA button (orange): `shadow-lg shadow-[#ff6b35]/30`

---

## Component Patterns

### Typographic Wordmark (Auth / Landing)
```tsx
<h1 className="text-4xl font-[800] tracking-tighter flex items-baseline gap-0">
  <span className="text-[#1a5f3f]">RUGBY</span>
  <RugbyForgeLogo size="hero" />
</h1>
<p className="text-white/50 text-xs font-bold tracking-widest uppercase mt-1">
  Préparation physique rugby
</p>
```

### Page Header (Sticky, Light)
```tsx
<header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
  <div>
    <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyForge</p>
    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">[Title]</h1>
  </div>
</header>
```

### Auth Screen Layout (Dark)
```tsx
<div className="min-h-screen bg-[#1a100c] flex flex-col px-6 py-10">
  {/* Wordmark at top */}
  {/* Form in center */}
  {/* Link at bottom */}
</div>
```

### Primary CTA Button (Orange Pill)
```tsx
<button className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-[#ff6b35]/30 disabled:opacity-60 disabled:cursor-not-allowed">
  [Label]
</button>
```

### Secondary CTA Button (Green)
```tsx
<button className="w-full py-4 rounded-2xl bg-[#1a5f3f] hover:bg-[#1a5f3f]/90 text-white font-bold transition-all shadow-lg shadow-[#1a5f3f]/30">
  [Label]
</button>
```

### Ghost / Outline Button
```tsx
<button className="w-full h-14 rounded-full border-2 border-white/20 text-white/80 hover:border-white/40 font-bold text-sm transition-all">
  [Label]
</button>
```

### Input Field (Dark Auth)
```tsx
<input className="w-full h-14 rounded-2xl border-2 border-white/20 bg-white/5 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff6b35] text-sm transition-colors" />
```

### Input Field (Light App)
```tsx
<input className="w-full h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35]/60 transition-colors" />
```

### Card (Light App)
```tsx
<div className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
  {/* content */}
</div>
```

### Hero Card (Dark, Session)
```tsx
<div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl">
  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b35] opacity-20 blur-3xl -mr-10 -mt-10" />
  <div className="relative p-7 space-y-5">
    {/* content */}
  </div>
</div>
```

### Stat Chip
```tsx
<div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
  <div className="p-2 rounded-2xl bg-gray-50 text-[#ff6b35]">
    <Icon className="w-5 h-5" />
  </div>
  <div className="text-lg font-black tracking-tight text-slate-900 leading-none">[Value]</div>
  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">[Label]</div>
</div>
```

### Section Heading
```tsx
<h2 className="text-sm font-black uppercase tracking-wider text-slate-400">[Title]</h2>
```

### Bottom Navigation Bar
```tsx
<nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around px-8 z-50">
  {/* Active: text-[#ff6b35] */}
  {/* Inactive: text-slate-300 */}
</nav>
```

### Error / Info Banner
```tsx
{/* Error */}
<div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
  <p className="text-xs text-rose-700 font-medium">[message]</p>
</div>
{/* Info */}
<div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
  <p className="text-xs text-emerald-700 font-medium">[message]</p>
</div>
```

---

## Iconography
Library: `lucide-react`
Active / accent: `text-[#ff6b35]`
Brand / primary: `text-[#1a5f3f]`
Inactive: `text-slate-300` or `text-slate-400`
Icon sizes: `w-5 h-5` (standard), `w-6 h-6` (nav), `w-4 h-4` (inline/meta)

---

## Decorative Patterns
- Glow orb on dark cards: `absolute w-32 h-32 bg-[#ff6b35] opacity-20 blur-3xl`
- Dot grid on dark surfaces: `bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:16px_16px] opacity-5`
- Divider line: `border-b border-gray-100`

---

## Tech Stack
- React 19 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/vite, no tailwind.config file)
- Lexend font (Google Fonts, weights 300–900)
- lucide-react (icons)
- framer-motion (optional animations)
