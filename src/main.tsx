import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { initPostHog } from './services/analytics/posthog'
import { initThemeFromStorage } from './utils/theme'

initThemeFromStorage()
initPostHog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
