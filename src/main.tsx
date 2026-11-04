import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { I18nProvider } from './i18n/I18nProvider'
import { ProfileProvider } from './profile/ProfileProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
)
