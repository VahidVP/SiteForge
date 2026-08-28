import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LangContext'
import Reveal from '../components/Reveal'
import { siteTitle } from '../lib/site'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [emailValue, setEmailValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await signIn(emailValue, passwordValue)
      } else {
        await signUp(emailValue, passwordValue)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <main className="container page" style={{ maxWidth: 880 }}>
      <Reveal>
        <div className="card auth-split">
          <div className="auth-side">
            <h2>
              {t('login.welcome')} {siteTitle(lang)}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {mode === 'signup' ? t('login.signupHint') : t('login.signinHint')}
            </p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="tabs">
              <button type="button" className={mode === 'signin' ? 'tab active' : 'tab'} onClick={() => setMode('signin')}>
                {t('login.tabSignin')}
              </button>
              <button type="button" className={mode === 'signup' ? 'tab active' : 'tab'} onClick={() => setMode('signup')}>
                {t('login.tabSignup')}
              </button>
            </div>
            <label className="field">
              <span>{t('login.email')}</span>
              <input type="email" required value={emailValue} onChange={event => setEmailValue(event.target.value)} placeholder="you@example.com" />
            </label>
            <label className="field">
              <span>{t('login.password')}</span>
              <input type="password" required minLength={6} value={passwordValue} onChange={event => setPasswordValue(event.target.value)} placeholder={t('login.passwordHint')} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? t('login.wait') : mode === 'signin' ? t('login.submitSignin') : t('login.submitSignup')}
            </button>
            <Link
              to="#"
              onClick={event => {
                event.preventDefault()
                setMode(mode === 'signin' ? 'signup' : 'signin')
              }}
              style={{ fontSize: '0.9rem', color: 'var(--muted)', textAlign: 'center' }}
            >
              {mode === 'signin' ? t('login.needAccount') : t('login.haveAccount')}
            </Link>
            {mode === 'signup' ? (
              <p className="muted" style={{ fontSize: '0.84rem', margin: 0 }}>
                {t('login.firstAdminTip')}
              </p>
            ) : null}
          </form>
        </div>
      </Reveal>
    </main>
  )
}
