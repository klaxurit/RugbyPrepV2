import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Brain,
  Shield,
  TrendingUp,
  Calendar,
  MessageCircle,
  Activity,
  Target,
  BookOpen,
  Check,
  Menu,
  X,
  ArrowRight,
  Star,
  Zap,
} from 'lucide-react'
import { RugbyForgeLogo } from '../components/RugbyForgeLogo'
import { SignupOrInstallCTA } from '../components/SignupOrInstallCTA'

// ─── Sub-components ──────────────────────────────────────────

function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!mobileOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileOpen])

  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'La Science', href: '#science' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Blog', href: '/blog/' },
  ]

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 bg-shell/95 backdrop-blur-xl shadow-[0_4px_16px_rgb(44_24_16/0.15)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-[max(1rem,env(safe-area-inset-left))] sm:px-[max(1.5rem,env(safe-area-inset-left))] lg:px-[max(2rem,env(safe-area-inset-left))]">
        <div className="flex items-center justify-between h-16 ios:h-12">
          <Link to="/">
            <RugbyForgeLogo size="md" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-shell-text-muted hover:text-shell-text transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth/login"
              className="text-sm font-medium text-shell-text-muted hover:text-shell-text transition-colors"
            >
              Connexion
            </Link>
            <SignupOrInstallCTA
              className="bg-on-brand hover:bg-white text-brand text-sm font-semibold px-5 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            />
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden text-shell-text p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-shell/95 backdrop-blur-xl border-b border-shell-bd px-4 pb-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-left py-3 text-sm font-medium text-shell-text-muted hover:text-shell-text transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="block py-3 text-sm font-medium text-shell-text-muted hover:text-shell-text transition-colors"
          >
            Connexion
          </Link>
          <SignupOrInstallCTA
            className="mt-2 bg-on-brand hover:bg-white text-brand text-sm font-semibold px-5 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 w-full"
            onSignupClick={() => setMobileOpen(false)}
          />
        </motion.div>
      )}
    </nav>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="bg-layer-5 border border-border-app rounded-[24px] p-6 hover:bg-layer-7 transition-colors"
    >
      <div className="w-12 h-12 bg-brand-soft rounded-2xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-fg mb-2">{title}</h3>
      <p className="text-sm text-fg-muted leading-relaxed">{description}</p>
    </motion.div>
  )
}

interface PricingCardProps {
  title: string
  price: string
  period: string
  features: string[]
  highlighted?: boolean
  cta: string
  ctaLink?: string
}

function PricingCard({ title, price, period, features, highlighted, cta, ctaLink = '/auth/signup' }: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className={`relative rounded-[24px] p-8 border transition-colors ${
        highlighted
          ? 'bg-brand-soft border-brand-border-strong scale-105'
          : 'bg-layer-5 border-border-app hover:bg-layer-7'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-on-brand text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
          Recommandé
        </div>
      )}
      <h3 className="text-lg font-bold text-fg mb-1">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-black text-fg">{price}</span>
        <span className="text-sm text-fg-muted ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-fg-secondary">
            <Check className="w-4 h-4 text-brand-tint mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
          highlighted
            ? 'bg-brand hover:bg-brand-hover text-on-brand'
            : 'bg-layer-10 hover:bg-layer-15 text-fg'
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  )
}

interface PhoneMockupProps {
  src: string
  alt: string
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}

function PhoneMockup({
  src,
  alt,
  loading = 'lazy',
  fetchPriority,
}: PhoneMockupProps) {
  return (
    <div className="relative w-[260px] sm:w-[290px]">
      {/* Phone frame — thin bezel, modern */}
      <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-[5px] shadow-[0_12px_40px_rgb(0_0_0/0.25)]">
        {/* Camera dot */}
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-[#1a1a1a] rounded-full z-10" />
        {/* Screen */}
        <div className="relative rounded-[2.1rem] overflow-hidden bg-app">
          {/* Screen content — no fake status bar, screenshots include the real navbar */}
          <div className="relative max-h-[560px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <img
              src={src}
              alt={alt}
              loading={loading}
              fetchPriority={fetchPriority}
              decoding="async"
              className="w-full"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-app to-transparent pointer-events-none" />
        </div>
      </div>
      {/* Home indicator */}
      <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[80px] h-[3px] bg-white/25 rounded-full" />
    </div>
  )
}

const PREMIUM_MONTHLY_PRICE = '5,99€'
const PREMIUM_YEARLY_PRICE = '47,99€'

const FREE_PLAN_FEATURES = [
  'Programme complet adapté à ta saison',
  'Séances consultables (exercices + démos)',
  'Calendrier club',
  'Prévention et mobilité intégrées',
  'Chat IA (3 messages/jour)',
]

const PREMIUM_FEATURES = [
  'Tout le plan Free',
  'Suivi des charges et séries',
  'Historique complet des séances',
  'Score de forme et bilan de semaine',
  'Suggestions de charge personnalisées',
  'Records personnels et courbes de progrès',
  'Chat IA illimité',
]

// ─── Main Landing Page ───────────────────────────────────────

export function LandingPage() {
  const resources = [
    {
      title: 'Préparation physique rugby',
      description:
        "Le guide pilier pour comprendre la charge, les priorités par poste, la pré-saison et la semaine type.",
      href: '/preparation-physique-rugby/',
      cta: 'Lire le guide pilier',
    },
    {
      title: 'Programme musculation rugby',
      description:
        "Une base concrète pour répartir les séances selon le poste, la phase de saison et la proximité du match.",
      href: '/programme-musculation-rugby/',
      cta: 'Voir le programme',
    },
    {
      title: 'Charge, fatigue et tests',
      description:
        "Des repères concrets pour mieux gérer ta charge et suivre ta progression.",
      href: '/blog/',
      cta: 'Explorer les ressources',
    },
  ]

  const faqs = [
    {
      question: "À qui s'adresse RugbyForge ?",
      answer:
        "Aux joueurs et staffs qui veulent structurer leur prépa physique rugby avec des repères clairs sur la charge, la musculation, les tests et la récupération.",
    },
    {
      question: "Faut-il une salle complète pour utiliser l'application ?",
      answer:
        "Non. Le programme s'adapte à ton matériel, ta semaine de club et ton niveau pour rester réaliste et tenable.",
    },
    {
      question: 'Que suit RugbyForge pendant la saison ?',
      answer:
        "Ta charge de travail, tes tests physiques (force, vitesse, détente), tes priorités par poste et l'évolution de ta saison.",
    },
    {
      question: 'Quelle différence entre Free et Premium ?',
      answer:
        "Le Free donne accès au programme complet, aux séances consultables, au calendrier et à la prévention. Le Premium débloque le suivi des charges, l'historique complet, le score de forme, les suggestions de charge, les courbes de progression et le chat IA illimité.",
    },
    {
      question: 'Par où commencer si je découvre RugbyForge ?',
      answer:
        "Crée ton compte gratuit et laisse-toi guider. Le blog te permet aussi d'approfondir la charge, les tests physiques et la musculation rugby.",
    },
  ]

  return (
    <div className="min-h-screen bg-app text-fg overflow-x-hidden">
      <LandingNavbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 bg-app overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:32px_32px]"
        />
        {/* Glow bordeaux en haut à droite */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-brand rounded-full blur-[120px] opacity-[0.08]" />
        {/* Glow bordeaux en bas à gauche */}
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-brand rounded-full blur-[100px] opacity-[0.06]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-brand-soft border border-brand-border rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-brand" />
                <span className="text-sm font-medium text-brand">
                  Préparation physique rugby
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.05] mb-6 text-fg">
                Ta prépa physique,{' '}
                <span className="text-brand">scientifiquement</span>{' '}
                optimisée
              </h1>
              <p className="text-lg text-fg-muted max-w-xl mb-8 leading-relaxed">
                Un programme complet dès l'inscription. Le Premium débloque le suivi des charges,
                l'historique et les courbes de progression.
              </p>
              <div className="flex flex-wrap gap-4">
                <SignupOrInstallCTA
                  withArrow
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-[0_4px_16px_rgb(123_13_30/0.2)]"
                />
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 bg-layer-10 hover:bg-layer-15 text-fg font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  Découvrir RugbyForge
                </a>
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="absolute w-80 h-80 bg-brand rounded-full blur-[80px] opacity-[0.08] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute w-48 h-48 bg-brand rounded-full blur-[60px] opacity-[0.06] top-0 right-0" />
              <PhoneMockup
                src="/images/landing/rufo_home.png"
                alt="RugbyForge — accueil et programme"
                loading="eager"
                fetchPriority="high"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-12 border-y border-border-app">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '186+', label: 'Références scientifiques' },
            { value: '207', label: 'Exercices disponibles' },
            { value: '2', label: 'Niveaux de progression' },
            { value: '4 à 12', label: 'Semaines par programme' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-black text-brand">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-fg-muted mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Tout pour ta prépa physique
            </h2>
            <p className="text-fg-muted max-w-2xl mx-auto">
              Des outils concrets pour structurer ta prépa, suivre ta charge et progresser chaque semaine.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6 text-brand-tint" />}
              title="Programme adapté à ta saison"
              description="Le programme s'adapte à ta saison, ton niveau et ton matériel. Les séances évoluent en force, puissance et volume au fil des semaines."
              delay={0}
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-brand-tint" />}
              title="Suivi de charge"
              description="Consulte ton score ACWR et repère les semaines à risque. Le Premium débloque le suivi des charges exercice par exercice."
              delay={0.1}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-brand-tint" />}
              title="Prévention blessures"
              description="Échauffement adapté, mobilité et alertes quand la fatigue s'accumule."
              delay={0.2}
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-brand-tint" />}
              title="Coach IA"
              description="Pose tes questions sur la nutrition, la récup ou ta semaine de match. 3 messages/jour en Free, illimité en Premium."
              delay={0.3}
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-brand-tint" />}
              title="Calendrier club"
              description="Synchronise tes matchs FFR et tes entraînements club. Le programme s'adapte automatiquement."
              delay={0.4}
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-brand-tint" />}
              title="Tests & progression"
              description="Mesure ta force, ta vitesse et ta détente. Le Premium débloque l'historique complet et les courbes de progression."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ── Progression ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-layer-2">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Suis ta progression en temps réel
            </h2>
            <p className="text-fg-muted max-w-2xl mx-auto">
              Tes performances, ta charge et tes tests physiques — lisibles en un coup d'œil.
            </p>
          </motion.div>

          {/* Desktop : 3 en ligne — Mobile : 2 en haut + 1 centré en bas */}
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="flex flex-col items-center"
            >
              <PhoneMockup
                src="/images/landing/rufo_datas.png"
                alt="Suivi de progression et données"
              />
              <p className="text-sm text-fg-muted text-center mt-5">
                Suivi des tests physiques — CMJ, sprint, 1RM estimé
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <PhoneMockup
                src="/images/landing/rufo_calendar.png"
                alt="Calendrier et planification"
              />
              <p className="text-sm text-fg-muted text-center mt-5">
                Calendrier et planification de saison
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <PhoneMockup
                src="/images/landing/rufo_data2.png"
                alt="Monitoring ACWR et charge"
              />
              <p className="text-sm text-fg-muted text-center mt-5">
                Ratio charge aiguë/chronique — prévention du surentraînement
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Science ───────────────────────────────────────── */}
      <section id="science" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Fondé sur la science du sport
            </h2>
            <p className="text-fg-muted max-w-2xl mx-auto">
              Chaque décision de programmation s'appuie sur des recherches publiées en préparation
              physique et sciences du sport.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="bg-layer-5 border border-border-app rounded-[24px] p-6"
            >
              <div className="w-12 h-12 bg-brand-medium rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-brand-tint" />
              </div>
              <h3 className="text-lg font-bold text-fg mb-2">Périodisation par blocs</h3>
              <p className="text-sm text-fg-muted leading-relaxed">
                Cycles Hypertrophie → Force → Puissance basés sur les travaux de Bompa, Issurin et
                les recommandations NSCA.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-layer-5 border border-border-app rounded-[24px] p-6"
            >
              <div className="w-12 h-12 bg-brand-medium rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-brand-tint" />
              </div>
              <h3 className="text-lg font-bold text-fg mb-2">Seuils de charge validés</h3>
              <p className="text-sm text-fg-muted leading-relaxed">
                Zones de charge optimale (0.8–1.3) et alertes surcharge ({">"} 1.5) basées sur les
                travaux de Gabbett (2016).
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-layer-5 border border-border-app rounded-[24px] p-6"
            >
              <div className="w-12 h-12 bg-brand-medium rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-brand-tint" />
              </div>
              <h3 className="text-lg font-bold text-fg mb-2">Tests physiques</h3>
              <p className="text-sm text-fg-muted leading-relaxed">
                Estimation de ta force max, tests de détente par poste, protocoles endurance et
                vitesse.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-fg-ghost">
              Basé sur plus de 186 références en sciences du sport — force, récupération,
              prévention et nutrition
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 bg-layer-2">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Des tarifs simples et transparents
            </h2>
            <p className="text-fg-muted max-w-xl mx-auto">
              Commence gratuitement avec tout le socle d'entraînement. Passe en Premium quand tu
              veux débloquer les charges suggérées, le coach IA enrichi et les lectures
              intelligentes de ta semaine.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            <PricingCard
              title="Free"
              price="0€"
              period="pour toujours"
              features={FREE_PLAN_FEATURES}
              cta="Créer mon compte Free"
            />
            <PricingCard
              title="Premium Mensuel"
              price={PREMIUM_MONTHLY_PRICE}
              period="/mois"
              features={PREMIUM_FEATURES}
              cta="Passer en Premium"
              ctaLink="/auth/signup?plan=premium&billing=monthly"
            />
            <PricingCard
              title="Premium Annuel"
              price={PREMIUM_YEARLY_PRICE}
              period="/an"
              features={[...PREMIUM_FEATURES, "Économise 33% par rapport au mensuel"]}
              highlighted
              cta="Passer en Premium"
              ctaLink="/auth/signup?plan=premium&billing=annual"
            />
          </div>
        </div>
      </section>

      {/* ── Ressources ───────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Des ressources publiques pour aller plus loin
            </h2>
            <p className="text-fg-muted max-w-2xl mx-auto">
              Des guides pratiques sur la préparation physique rugby, la charge, les tests et la musculation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-layer-5 border border-border-app rounded-[24px] p-6 hover:bg-layer-7 transition-colors"
              >
                <div className="w-12 h-12 bg-brand-medium rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-brand-tint" />
                </div>
                <h3 className="text-lg font-bold text-fg mb-2">{resource.title}</h3>
                <p className="text-sm text-fg-muted leading-relaxed mb-6">{resource.description}</p>
                <a
                  href={resource.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-tint hover:text-fg transition-colors"
                >
                  {resource.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-layer-2">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Questions fréquentes
            </h2>
            <p className="text-fg-muted max-w-2xl mx-auto">
              Des réponses rapides pour comprendre à qui s&apos;adresse RugbyForge et comment l&apos;application
              s&apos;intègre dans une vraie semaine de rugby.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {faqs.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="bg-layer-5 border border-border-app rounded-[24px] p-6"
              >
                <h3 className="text-lg font-bold text-fg mb-2">{item.question}</h3>
                <p className="text-sm text-fg-muted leading-relaxed">{item.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">
              Prêt à passer au niveau supérieur ?
            </h2>
            <p className="text-fg-muted max-w-xl mx-auto mb-8">
              Rejoins les joueurs qui utilisent RugbyForge pour progresser sur le terrain.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <SignupOrInstallCTA
                  withArrow
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                />
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 bg-layer-10 hover:bg-layer-15 text-fg font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Se connecter
                </Link>
              </div>
            </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border-app py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <RugbyForgeLogo size="sm" />
              <p className="text-sm text-fg-ghost mt-3">
                Préparation physique rugby, fondée sur la science du sport.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3">
                Produit
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#science" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    La Science
                  </a>
                </li>
                <li>
                  <a href="/blog/" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Ressources
                  </a>
                </li>
                <li>
                  <a href="/preparation-physique-rugby/" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Guide preparation rugby
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3">
                Légal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/legal" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Mentions Légales
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    CGU / CGV
                  </Link>
                </li>
                <li>
                  <Link to="/delete-account" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    Suppression de compte
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3">
                Contact
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:bonjour@rugbyforge.fr" className="text-sm text-fg-ghost hover:text-fg transition-colors">
                    bonjour@rugbyforge.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border-app pt-8 text-center">
            <p className="text-[10px] text-fg-ghost">
              © 2026 RugbyForge, édité par Axurit. v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
