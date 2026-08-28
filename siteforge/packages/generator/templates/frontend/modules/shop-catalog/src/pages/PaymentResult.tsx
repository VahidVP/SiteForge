import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { api, type Order } from '../api/client'
import { useI18n } from '../context/LangContext'

export default function PaymentResult() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const code = params.get('order') ?? ''
  const [order, setOrder] = useState<Order | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (code) {
      api.orderByCode(code).then(setOrder).catch(() => setFailed(true))
    }
  }, [code])

  const status = order?.status ?? 'pending'
  const paid = status === 'paid'
  const alreadyPaid = status === 'paid'

  return (
    <main className="container page page-narrow">
      <Section title={t('cart.title')}>
        <div className="card payment-hero">
          <p style={{ fontSize: '3rem', margin: 0 }}>{paid ? '✅' : failed ? '❌' : '⏳'}</p>
          <h2>{failed || (!order && failed) ? t('payment.failed') : paid ? t('payment.success') : t('common.loading')}</h2>
          {order ? (
            <Reveal>
              <div className="table-wrap" style={{ textAlign: 'start', marginTop: 12 }}>
                <table className="data">
                  <tbody>
                    <tr>
                      <td className="muted">{t('payment.orderCode')}</td>
                      <td>{order.code}</td>
                    </tr>
                    <tr>
                      <td className="muted">{t('admin.status')}</td>
                      <td>{alreadyPaid ? t('payment.alreadyPaid') : status}</td>
                    </tr>
                    {(order.refId ?? order.ref_id) ? (
                      <tr>
                        <td className="muted">{t('payment.refId')}</td>
                        <td>{order.refId ?? order.ref_id}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Reveal>
          ) : null}
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            {t('payment.backHome')}
          </Link>
        </div>
      </Section>
    </main>
  )
}
