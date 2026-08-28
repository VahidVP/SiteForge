import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { api, setOwnerToken } from '../api/client'
import { site } from '../lib/site'
import { useI18n } from '../context/LangContext'

export default function OwnerLogin() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (site.auth) {
    return null
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.ownerLogin(code)
      setOwnerToken(res.token)
      navigate('/admin')
    } catch {
      setError(t('owner.wrong'))
      setBusy(false)
    }
  }

  return (
    <main className="container page page-narrow">
      <Section title={`🔑 ${t('owner.title')}`}>
        <Reveal>
          <form className="card form" onSubmit={handleSubmit}>
            <p className="muted" style={{ margin: 0 }}>{t('owner.hint')}</p>
            <label className="field">
              <span>{t('owner.code')}</span>
              <input
                type="password"
                required
                value={code}
                onChange={event => setCode(event.target.value)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? t('login.wait') : t('owner.enter')}
            </button>
          </form>
        </Reveal>
      </Section>
    </main>
  )
}
