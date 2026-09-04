import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConsoleLayout from '../components/ConsoleLayout'
import Reveal from '../components/Reveal'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LangContext'
import { api, type Order, type Ticket, type TicketMessage } from '../api/client'
import { site } from '../lib/site'
import { formatDate, formatPrice } from '../lib/format'

export default function Dashboard() {
  const { email, isAdmin, signOut } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [section, setSection] = useState('profile')

  useEffect(() => {
    if (!email) {
      navigate('/login?mode=signin')
    }
  }, [email, navigate])

  if (!email) {
    return null
  }

  const items = [
    { key: 'profile', icon: '👤', label: t('dash.profile') },
    { key: 'orders', icon: '📦', label: t('dash.myOrders') }
  ]
  if (site.shop) items.push({ key: 'support', icon: '🎧', label: t('dash.support') })

  return (
    <ConsoleLayout items={items} active={section} onSelect={setSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>{items.find(i => i.key === section)?.label}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            signOut()
            navigate('/')
          }}
        >
          {t('nav.signout')}
        </button>
      </div>

      {section === 'profile' && (
        <>
          <Reveal>
            <div className="card profile-card">
              <span className="avatar">{email.charAt(0).toUpperCase()}</span>
              <h3 style={{ margin: '6px 0 0', wordBreak: 'break-all' }}>{email}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {isAdmin ? (
                  <span className="badge badge-admin">{t('admin.admin')}</span>
                ) : (
                  <span className="badge badge-closed">{t('dash.member')}</span>
                )}
                <span className="badge badge-closed">{t('dash.profile')}</span>
              </div>
              {isAdmin && (
                <>
                  <p className="muted" style={{ margin: 0 }}>{t('dash.adminDesc')}</p>
                  <Link to="/admin" className="btn btn-primary btn-sm">
                    {t('dash.openAdmin')}
                  </Link>
                </>
              )}
              {!isAdmin && <ClaimAdminCard />}
              {site.shop ? (
                <Link to="/products" className="btn btn-ghost btn-sm">
                  {t('dash.keepShopping')}
                </Link>
              ) : null}
            </div>
          </Reveal>
        </>
      )}

      {section === 'orders' && <OrdersPanel />}
      {section === 'support' && site.shop && <SupportPanel />}
    </ConsoleLayout>
  )
}

function ClaimAdminCard() {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  // 'open' = no admin yet, card visible. Anything else renders nothing, so
  // once the owner has claimed admin, other accounts never see this section.
  const [seat, setSeat] = useState<'loading' | 'open' | 'taken'>('loading')

  useEffect(() => {
    api.adminStatus()
      .then(s => setSeat(s.hasAdmin ? 'taken' : 'open'))
      // Fail open: the server still guards the claim (410 when taken), so a
      // status hiccup never locks the owner out.
      .catch(() => setSeat('open'))
  }, [])

  async function handleClaim(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await api.claimAdmin(code.trim())
      setMessage({ ok: true, text: t('claim.success') })
      // Re-read the role from the server so the admin badge + panel appear.
      window.setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      const status = (err as { status?: number }).status
      setMessage({
        ok: false,
        text: status === 410 ? t('claim.taken') : err instanceof Error ? err.message : 'Claim failed.'
      })
    } finally {
      setBusy(false)
    }
  }

  if (seat !== 'open') return null

  return (
    <Reveal>
      <form className="card form" onSubmit={handleClaim} style={{ marginTop: 14 }}>
        <h3 style={{ margin: 0 }}>{t('claim.title')}</h3>
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{t('claim.desc')}</p>
        <label className="field">
          <span>{t('claim.code')}</span>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="••••" autoComplete="off" />
        </label>
        {message ? (
          <p className={message.ok ? 'form-success' : 'form-error'}>{message.text}</p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !code.trim()}>
          {busy ? t('claim.claiming') : t('claim.submit')}
        </button>
      </form>
    </Reveal>
  )
}

function OrdersPanel() {
  const { t, lang } = useI18n()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => setOrders([]))
  }, [])

  if (orders === null) return <div className="skeleton" style={{ height: 140 }} />
  if (orders.length === 0) return <div className="card muted">{t('dash.ordersEmpty')}</div>

  return (
    <div className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>{t('admin.orderCode')}</th>
            <th>{t('cart.total')}</th>
            <th>{t('admin.status')}</th>
            <th>{t('admin.date')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.code}>
              <td>{order.code}</td>
              <td>{formatPrice(Number(order.totalAmount ?? order.total_amount ?? 0), lang)}</td>
              <td>
                <StatusBadge status={order.status} />
              </td>
              <td className="muted">{formatDate(order.createdAt ?? order.created_at, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  const keys: Record<string, string> = {
    paid: 'status.paid',
    pending: 'status.pending',
    failed: 'status.failed',
    canceled: 'status.canceled',
    open: 'status.open',
    answered: 'status.answered',
    closed: 'status.closed'
  }
  const cls: Record<string, string> = {
    paid: 'badge-paid', pending: 'badge-pending', failed: 'badge-failed', canceled: 'badge-failed',
    open: 'badge-open', answered: 'badge-answered', closed: 'badge-closed'
  }
  return <span className={`badge ${cls[status] ?? 'badge-closed'}`}>{t(keys[status] ?? status)}</span>
}

function SupportPanel() {
  const { t } = useI18n()
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [thread, setThread] = useState<TicketMessage[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setTickets(await api.myTickets().catch(() => []))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await api.createTicket(subject, body)
      setSubject('')
      setBody('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function openTicket(id: number) {
    setOpenId(id)
    setThread(await api.ticketThread(id))
  }

  async function sendReply() {
    if (!openId || !reply.trim()) return
    const updated = await api.replyTicket(openId, reply)
    setThread(updated)
    setReply('')
    load()
  }

  return (
    <>
      <form className="card form" onSubmit={handleCreate} style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>{t('dash.newTicket')}</h3>
        <label className="field">
          <span>{t('dash.subject')}</span>
          <input required value={subject} onChange={e => setSubject(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('contact.message')}</span>
          <textarea rows={3} required value={body} onChange={e => setBody(e.target.value)} placeholder={t('dash.writeHere')} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {t('contact.send')}
        </button>
      </form>

      {tickets === null ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : tickets.length === 0 ? (
        <div className="card muted">{t('dash.noTickets')}</div>
      ) : (
        tickets.map(ticket => (
          <div key={ticket.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <strong>{ticket.subject}</strong>
              <StatusBadge status={ticket.status} />
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => openTicket(ticket.id)}>
              💬 {openId === ticket.id ? '−' : '+'}
            </button>
            {openId === ticket.id && (
              <div className="ticket-thread">
                {thread.map(message => (
                  <div key={message.id} className={message.sender === 'admin' ? 'ticket-msg admin-msg' : 'ticket-msg'}>
                    <div className="msg-meta">
                      <strong>{message.sender === 'admin' ? t('dash.supportTeam') : t('dash.you')}</strong>
                      <span>{(message.createdAt ?? message.created_at ?? '').slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    {message.body}
                  </div>
                ))}
                {ticket.status !== 'closed' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={reply} onChange={e => setReply(e.target.value)} placeholder={t('dash.writeHere')} />
                    <button type="button" className="btn btn-primary btn-sm" onClick={sendReply}>
                      {t('dash.reply')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </>
  )
}
