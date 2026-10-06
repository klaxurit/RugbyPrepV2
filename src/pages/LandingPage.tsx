import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SignupOrInstallCTA } from '../components/SignupOrInstallCTA'
import { StoreBadges } from '../components/landing/StoreBadges'
import { LandingPhoneFrame } from '../components/landing/LandingPhoneFrame'
import { LANDING_DESIGN } from '../landing/designAssets'

const LANDING_FONTS =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;500;600&display=swap'

const FEATURES = [
  {
    n: '01',
    kicker: 'J-2 · Primers',
    title: 'Semaine de match',
    body: 'Ta semaine se cale sur le coup d’envoi : volume réduit à J-2, primers neuromusculaires la veille, récupération planifiée le lendemain.',
  },
  {
    n: '02',
    kicker: 'Avants · Trois-quarts',
    title: 'Programme par poste',
    body: 'Pilier, demi de mêlée ou ailier : exercices, volumes et qualités physiques calibrés sur les exigences de ton poste.',
  },
  {
    n: '03',
    kicker: 'ACWR',
    title: 'Charge & fatigue',
    body: 'Ton ratio charge aiguë / chronique est suivi en continu. Quand ça monte, c’est toi qui décides :',
    pills: [
      { label: 'Garder', primary: true },
      { label: 'Alléger', primary: false },
      { label: 'Sauter', primary: false },
    ],
  },
  {
    n: '04',
    kicker: 'Progression',
    title: 'Ton programme évolue',
    body: 'Chaque séance validée ajuste la suivante. Charges, volume et progression suivent ta forme réelle, semaine après semaine.',
  },
  {
    n: '05',
    kicker: 'Blocs · Chrono · Bilan',
    title: 'Séance guidée',
    body: 'Des blocs clairs, un chrono de repos intégré et un bilan en fin de séance. Tu n’as plus qu’à pousser.',
  },
  {
    n: '06',
    kicker: 'IA · Tests physiques',
    title: 'Coach IA + tests',
    body: 'Pose tes questions au coach IA, à toute heure. Mesure ta force, ta vitesse et ton endurance avec des tests réguliers.',
  },
] as const

const GALLERY = [
  { src: LANDING_DESIGN.screens.accueil, caption: 'Accueil', nav: true },
  { src: LANDING_DESIGN.screens.semaine, caption: 'Semaine', nav: true },
  { src: LANDING_DESIGN.screens.mois, caption: 'Mois', nav: true },
  { src: LANDING_DESIGN.screens.seance, caption: 'Séance du jour', nav: false },
  { src: LANDING_DESIGN.screens.seanceBlocs, caption: 'Séance en blocs', nav: false },
  { src: LANDING_DESIGN.screens.chronoEmom, caption: 'Chrono EMOM', nav: false },
  { src: LANDING_DESIGN.screens.ligue, caption: 'Ligue du club', nav: true },
] as const

const STEPS = [
  {
    n: '01',
    title: 'Ton contexte',
    body: 'Poste, matériel disponible, calendrier club et niveau d’expérience. Deux minutes, pas plus.',
  },
  {
    n: '02',
    title: 'Ton programme',
    body: 'RugbyForge construit un cycle de musculation adapté à ta phase de saison et à ta semaine de club.',
  },
  {
    n: '03',
    title: 'Tes ajustements',
    body: 'Charge, tests physiques et fraîcheur avant match : le plan se réajuste chaque semaine.',
  },
] as const

const GUIDES = [
  {
    title: 'Préparation physique rugby',
    description: 'Le cadre global : charge, saison, priorités par poste.',
    href: '/preparation-physique-rugby/',
  },
  {
    title: 'Programme musculation rugby',
    description: 'Organiser ses séances par poste et par saison.',
    href: '/programme-musculation-rugby/',
  },
  {
    title: 'ACWR rugby',
    description: 'Lire simplement le ratio charge aiguë / chronique.',
    href: '/acwr-rugby/',
  },
  {
    title: 'Périodisation rugby',
    description: 'Blocs, DUP et logique de saison.',
    href: '/periodisation-rugby/',
  },
  {
    title: 'Tests physiques rugby',
    description: 'CMJ, sprint 10 m, YYIR1 et estimation du 1RM.',
    href: '/tests-physiques-rugby/',
  },
] as const

const FAQS = [
  {
    q: 'À qui s’adresse RugbyForge ?',
    a: 'Aux joueurs, coachs et staffs qui veulent structurer la préparation physique avec des repères lisibles sur la charge, les tests, la musculation et la récupération.',
    open: true,
  },
  {
    q: 'Faut-il une salle complète ?',
    a: 'Non. Les cycles s’adaptent à ton matériel, à ta semaine de club et à la proximité du match. Une préparation réaliste, pas un programme impossible à suivre.',
    open: false,
  },
  {
    q: 'Que peut-on suivre pendant la saison ?',
    a: 'La charge et l’ACWR, les tests physiques utiles et les priorités par poste — pour piloter la semaine, la fraîcheur et la progression sur la durée.',
    open: false,
  },
  {
    q: 'Par où commencer ?',
    a: 'Crée ton compte gratuitement, renseigne ton profil, et ta première semaine est prête. Pour aller plus loin, commence par le guide préparation physique rugby.',
    open: false,
  },
] as const

function LandingHeader() {
  return (
    <header className="relative z-[2] flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <img
          src={LANDING_DESIGN.rufoIcon}
          alt="RUFO"
          width={36}
          height={36}
          className="block h-9 w-9 rounded-[9px] shadow-[0_0_0_1px_rgba(242,232,216,0.12)]"
        />
        <img
          src={LANDING_DESIGN.wordmark}
          alt="RugbyForge"
          width={160}
          height={20}
          className="block h-5 w-auto"
        />
      </div>
      <Link
        to="/auth/login"
        className="lm-mono rounded-full border border-[rgba(242,232,216,0.22)] px-3.5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#F2E8D8] transition-colors hover:border-[#F2E8D8] hover:text-[#F2E8D8]"
      >
        Se connecter
      </Link>
    </header>
  )
}

export function LandingPage() {
  useEffect(() => {
    const id = 'landing-design-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = LANDING_FONTS
    document.head.appendChild(link)
  }, [])

  return (
    <div className="landing-marketing min-h-screen overflow-x-hidden bg-[#14100E] text-[#F2E8D8]">
      {/* 01 Hero — landing.dc.html */}
      <section className="relative mx-auto max-w-[1320px] px-[clamp(20px,4vw,56px)] pt-[clamp(20px,3vw,32px)]">
        <LandingHeader />

        <div className="relative grid items-center gap-[clamp(28px,4vw,72px)] pb-[clamp(40px,5vw,72px)] pt-[clamp(40px,7vw,88px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
          <div className="relative z-[2] flex flex-col gap-7 pb-[clamp(0px,4vw,72px)]">
            <div className="lm-mono flex items-center gap-2.5 text-xs uppercase tracking-[0.12em] text-[#B5A898]">
              <span className="h-2 w-2 rounded-full bg-[#C8303F]" />
              Préparation physique · Rugby à XV
            </div>

            <img
              src={LANDING_DESIGN.wordmark}
              alt=""
              width={620}
              height={80}
              className="-ml-[0.6%] block h-auto w-full max-w-[620px]"
              aria-hidden
            />

            <h1 className="m-0 max-w-[16ch] text-balance text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.04] tracking-[-0.025em] [font-stretch:100%]">
              <span className="text-[#C8303F]">Forge</span> ton physique pour le rugby
            </h1>

            <p className="m-0 max-w-[44ch] text-pretty text-[clamp(16px,1.35vw,19px)] leading-normal text-[#C9BDAD]">
              Un programme hebdo adapté à ton calendrier club, à ton poste, à tes matchs réels et
              au matériel dont tu disposes. Gratuit pour démarrer.
            </p>

            <div className="flex flex-col items-start gap-[22px]">
              <SignupOrInstallCTA
                withArrow
                className="inline-flex items-center gap-3 rounded-[14px] bg-[#7B0D1E] px-[26px] py-[18px] text-[17px] font-bold tracking-[-0.005em] text-[#F2E8D8] shadow-[inset_0_0_0_1px_rgba(242,232,216,0.08),0_10px_30px_-12px_rgba(123,13,30,0.9)] transition-[transform,filter] hover:translate-y-[-1px] hover:brightness-110"
              />
              <div className="flex w-full max-w-[500px] flex-col gap-2">
                <span className="lm-mono text-[11px] uppercase tracking-[0.1em] text-[#8A7E71]">
                  Ou télécharge l’app
                </span>
                <StoreBadges variant="segmented" className="w-full" />
              </div>
            </div>
          </div>

          <div className="relative flex items-end justify-center pb-[clamp(40px,5vw,72px)]">
            <div
              className="pointer-events-none absolute left-1/2 top-[48%] h-[min(720px,140vw)] w-[min(720px,140vw)] -translate-x-1/2 -translate-y-1/2] bg-[radial-gradient(closest-side,rgba(123,13,30,0.55),rgba(123,13,30,0.18)_55%,rgba(20,16,14,0)_100%)]"
              aria-hidden
            />
            <LandingPhoneFrame
              screenSrc={LANDING_DESIGN.screens.accueil}
              alt="Écran d’accueil RugbyForge"
              showNavBar
              size="hero"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      {/* 02 Features */}
      <section
        id="features"
        className="relative z-[2] border-t border-[rgba(242,232,216,0.1)] bg-[#14100E]"
      >
        <div className="mx-auto max-w-[1320px] px-[clamp(20px,4vw,56px)] py-[clamp(64px,9vw,120px)]">
          <div className="mb-[clamp(36px,5vw,64px)] flex flex-wrap items-end justify-between gap-6">
            <h2 className="m-0 max-w-[14ch] text-balance text-[clamp(32px,4.6vw,60px)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:118%]">
              Pensé pour la vraie vie d’un joueur
            </h2>
            <p className="m-0 max-w-[38ch] text-base leading-normal text-[#B5A898]">
              Entraînements club, matchs, fatigue, matériel limité : le programme s’adapte, pas
              l’inverse.
            </p>
          </div>

          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))] [column-gap:clamp(24px,3vw,48px)]">
            {FEATURES.map((f) => (
              <div
                key={f.n}
                className="flex flex-col gap-3 border-t border-[rgba(242,232,216,0.14)] py-7 pb-9"
              >
                <div className="flex items-center justify-between">
                  <span className="lm-mono text-xs text-[#C8303F]">{f.n}</span>
                  <span className="lm-mono text-[11px] uppercase tracking-[0.08em] text-[#8A7E71]">
                    {f.kicker}
                  </span>
                </div>
                <h3 className="m-0 text-2xl font-extrabold tracking-[-0.03em] [font-stretch:112%]">
                  {f.title}
                </h3>
                <p className="m-0 max-w-[36ch] text-pretty text-[15.5px] leading-[1.55] text-[#C9BDAD]">
                  {f.body}
                </p>
                {'pills' in f && f.pills && (
                  <div className="flex flex-wrap gap-1.5">
                    {f.pills.map((p) => (
                      <span
                        key={p.label}
                        className={
                          p.primary
                            ? 'rounded-full bg-[#F2E8D8] px-[11px] py-1.5 text-[13px] font-semibold text-[#14100E]'
                            : 'rounded-full border border-[rgba(242,232,216,0.3)] px-[11px] py-1.5 text-[13px] font-semibold'
                        }
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 Gallery */}
      <section id="captures" className="border-t border-[rgba(242,232,216,0.08)] bg-[#1A1412]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-5 px-[clamp(20px,4vw,56px)] pb-6 pt-[clamp(64px,9vw,112px)]">
          <h2 className="m-0 max-w-[15ch] text-balance text-[clamp(32px,4.6vw,60px)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:118%]">
            Une semaine, <span className="text-[#C8303F]">écran par écran</span>
          </h2>
          <span className="lm-mono text-xs uppercase tracking-[0.08em] text-[#8A7E71]">
            Fais défiler →
          </span>
        </div>

        <div className="overflow-x-auto pb-[clamp(64px,8vw,104px)] [-webkit-overflow-scrolling:touch] [scroll-padding-inline:max(clamp(20px,4vw,56px),calc((100vw-1320px)/2+56px))] [scroll-snap-type:x_proximity]">
          <div className="flex w-max gap-[clamp(16px,2vw,28px)] px-[max(clamp(20px,4vw,56px),calc((100vw-1320px)/2+56px))] py-4">
            {GALLERY.map((shot, index) => (
              <figure
                key={shot.caption}
                className="m-0 flex snap-start flex-col gap-4"
              >
                <LandingPhoneFrame
                  screenSrc={shot.src}
                  alt={shot.caption}
                  showNavBar={shot.nav}
                />
                <figcaption className="flex items-baseline gap-2.5">
                  <span className="lm-mono text-xs text-[#C8303F]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[17px] font-bold tracking-[-0.02em]">{shot.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 04 Comment ça marche */}
      <section id="how" className="bg-[#F2E8D8] text-[#14100E]">
        <div className="mx-auto max-w-[1320px] px-[clamp(20px,4vw,56px)] py-[clamp(64px,9vw,120px)]">
          <div className="mb-[clamp(36px,5vw,64px)] flex flex-wrap items-end justify-between gap-6">
            <h2 className="m-0 max-w-[13ch] text-balance text-[clamp(32px,4.6vw,60px)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:118%]">
              Trois étapes, <span className="text-[#7B0D1E]">zéro programme générique</span>
            </h2>
            <p className="m-0 max-w-[38ch] text-base leading-normal text-[#4A403A]">
              RugbyForge part de ta vraie semaine, pas d’un modèle pro impossible à tenir en club.
            </p>
          </div>

          <div className="grid gap-[clamp(20px,3vw,40px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="flex flex-col gap-3.5 border-t-2 border-[#14100E] pt-6"
              >
                <span className="text-[clamp(64px,7vw,96px)] font-black leading-[0.8] tracking-[-0.06em] text-[#7B0D1E] [font-stretch:125%]">
                  {s.n}
                </span>
                <h3 className="m-0 text-2xl font-extrabold tracking-[-0.03em] [font-stretch:112%]">
                  {s.title}
                </h3>
                <p className="m-0 max-w-[34ch] text-pretty text-[15.5px] leading-[1.55] text-[#4A403A]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 Pourquoi */}
      <section id="why" className="bg-[#14100E]">
        <div className="mx-auto grid max-w-[1320px] items-start gap-[clamp(40px,6vw,96px)] px-[clamp(20px,4vw,56px)] py-[clamp(72px,10vw,136px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          <div className="flex flex-col gap-6">
            <span className="lm-mono text-xs uppercase tracking-[0.12em] text-[#C8303F]">
              Pourquoi RugbyForge
            </span>
            <p className="m-0 text-pretty text-[clamp(26px,3.2vw,42px)] font-bold leading-[1.12] tracking-[-0.03em] [font-stretch:108%]">
              Un joueur n’a pas seulement besoin d’un plan de salle. Il a besoin d’un cadre qui
              relie{' '}
              <span className="text-[#C8303F]">la muscu, le terrain, la récup</span> et le match du
              week-end.
            </p>
            <p className="m-0 max-w-[52ch] text-base leading-[1.6] text-[#B5A898]">
              Périodisation, lecture de la charge, priorités par poste, repères de tests, prévention
              des hausses de volume mal absorbées : de meilleures décisions, semaine après semaine.
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[rgba(242,232,216,0.14)]">
            <div className="flex items-baseline gap-4 bg-[#7B0D1E] p-7">
              <span className="text-[clamp(56px,6vw,80px)] font-black leading-[0.85] tracking-[-0.05em] [font-stretch:125%]">
                186+
              </span>
              <span className="max-w-[20ch] text-[15px] leading-snug text-[#F2D9DC]">
                références en sciences du sport derrière chaque recommandation
              </span>
            </div>
            <div className="flex flex-col gap-3.5 bg-[#1D1714] p-7">
              <span className="lm-mono text-[11px] uppercase tracking-[0.1em] text-[#8A7E71]">
                Tests physiques intégrés
              </span>
              <div className="flex flex-wrap gap-2">
                {['CMJ', 'Sprint 10 m', 'YYIR1', '1RM estimé'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[rgba(242,232,216,0.24)] px-3.5 py-2 text-[15px] font-bold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3.5 border-t border-[rgba(242,232,216,0.1)] bg-[#1D1714] p-7">
              <span className="lm-mono text-[11px] uppercase tracking-[0.1em] text-[#8A7E71]">
                Prévention
              </span>
              <span className="text-base leading-normal text-[#C9BDAD]">
                Préhab, récupération et suivi ACWR pour limiter les pics de charge brutaux.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 06 Guides */}
      <section id="guides" className="border-t border-[rgba(242,232,216,0.08)] bg-[#1A1412]">
        <div className="mx-auto grid max-w-[1320px] items-start gap-[clamp(32px,5vw,80px)] px-[clamp(20px,4vw,56px)] py-[clamp(64px,9vw,112px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
          <div className="flex flex-col gap-5">
            <h2 className="m-0 text-balance text-[clamp(32px,4.6vw,60px)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:118%]">
              Les guides
            </h2>
            <p className="m-0 max-w-[36ch] text-base leading-[1.55] text-[#B5A898]">
              Des formats longs et gratuits pour rendre la préparation physique rugby plus
              concrète.
            </p>
            <a
              href="/blog/"
              className="lm-mono inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-[#F2E8D8] hover:text-[#E9B8BF]"
            >
              Tout le blog <span className="text-[#C8303F]">→</span>
            </a>
          </div>

          <div className="flex flex-col">
            {GUIDES.map((g) => (
              <a
                key={g.href}
                href={g.href}
                className="group flex items-center justify-between gap-5 border-t border-[rgba(242,232,216,0.12)] py-[22px] text-[#F2E8D8] transition-[padding] hover:pl-2.5"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-xl font-extrabold tracking-[-0.025em] [font-stretch:110%]">
                    {g.title}
                  </span>
                  <span className="text-[14.5px] text-[#A89A8A]">{g.description}</span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[rgba(242,232,216,0.2)] text-[#C8303F]">
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 07 FAQ */}
      <section id="faq" className="border-t border-[rgba(242,232,216,0.08)] bg-[#14100E]">
        <div className="mx-auto flex max-w-[900px] flex-col gap-[clamp(28px,4vw,48px)] px-[clamp(20px,4vw,56px)] py-[clamp(64px,9vw,112px)]">
          <h2 className="m-0 text-[clamp(32px,4.6vw,60px)] font-extrabold leading-[0.95] tracking-[-0.04em] [font-stretch:118%]">
            Questions fréquentes
          </h2>
          <div className="flex flex-col">
            {FAQS.map((item, i) => (
              <details
                key={item.q}
                open={item.open}
                className={`border-t border-[rgba(242,232,216,0.14)] ${i === FAQS.length - 1 ? 'border-b' : ''}`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-[clamp(18px,1.8vw,22px)] font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="shrink-0 text-[22px] font-normal text-[#C8303F]">+</span>
                </summary>
                <p className="m-0 max-w-[62ch] pb-[26px] text-base leading-[1.6] text-[#C9BDAD]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 08 CTA */}
      <section className="relative overflow-hidden bg-[#7B0D1E]">
        <div className="relative mx-auto flex max-w-[1320px] flex-col items-start gap-7 px-[clamp(20px,4vw,56px)] py-[clamp(72px,10vw,128px)]">
          <img
            src={LANDING_DESIGN.rufoMark}
            alt=""
            className="pointer-events-none absolute right-[clamp(-120px,-4vw,-20px)] top-1/2 h-[clamp(220px,34vw,460px)] w-auto -translate-y-1/2 opacity-10"
            aria-hidden
          />
          <h2 className="relative m-0 max-w-[12ch] text-balance text-[clamp(40px,6.4vw,88px)] font-black leading-[0.9] tracking-[-0.045em] [font-stretch:122%]">
            Ta saison se prépare cette semaine.
          </h2>
          <p className="relative m-0 max-w-[40ch] text-lg leading-normal text-[#F2D9DC]">
            Crée ton compte, renseigne ton poste et ton calendrier : ta première semaine est prête.
          </p>
          <SignupOrInstallCTA
            withArrow
            desktopLabel="Commencer gratuitement"
            className="relative inline-flex items-center gap-3 rounded-[14px] bg-[#F2E8D8] px-[26px] py-[18px] text-[17px] font-extrabold text-[#7B0D1E] transition-transform hover:translate-y-[-2px]"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(242,232,216,0.08)] bg-[#0F0C0B]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[clamp(48px,6vw,72px)] px-[clamp(20px,4vw,56px)] pb-8 pt-[clamp(56px,7vw,88px)]">
          <div className="grid gap-x-[clamp(24px,3vw,48px)] gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
            <div className="col-span-full flex flex-wrap items-center justify-between gap-8 border-b border-[rgba(242,232,216,0.08)] pb-[clamp(40px,5vw,56px)]">
              <div className="flex max-w-[36ch] flex-col gap-[18px]">
                <div className="flex items-center gap-3">
                  <img
                    src={LANDING_DESIGN.rufoIcon}
                    alt="RUFO"
                    width={44}
                    height={44}
                    className="block h-11 w-11 rounded-[11px]"
                  />
                  <img
                    src={LANDING_DESIGN.wordmark}
                    alt="RugbyForge"
                    width={180}
                    height={24}
                    className="block h-6 w-auto"
                  />
                </div>
                <p className="m-0 text-[15px] leading-[1.55] text-[#A89A8A]">
                  La préparation physique rugby, calée sur ton poste, ton club et ton match.
                </p>
              </div>
              <StoreBadges variant="segmented" className="w-full max-w-[460px]" />
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="lm-mono text-[11px] uppercase tracking-[0.12em] text-[#8A7E71]">
                Produit
              </span>
              <div className="flex flex-col gap-2.5">
                <Link to="/auth/signup" className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]">
                  Commencer gratuitement
                </Link>
                <a href="/about/" className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]">
                  À propos
                </a>
                <a href="/blog/" className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]">
                  Blog
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="lm-mono text-[11px] uppercase tracking-[0.12em] text-[#8A7E71]">
                Guides
              </span>
              <div className="flex flex-col gap-2.5">
                <a
                  href="/preparation-physique-rugby/"
                  className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]"
                >
                  Préparation physique
                </a>
                <a
                  href="/programme-musculation-rugby/"
                  className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]"
                >
                  Programme musculation
                </a>
                <a
                  href="/periodisation-rugby/"
                  className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]"
                >
                  Périodisation
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="lm-mono text-[11px] uppercase tracking-[0.12em] text-[#8A7E71]">
                Outils
              </span>
              <div className="flex flex-col gap-2.5">
                <a href="/acwr-rugby/" className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]">
                  ACWR rugby
                </a>
                <a
                  href="/tests-physiques-rugby/"
                  className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]"
                >
                  Tests physiques
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="lm-mono text-[11px] uppercase tracking-[0.12em] text-[#8A7E71]">
                Contact
              </span>
              <a
                href="mailto:bonjour@rugbyforge.fr"
                className="text-[15px] text-[#C9BDAD] hover:text-[#F2E8D8]"
              >
                bonjour@rugbyforge.fr
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 border-t border-[rgba(242,232,216,0.08)] pt-6 text-[13px] leading-[1.55] text-[#8A7E71]">
            <span className="max-w-[72ch]">
              Ressource éducative. Les contenus RugbyForge ne remplacent pas un avis médical ni le
              suivi d’un professionnel de santé ou d’un préparateur physique de terrain.
            </span>
            <span className="lm-mono shrink-0 text-xs tracking-[0.04em]">
              © 2026 RugbyForge · Fait en France
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
