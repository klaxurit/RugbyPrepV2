import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SessionRunProvider } from './contexts/SessionRunContext'
import { CoachProvider } from './contexts/CoachContext'
import { CalendarProvider } from './contexts/CalendarContext'
import { RequireAuth } from './components/auth/RequireAuth'
import { ScrollToTop } from './components/navigation/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CoachCompanion } from './components/CoachCompanion'
import { ProgramChangeMount } from './components/ProgramChangeMount'
import { UpdatePrompt } from './components/UpdatePrompt'

// Eager : seulement HomePage (default after login, évite un flash sur l'écran principal)
import { HomePage } from './pages/HomePage'

// Lazy : tout le reste, y compris la landing et l'auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const WeekPage = lazy(() => import('./pages/WeekPage').then(m => ({ default: m.WeekPage })))
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage').then(m => ({ default: m.SessionDetailPage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })))
const MobilityPage = lazy(() => import('./pages/MobilityPage').then(m => ({ default: m.MobilityPage })))
const ProgramPage = lazy(() => import('./pages/ProgramPage').then(m => ({ default: m.ProgramPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const StaffPlanningSandboxPage = lazy(() => import('./pages/StaffPlanningSandboxPage').then(m => ({ default: m.StaffPlanningSandboxPage })))
const CallbackPage = lazy(() => import('./pages/auth/CallbackPage').then(m => ({ default: m.CallbackPage })))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage').then(m => ({ default: m.DeleteAccountPage })))

const isStandaloneMode =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
   (navigator as unknown as { standalone?: boolean }).standalone === true)

/**
 * Détecte si l'URL courante contient des paramètres d'auth callback —
 * couvre le cas où Supabase retombe sur la Site URL (au lieu de
 * `redirectTo`) parce que `/auth/callback` n'est pas dans les
 * Redirect URLs whitelistées du dashboard. Dans ce cas, l'utilisateur
 * arrive sur `/?code=...` et serait servi la LandingPage au lieu d'être
 * connecté.
 *
 * - PKCE flow (par défaut récent) : `?code=...`
 * - Email confirmation hash flow : `?token_hash=...&type=signup`
 * - Recovery / OAuth implicit : `#access_token=...&refresh_token=...`
 */
function hasAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') return false
  const url = new URL(window.location.href)
  if (url.searchParams.has('code')) return true
  if (url.searchParams.has('token_hash')) return true
  if (url.hash.includes('access_token=')) return true
  return false
}

function RootRoute() {
  // Email confirmation / OAuth callback landed on `/` (Supabase fallback
  // sur Site URL). Forward vers /auth/callback en préservant query+hash
  // pour que le CallbackPage finalise la session puis route vers la bonne
  // destination (/onboarding ou /program).
  if (hasAuthCallbackParams()) {
    const { search, hash } = window.location
    return <Navigate to={`/auth/callback${search}${hash}`} replace />
  }

  if (!isStandaloneMode) return <LandingPage />

  // TWA / installed PWA: skip the landing page, go straight to /home
  // RequireAuth on /home will redirect to /login if not authenticated
  return <Navigate to="/home" replace />
}

const DEV_STATIC_PAGES = new Set([
  '/about',
  '/blog',
  '/preparation-physique-rugby',
  '/programme-musculation-rugby',
  '/acwr-rugby',
  '/periodisation-rugby',
  '/tests-physiques-rugby',
  '/prevention-blessures-rugby',
])

function getDevStaticTarget(pathname: string) {
  if (!import.meta.env.DEV || pathname === '/') return null

  const normalizedPath = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname

  if (!DEV_STATIC_PAGES.has(normalizedPath)) return null

  return `${normalizedPath}/index.html`
}

function StaticPageDevRedirect({ target }: { target: string }) {
  useEffect(() => {
    const suffix = `${window.location.search}${window.location.hash}`
    window.location.replace(`${target}${suffix}`)
  }, [target])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
      <div>
        <p>Ouverture de la page statique locale…</p>
        <p>
          Si la redirection ne se fait pas automatiquement,&nbsp;
          <a href={target}>ouvre la page ici</a>.
        </p>
      </div>
    </div>
  )
}

function App() {
  const devStaticTarget = getDevStaticTarget(window.location.pathname)

  if (devStaticTarget) {
    return <StaticPageDevRedirect target={devStaticTarget} />
  }

  return (
    <ErrorBoundary>
    <AuthProvider>
      <CalendarProvider>
      <SessionRunProvider>
      <BrowserRouter>
        <CoachProvider>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-app flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/session/:sessionIndex" element={<SessionDetailPage />} />
            <Route path="/mobility" element={<MobilityPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/staff-sandbox" element={<StaffPlanningSandboxPage />} />
          </Route>

          {/* Catch-all : redirige vers /home (RequireAuth gère le reste) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </Suspense>
        <CoachCompanion />
        <ProgramChangeMount />
        <UpdatePrompt />
        </CoachProvider>
      </BrowserRouter>
      </SessionRunProvider>
      </CalendarProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
