import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { I18nProvider, preloadSavedLang } from './i18n/I18nProvider'
import { AuthProvider } from './auth/AuthProvider'
import { ProfileProvider } from './profile/ProfileProvider'
import { ProgressProvider } from './progress/ProgressProvider'
import { LessonsProvider } from './german/LessonsProvider'
import { WordsProvider } from './german/WordsProvider'
import { InstallProvider } from './pwa/InstallProvider'
import App from './App'
import { PhoneRoot } from './phone/PhoneRoot'

// Rus/kirill tanlangan boʻlsa — avval oʻsha lugʻat (kichik boʻlak), keyin chizish
void preloadSavedLang().then(() =>
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
                      <PhoneRoot>
                        <App />
                      </PhoneRoot>
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
)
