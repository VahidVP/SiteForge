import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { initLang } from './lib/i18n'
import { site } from './lib/site'
import './themes.css'
import './styles.css'
import './animations.css'
import './rtl.css'

initLang(site.language)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
