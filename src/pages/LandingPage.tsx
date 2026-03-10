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
    { label: 'Fonctionnalités', target: 'features' },
    { label: 'La Science', target: 'science' },
    { label: 'Tarifs', target: 'pricing' },
  ]

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 bg-[#1a100c]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/landing">
            <RugbyForgeLogo size="sm" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => scrollTo(link.target)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/auth/signup"
              className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
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
          className="md:hidden bg-[#1a100c]/95 backdrop-blur-xl border-b border-white/10 px-4 pb-4"
        >
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => { scrollTo(link.target); setMobileOpen(false) }}
              className="block w-full text-left py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/auth/signup"
            onClick={() => setMobileOpen(false)}
            className="block mt-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-sm font-semibold px-5 py-3 rounded-xl text-center transition-colors"
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
      className="bg-white/5 border border-white/10 rounded-[24px] p-6 hover:bg-white/[0.08] transition-colors"
    >
      <div className="w-12 h-12 bg-[#ff6b35]/20 rounded-2xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
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
          ? 'bg-[#ff6b35]/10 border-[#ff6b35]/40 scale-105'
          : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff6b35] text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
          Recommandé
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-black text-white">{price}</span>
        <span className="text-sm text-slate-400 ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="w-4 h-4 text-[#ff6b35] mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={ctaLink}
        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
          highlighted
            ? 'bg-[#ff6b35] hover:bg-[#e55a2b] text-white'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  )
}

// ─── Main Landing Page ───────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a100c] text-white overflow-x-hidden">
      <LandingNavbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#ff6b35 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#ff6b35]/20 border border-[#ff6b35]/30 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-[#ff6b35]" />
                <span className="text-sm font-medium text-[#ff6b35]">
                  Préparation physique rugby
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
                Ta prépa physique,{' '}
                <span className="text-[#ff6b35]">scientifiquement</span>{' '}
                optimisée
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mb-8">
                Programmes de musculation périodisés, suivi de charge ACWR, prévention blessures et
                coaching IA — tout ce qu'il faut pour performer sur le terrain.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
                >
                  Découvrir RugbyForge
                </Link>
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="absolute w-72 h-72 bg-[#ff6b35]/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute w-48 h-48 bg-[#1a5f3f]/30 rounded-full blur-2xl top-0 right-0" />
              <div className="relative w-[280px] sm:w-[320px] bg-[#1a100c] border-4 border-white/20 rounded-[40px] p-3 shadow-2xl">
                <div className="relative max-h-[480px] overflow-y-auto rounded-[28px] scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                  <img
                    src="/images/landing/app-week.png"
                    alt="RugbyForge — programme de la semaine"
                    className="w-full"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="absolute bottom-3 left-3 right-3 h-24 bg-gradient-to-t from-[#1a100c] to-transparent pointer-events-none rounded-b-[28px]" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/10">
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
              <div className="text-3xl font-black text-[#ff6b35]">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
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
            <p className="text-slate-400 max-w-2xl mx-auto">
              RugbyForge combine science du sport, périodisation avancée et intelligence artificielle
              pour te proposer le programme le plus adapté à ton profil.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Dumbbell className="w-6 h-6 text-[#ff6b35]" />}
              title="Programmes périodisés"
              description="Cycles Hypertrophie → Force → Puissance adaptés à ta saison, ton niveau et ton matériel disponible."
              delay={0}
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-[#ff6b35]" />}
              title="Monitoring ACWR"
              description="Suivi du ratio charge aiguë/chronique en temps réel. Alerte automatique si tu approches la zone de danger."
              delay={0.1}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-[#ff6b35]" />}
              title="Prévention blessures"
              description="Prehab automatique ciblé sur tes points faibles. Protocoles de retour blessure progressifs."
              delay={0.2}
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-[#ff6b35]" />}
              title="Coach IA"
              description="Pose tes questions nutrition, récupération, sommeil. L'IA répond avec des recommandations basées sur la science."
              delay={0.3}
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-[#ff6b35]" />}
              title="Calendrier club"
              description="Intègre tes matchs et entraînements club. Le programme s'adapte automatiquement à ta semaine."
              delay={0.4}
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-[#ff6b35]" />}
              title="Tests & progression"
              description="Suis tes 1RM estimés, CMJ, sprint 10m et YYIR1. Visualise ta progression sur toute la saison."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ── Progression ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-white/[0.02]">
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
            <p className="text-slate-400 max-w-2xl mx-auto">
              Des tableaux de bord clairs pour suivre tes performances, ta charge d'entraînement et
              tes tests physiques.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-[24px] p-4 overflow-hidden"
            >
              <div className="relative">
                <div className="max-h-[360px] overflow-y-auto rounded-2xl" style={{ scrollbarWidth: 'none' }}>
                  <img
                    src="/images/landing/tests-progression.png"
                    alt="Tests physiques et progression"
                    className="w-full"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1a100c] to-transparent pointer-events-none rounded-b-2xl" />
              </div>
              <p className="text-sm text-slate-400 text-center mt-3">
                Suivi des tests physiques — CMJ, sprint, 1RM estimé
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-[24px] p-4 overflow-hidden"
            >
              <div className="relative">
                <div className="max-h-[360px] overflow-y-auto rounded-2xl" style={{ scrollbarWidth: 'none' }}>
                  <img
                    src="/images/landing/acwr-monitoring.png"
                    alt="Monitoring ACWR"
                    className="w-full"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1a100c] to-transparent pointer-events-none rounded-b-2xl" />
              </div>
              <p className="text-sm text-slate-400 text-center mt-3">
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
            <p className="text-slate-400 max-w-2xl mx-auto">
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
              className="bg-white/5 border border-white/10 rounded-[24px] p-6"
            >
              <div className="w-12 h-12 bg-[#1a5f3f]/30 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-[#1a5f3f]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Périodisation par blocs</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cycles Hypertrophie → Force → Puissance basés sur les travaux de Bompa, Issurin et
                les recommandations NSCA.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-[24px] p-6"
            >
              <div className="w-12 h-12 bg-[#1a5f3f]/30 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[#1a5f3f]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Seuils ACWR validés</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ratios 0.8–1.3 (sweet spot) et alertes {">"} 1.5 basés sur Gabbett (2016) et Blanch
                & Gabbett (2016).
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-[24px] p-6"
            >
              <div className="w-12 h-12 bg-[#1a5f3f]/30 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-[#1a5f3f]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1RM & testing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
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
            <p className="text-sm text-slate-500">
              Base de connaissances : 186+ références scientifiques réelles — périodisation,
              récupération, prévention, nutrition, energy systems
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 bg-white/[0.02]">
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
            <p className="text-slate-400 max-w-xl mx-auto">
              Commence gratuitement. Passe en Premium quand tu veux débloquer le coaching IA et les
              analyses avancées.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            <PricingCard
              title="Free"
              price="0€"
              period="pour toujours"
              features={[
                'Programme périodisé complet',
                'Suivi des séances',
                'Historique d\'entraînement',
                'Prehab automatique',
                'Calendrier club',
              ]}
              cta="Créer mon compte Free"
            />
            <PricingCard
              title="Premium Mensuel"
              price="5,99€"
              period="/mois"
              features={[
                'Tout le plan Free',
                'Coach IA illimité',
                'Tests physiques & graphes',
                'Monitoring ACWR avancé',
                'Protocoles retour blessure',
                'Support prioritaire',
              ]}
              highlighted
              cta="Passer en Premium Mensuel"
              ctaLink="/auth/signup?plan=premium&billing=monthly"
            />
            <PricingCard
              title="Premium Annuel"
              price="47,99€"
              period="/an"
              features={[
                'Tout le plan Premium',
                '33% d\'économie vs mensuel',
                'Accès anticipé nouvelles fonctionnalités',
                'Badge Founding Member',
              ]}
              cta="Passer en Premium Annuel"
              ctaLink="/auth/signup?plan=premium&billing=annual"
            />
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
            <p className="text-slate-400 max-w-xl mx-auto mb-8">
              Rejoins les joueurs qui utilisent RugbyForge pour structurer leur préparation physique
              et progresser chaque semaine.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/auth/signup"
                className="inline-flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/auth/signup"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Parler à un expert
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <RugbyForgeLogo size="sm" />
              <p className="text-sm text-slate-500 mt-3">
                Préparation physique rugby, fondée sur la science du sport.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Produit
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-slate-500 hover:text-white transition-colors">
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-slate-500 hover:text-white transition-colors">
                    Tarifs
                  </button>
                </li>
                <li>
                  <button onClick={() => document.getElementById('science')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-slate-500 hover:text-white transition-colors">
                    La Science
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Légal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/legal" className="text-sm text-slate-500 hover:text-white transition-colors">
                    Mentions Légales
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-sm text-slate-500 hover:text-white transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link to="/legal" className="text-sm text-slate-500 hover:text-white transition-colors">
                    CGU / CGV
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Contact
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:contact@rugbyforge.com" className="text-sm text-slate-500 hover:text-white transition-colors">
                    contact@rugbyforge.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-[10px] text-slate-500">
              © 2026 RugbyForge. v1.0 - beta
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
