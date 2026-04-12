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
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 bg-shell/95 backdrop-blur-xl shadow-[0_4px_16px_rgb(44_24_16/0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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
            <Link
              to="/auth/signup"
              className="bg-on-brand hover:bg-white text-brand text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              Commencer gratuitement
            </Link>
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
          <Link
            to="/auth/signup"
            onClick={() => setMobileOpen(false)}
            className="block mt-2 bg-on-brand hover:bg-white text-brand text-sm font-semibold px-5 py-3 rounded-xl text-center transition-colors"
          >
            Commencer gratuitement
          </Link>
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
  'Programme périodisé complet',
  "Séances et logs d'entraînement",
  'Calendrier club + suivi ACWR',
  'Prévention et mobilité intégrées',
  'Chat IA (5 messages/jour)',
]

const PREMIUM_MONTHLY_FEATURES = [
  'Tout le plan Free',
  'Score de forme quotidien',
  'Bilan de semaine automatique',
  'Records personnels et courbes de progression',
  'Suggestions de charge personnalisées',
  'Chat IA illimité',
]

const PREMIUM_YEARLY_FEATURES = [
  'Tout le plan Premium',
  "33% d'économie vs mensuel",
  'Suivi de progression sur toute la saison',
  'Tarif le plus rentable pour ton année rugby',
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
      title: 'ACWR, périodisation et tests',
      description:
        "Des ressources publiques pour mieux lire la charge, suivre la fatigue et objectiver la progression.",
      href: '/blog/',
      cta: 'Explorer les ressources',
    },
  ]

  const faqs = [
    {
      question: "À qui s'adresse RugbyForge ?",
      answer:
        "RugbyForge s'adresse aux joueurs, coachs et staffs qui veulent structurer la préparation physique rugby avec des repères plus lisibles sur la charge, la musculation, les tests physiques et la récupération.",
    },
    {
      question: "Faut-il une salle complète pour utiliser l'application ?",
      answer:
        "Non. L'application adapte les cycles à ton matériel disponible, à ta semaine de club et au niveau de pratique pour garder un programme réaliste à tenir.",
    },
    {
      question: 'Que suit RugbyForge pendant la saison ?',
      answer:
        "L'application suit notamment la charge, l'ACWR, les tests physiques utiles comme le CMJ, le sprint 10 m et l'estimation du 1RM, ainsi que les priorités par poste et par phase de saison.",
    },
    {
      question: 'Quelle différence entre Free et Premium ?',
      answer:
        "Le Free donne déjà accès au programme complet, aux séances, au calendrier, aux logs et au suivi ACWR. Le Premium ajoute l'aide à la décision : suggestions de charge personnalisées, analytics détaillées, projection de progression et chat IA illimité.",
    },
    {
      question: 'Par où commencer si je découvre RugbyForge ?',
      answer:
        "Commence par la page d'accueil, puis par le guide principal sur la préparation physique rugby. Ensuite, le blog te permet d'approfondir l'ACWR, la périodisation, les tests physiques et le programme musculation rugby.",
    },
  ]

  return (
    <div className="min-h-screen bg-app text-fg overflow-x-hidden">
      <LandingNavbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 bg-shell text-shell-text">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#F5F2EE_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-on-brand" />
                <span className="text-sm font-medium text-on-brand/80">
                  Préparation physique rugby
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-6 text-on-brand">
                Ta prépa physique,{' '}
                <span className="text-on-brand/70">scientifiquement</span>{' '}
                optimisée
              </h1>
              <p className="text-lg text-on-brand/60 max-w-xl mb-8">
                Le Free te donne déjà un vrai programme de rugby. Le Premium ajoute les suggestions
                de charge, les analytics détaillées et la projection de ta progression.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-2 bg-on-brand hover:bg-white text-brand font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-on-brand font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  Découvrir RugbyForge
                </a>
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="absolute w-72 h-72 bg-white/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute w-48 h-48 bg-white/5 rounded-full blur-2xl top-0 right-0" />
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
            { value: '88', label: 'Blocs d\'entraînement' },
            { value: '3', label: 'Niveaux de progression' },
            { value: '12', label: 'Semaines de cycle' },
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
              RugbyForge combine science du sport, périodisation et coaching contextuel pour te
              donner un cadre clair en Free, puis des outils d'aide à la décision en Premium.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6 text-brand-tint" />}
              title="Programmes périodisés"
              description="Cycles Hypertrophie → Force → Puissance adaptés à ta saison, ton niveau et ton matériel disponible."
              delay={0}
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-brand-tint" />}
              title="Lecture de la charge"
              description="Lis l'ACWR, la récupération et les semaines à risque sans tableau compliqué. Le Premium ajoute des analytics détaillées."
              delay={0.1}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-brand-tint" />}
              title="Prévention & vigilance"
              description="Échauffement adapté, mobilité utile et signaux de vigilance quand la fatigue et la charge deviennent moins bien absorbées."
              delay={0.2}
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-brand-tint" />}
              title="Coach IA"
              description="Pose tes questions nutrition, récupération ou semaine de match. Le Premium débloque le chat illimité (5 messages/jour en Free)."
              delay={0.3}
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-brand-tint" />}
              title="Calendrier club"
              description="Intègre tes matchs et entraînements club via la FFR. Le programme s'adapte automatiquement à ton planning."
              delay={0.4}
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-brand-tint" />}
              title="Tests & progression"
              description="Suis tes 1RM estimés, le CMJ et les autres repères utiles. Le Premium ajoute les projections et l'historique complet."
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
              Des tableaux de bord clairs pour suivre tes performances, ta charge d'entraînement et
              tes tests physiques.
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
              <h3 className="text-lg font-bold text-fg mb-2">Seuils ACWR validés</h3>
              <p className="text-sm text-fg-muted leading-relaxed">
                Ratios 0.8–1.3 (sweet spot) et alertes {">"} 1.5 basés sur Gabbett (2016) et Blanch
                & Gabbett (2016).
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
              <h3 className="text-lg font-bold text-fg mb-2">1RM & testing</h3>
              <p className="text-sm text-fg-muted leading-relaxed">
                Estimations Brzycki/Epley, baselines CMJ par poste, protocoles YYIR1 et sprint 10m
                standards.
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
              Base de connaissances : 186+ références scientifiques réelles — périodisation,
              récupération, prévention, nutrition, energy systems
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
              features={PREMIUM_MONTHLY_FEATURES}
              highlighted
              cta="Passer en Premium Mensuel"
              ctaLink="/auth/signup?plan=premium&billing=monthly"
            />
            <PricingCard
              title="Premium Annuel"
              price={PREMIUM_YEARLY_PRICE}
              period="/an"
              features={PREMIUM_YEARLY_FEATURES}
              cta="Passer en Premium Annuel"
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
              Le blog RugbyForge transforme notre base de connaissances en guides concrets sur la préparation physique rugby,
              l&apos;ACWR, la périodisation, les tests physiques et le programme de musculation rugby.
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
              Rejoins les joueurs qui utilisent RugbyForge pour structurer leur préparation physique
              et progresser chaque semaine.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-on-brand font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
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
