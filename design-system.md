# Design System — Clean Sports Pro
## Rugby Training App · Mobile First · Vibe 2

---

## Visual Identity
Premium sports app aesthetic inspired by Nike Training / Strava.
Clean white/light-gray base with high-energy crimson (rose) accents and deep navy cards.
Confident, professional, motivating — like a top-tier fitness platform.

---

## Color Palette

### Backgrounds
- Page background: `bg-gray-50` (#f9fafb)
- Surface / card white: `bg-white`
- Dark hero card: `bg-slate-900` (#0f172a)
- Sticky header: `bg-white border-b border-gray-100`

### Accents
- Primary accent (CTA, badges, labels): `bg-rose-600` / `text-rose-600` (#e11d48)
- Accent hover: `hover:bg-rose-500`
- Secondary accent (activity): `text-blue-400`
- Warning / streak: `text-orange-500`
- Achievement: `text-amber-500`

### Text
- Primary text: `text-slate-900`
- Secondary / muted: `text-slate-400`
- On dark surfaces: `text-white`
- Labels / subtext on dark: `text-slate-400`
- Tiny caps label: `text-rose-600 uppercase italic text-xs font-bold tracking-widest`

---

## Typography

- App brand label: `text-xs font-bold tracking-widest text-rose-600 uppercase italic`
- Page title / greeting: `text-xl font-extrabold tracking-tight text-slate-900`
- Hero card title: `text-3xl font-black text-white leading-tight`
- Section heading: `text-sm font-black uppercase tracking-wider text-slate-400`
- Body / description: `text-sm text-slate-400 leading-relaxed`
- Stat value: `text-lg font-black tracking-tight text-slate-900 leading-none`
- Stat label: `text-[10px] font-bold text-slate-400 uppercase tracking-tighter`
- History item title: `text-sm font-bold text-slate-900`
- History item subtitle: `text-xs text-slate-400 italic`
- Badge text: `text-[10px] font-black tracking-widest text-white uppercase`
- CTA button text: `font-black text-white tracking-wide uppercase italic`

---

## Spacing & Layout

- Page max width: `max-w-md mx-auto`
- Horizontal padding: `px-6`
- Section gap: `space-y-6` or `space-y-8`
- Card inner padding: `p-7` (hero) / `p-4` to `p-5` (secondary)
- Header padding: `px-6 py-4`
- Stat chip padding: `p-4`

---

## Border Radius

- Hero card / large surfaces: `rounded-[2rem]` (very round)
- Secondary cards: `rounded-3xl`
- Stat chips: `rounded-3xl`
- Badges / pills: `rounded-full`
- CTA button: `rounded-2xl`
- History item icon: `rounded-2xl`
- Avatar: `rounded-full`

---

## Shadows

- Hero card: `shadow-2xl shadow-slate-200`
- Stat chips: `shadow-sm`
- Secondary cards: `shadow-sm`
- CTA button: `shadow-lg shadow-rose-900/20`

---

## Component Patterns

### Page Header (Sticky)
```tsx
<header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
  <div>
    <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">Rugby Pro</p>
    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Bonjour, [Joueur]</h1>
  </div>
  <div className="h-10 w-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
    <User className="w-6 h-6 text-slate-400" />
  </div>
</header>
```

### Hero Session Card (Dark)
```tsx
<div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-200">
  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600 opacity-20 blur-3xl -mr-10 -mt-10" />
  <div className="relative p-7 space-y-5">
    {/* Category Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-600 rounded-full">
      <Zap className="w-3 h-3 text-white fill-current" />
      <span className="text-[10px] font-black tracking-widest text-white uppercase">[CATEGORY]</span>
    </div>
    {/* Title */}
    <h3 className="text-3xl font-black text-white leading-tight">[Session Title]</h3>
    {/* Meta */}
    <div className="flex items-center gap-4 text-slate-400">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Clock className="w-4 h-4 text-rose-500" />
        [Duration]
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Activity className="w-4 h-4 text-blue-400" />
        [Intensity]
      </div>
    </div>
    {/* CTA */}
    <button className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 transition-all">
      <span className="font-black text-white tracking-wide uppercase italic">Commencer</span>
      <div className="bg-white/20 p-1 rounded-full">
        <Play className="w-4 h-4 text-white fill-current" />
      </div>
    </button>
  </div>
</div>
```

### Stat Chip (3-column grid)
```tsx
<div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
  <div className="p-2 rounded-2xl bg-gray-50 text-rose-600">
    <Icon className="w-5 h-5" />
  </div>
  <div className="text-lg font-black tracking-tight text-slate-900 leading-none">[Value]</div>
  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">[Label]</div>
</div>
```

### Secondary Card (White)
```tsx
<div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-slate-900">[Title]</h3>
    <button className="text-xs font-bold text-slate-400 flex items-center hover:text-rose-600 transition-colors">
      Tout voir <ChevronRight className="w-4 h-4" />
    </button>
  </div>
  {/* content */}
</div>
```

### Section Heading
```tsx
<h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
  [Section Title]
</h2>
```

### Bottom Navigation Bar
```tsx
<nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex items-center justify-around px-8 z-50">
  {/* Active icon: text-rose-600 */}
  {/* Inactive icon: text-slate-300 */}
</nav>
```

---

## Iconography
Library: `lucide-react`
Active icon color: `text-rose-600`
Inactive icon color: `text-slate-300` or `text-slate-400`
Icon sizes: `w-5 h-5` (standard), `w-6 h-6` (nav), `w-4 h-4` (inline/meta)

---

## Motion / Animation
Library: `framer-motion`
- Card hover: `whileHover={{ y: -4 }}`
- Button press: `whileTap={{ scale: 0.95 }}`
- List items: staggered `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`

---

## Decorative Patterns
- Glow orb on dark cards: `absolute w-32 h-32 bg-rose-600 opacity-20 blur-3xl`
- Divider line: `border-b border-gray-100` or `border-b border-gray-50`
- Badge accent dot: `w-2 h-2 bg-red-500 rounded-full border-2 border-white`

---

## Tech Stack
- React + TypeScript
- Tailwind CSS v4 (via @tailwindcss/vite)
- framer-motion
- lucide-react
- clsx + tailwind-merge (`cn()` utility)
