import { useState } from 'react'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { api } from '../api/client'
import { useI18n } from '../context/LangContext'

export default function Contact() {
  const { t } = useI18n()
  const [nameValue, setNameValue] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [messageValue, setMessageValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.sendContact({ name: nameValue, email: emailValue, message: messageValue })
      setSent(true)
      setNameValue('')
      setEmailValue('')
      setMessageValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container page page-narrow">
      <Section title={t('nav.contact')}>
        {sent ? <p className="form-success">{t('contact.sent')}</p> : null}
        <Reveal>
          <form className="card form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{t('contact.name')}</span>
              <input required value={nameValue} onChange={event => setNameValue(event.target.value)} />
            </label>
            <label className="field">
              <span>{t('contact.email')}</span>
              <input type="email" required value={emailValue} onChange={event => setEmailValue(event.target.value)} />
            </label>
            <label className="field">
              <span>{t('contact.message')}</span>
              <textarea required rows={5} value={messageValue} onChange={event => setMessageValue(event.target.value)} />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? t('contact.sending') : `✉️ ${t('contact.send')}`}
            </button>
          </form>
        </Reveal>
      </Section>
    </main>
  )
}
