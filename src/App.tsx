import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/auth/RequireAuth'
import { HomePage } from './pages/HomePage'
import { ProgramPage } from './pages/ProgramPage'
import { HistoryPage } from './pages/HistoryPage'
import { ProgressPage } from './pages/ProgressPage'
import { ProfilePage } from './pages/ProfilePage'
import { WeekPage } from './pages/WeekPage'
import { CalendarPage } from './pages/CalendarPage'
import { SessionDetailPage } from './pages/SessionDetailPage'
import { ChatPage } from './pages/ChatPage'
import { MobilityPage } from './pages/MobilityPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { CallbackPage } from './pages/auth/CallbackPage'
import { LegalPage } from './pages/LegalPage'
import { LandingPage } from './pages/LandingPage'
import { StaffPlanningSandboxPage } from './pages/StaffPlanningSandboxPage'

const isStandaloneMode =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
   (navigator as unknown as { standalone?: boolean }).standalone === true)

function RootRoute() {
  if (!isStandaloneMode) return <LandingPage />

  // TWA / installed PWA: skip the landing page, go straight to /home
  // RequireAuth on /home will redirect to /login if not authenticated
  return <Navigate to="/home" replace />
}

const DEV_STATIC_PAGES = new Set([
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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="/legal" element={<LegalPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/session/:sessionIndex" element={<SessionDetailPage />} />
            <Route path="/mobility" element={<MobilityPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/staff-sandbox" element={<StaffPlanningSandboxPage />} />
          </Route>

          {/* Catch-all : redirige vers /home (RequireAuth gère le reste) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
