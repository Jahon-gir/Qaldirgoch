import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { I18nProvider } from './i18n/I18nProvider'
import { AuthProvider } from './auth/AuthProvider'
import { ProfileProvider } from './profile/ProfileProvider'
import { ProgressProvider } from './progress/ProgressProvider'
import { LessonsProvider } from './german/LessonsProvider'
import { WordsProvider } from './german/WordsProvider'
import { InstallProvider } from './pwa/InstallProvider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ProfileProvider>
            <ProgressProvider>
              <LessonsProvider>
                <WordsProvider>
                  <InstallProvider>
                    <App />
                  </InstallProvider>
                </WordsProvider>
              </LessonsProvider>
            </ProgressProvider>
          </ProfileProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
)
