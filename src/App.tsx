import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
import { OnboardingPage } from './pages/OnboardingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { CallbackPage } from './pages/auth/CallbackPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/session/:sessionIndex" element={<SessionDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
