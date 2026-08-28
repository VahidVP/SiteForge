import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Product } from '../api/client'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { clearCart, getItems } from '../lib/cart'
import { getToken } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LangContext'
import { formatPrice } from '../lib/format'

export default function Cart() {
  const { t, lang } = useI18n()
  const { email } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setVersion] = useState(0)

  useEffect(() => {
    api.products().then(setProducts).catch(() => setFailed(true))
  }, [])

  const items = useMemo(() => {
    const ids = new Set(getItems())
    return (products ?? []).filter(product => ids.has(product.id))
  }, [products])

  const total = items.reduce((sum, item) => sum + Number(item.price), 0)

  async function handleCheckout() {
    if (!getToken()) {
      navigate('/login?mode=signin')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await api.checkout(getItems())
      window.location.href = res.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.')
      setBusy(false)
    }
  }

  if (!getItems().length && products !== null) {
    return (
      <main className="container page page-narrow">
        <Section title={t('cart.title')}>
          <div className="card" style={{ textAlign: 'center', padding: 44 }}>
            <p style={{ fontSize: '2rem', margin: 0 }}>🛒</p>
            <p className="muted">{t('cart.empty')}</p>
            <Link to="/products" className="btn btn-primary">
              {t('cart.browse')}
            </Link>
          </div>
        </Section>
      </main>
    )
  }

  return (
    <main className="container page page-narrow">
      <Section title={t('cart.title')}>
        {failed ? (
          <p className="muted">Start the backend server to load your cart.</p>
        ) : products === null ? (
          <div className="skeleton" style={{ height: 180 }} />
        ) : (
          <Reveal>
            {email ? null : <p className="form-success">{t('cart.signinFirst')}</p>}
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t('cart.product')}</th>
                    <th>{t('cart.price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{lang === 'fa' && item.nameFa ? item.nameFa : item.name}</td>
                      <td>{formatPrice(item.price, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="product-row" style={{ padding: '14px 12px 4px', borderTop: '1px solid var(--border)' }}>
                <strong>{t('cart.total')}</strong>
                <span className="price">{formatPrice(total, lang)}</span>
              </div>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-primary btn-lg anim-pop"
                onClick={handleCheckout}
                disabled={busy}
              >
                {busy ? t('common.loading') : `💳 ${t('cart.checkout')}`}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { clearCart(); setVersion(v => v + 1) }}>
                {t('cart.clear')}
              </button>
            </div>
          </Reveal>
        )}
      </Section>
    </main>
  )
}
