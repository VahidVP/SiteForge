import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConsoleLayout, { type ConsoleItem } from '../components/ConsoleLayout'
import { api, type AdminMessage, type AdminUser, type Order, type Product, type Ticket, type TicketMessage, getProductDetails } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LangContext'
import { site } from '../lib/site'
import { formatDate, formatPrice } from '../lib/format'
import StatusBadge from '../components/StatusBadge'



export default function Admin() {
  const { email, isAdmin } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  useEffect(() => {
    if (site.auth && !email) {
      navigate('/login?mode=signin')
    }
  }, [email, navigate])

  if (site.auth && email && !isAdmin) {
    return (
      <main className="container page page-narrow">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="muted">Only the site owner can open this page.</p>
          <Link to="/dashboard" className="btn btn-ghost">
            ← {t('nav.dashboard')}
          </Link>
        </div>
      </main>
    )
  }

  if (site.auth && !email) {
    return null
  }

  const items: ConsoleItem[] = [{ key: 'messages', icon: '✉️', label: t('admin.messages') }]
  if (site.shop) {
    items.unshift(
      { key: 'overview', icon: '📊', label: t('admin.overview') },
      { key: 'orders', icon: '🧾', label: t('admin.orders') },
      { key: 'products', icon: '📦', label: t('admin.products') },
      { key: 'tickets', icon: '🎧', label: t('admin.tickets') },
      { key: 'payment', icon: '💳', label: t('admin.payment') }
    )
  }
  if (site.auth) {
    items.push({ key: 'users', icon: '👤', label: t('admin.users') })
  }

  const [section, setSection] = useState(items[0].key)

  return (
    <ConsoleLayout items={items} active={section} onSelect={setSection}>
      {section === 'overview' && site.shop && <Overview />}
      {section === 'orders' && site.shop && <OrdersPanel />}
      {section === 'products' && site.shop && <ProductsPanel />}
      {section === 'tickets' && site.shop && <TicketsPanel />}
      {section === 'payment' && site.shop && <PaymentSettingsPanel />}
      {section === 'messages' && site.contact && <MessagesPanel />}
      {section === 'users' && site.auth && <UsersPanel />}
    </ConsoleLayout>
  )
}

function Overview() {
  const { t, lang } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [messages, setMessages] = useState<AdminMessage[]>([])

  useEffect(() => {
    api.admin.orders().then(setOrders).catch(() => {})
    api.admin.tickets().then(setTickets).catch(() => {})
    api.admin.users().then(setUsers).catch(() => {})
    api.admin.messages().then(setMessages).catch(() => {})
  }, [])

  const paid = orders.filter(o => o.status === 'paid')
  const revenue = paid.reduce((sum, o) => sum + Number(o.totalAmount ?? o.total_amount ?? 0), 0)
  const openTickets = tickets.filter(tk => tk.status !== 'closed').length

  const cards = [
    { value: lang === 'fa' ? String(users.length).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(users.length), label: t('admin.users') },
    { value: lang === 'fa' ? String(orders.length).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(orders.length), label: t('admin.orders') },
    { value: lang === 'fa' ? `${String(revenue).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])} تومان` : `${revenue.toLocaleString()} Tooman`, label: t('cart.total') },
    { value: lang === 'fa' ? String(openTickets).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(openTickets), label: t('admin.tickets') },
    { value: lang === 'fa' ? String(messages.length).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(messages.length), label: t('admin.messages') }
  ]

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{t('admin.overviewSites')}</h3>
      <div className="grid grid-4">
        {cards.map(card => (
          <div key={card.label} className="card stat">
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function OrdersPanel() {
  const { t, lang } = useI18n()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    api.admin.orders().then(setOrders).catch(() => setOrders([]))
  }, [])

  if (orders === null) return <div className="skeleton" style={{ height: 140 }} />
  if (orders.length === 0) return <div className="card muted">{t('admin.noData')}</div>

  return (
    <div className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>{t('admin.orderCode')}</th>
            <th>{t('admin.customer')}</th>
            <th>{t('cart.total')}</th>
            <th>{t('admin.status')}</th>
            <th>{t('admin.date')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.code}>
              <td>{order.code}</td>
              <td>{order.userEmail ?? order.user_email ?? '—'}</td>
              <td>{formatPrice(order.totalAmount ?? order.total_amount ?? 0, lang)}</td>
              <td><StatusBadge status={order.status} /></td>
              <td className="muted">{formatDate(order.createdAt ?? order.created_at, lang)} {(order.createdAt ?? order.created_at ?? '').slice(11, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsersPanel() {
  const { t } = useI18n()
  const { email } = useAuth()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.admin.users().then(setUsers).catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this user?')) return
    try {
      await api.admin.deleteUser(id)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  if (error) return <div className="card error-card">{error}</div>
  if (users === null) return <div className="skeleton" style={{ height: 160 }} />

  return (
    <div className="card table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>{t('admin.email')}</th>
            <th>{t('admin.role')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{(user.isAdmin ?? user.is_staff) ? <span className="badge badge-admin">{t('admin.admin')}</span> : t('dash.profile')}</td>
              <td style={{ textAlign: 'end' }}>
                {user.email !== email ? (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                    {t('admin.delete')}
                  </button>
                ) : (
                  <span className="muted" style={{ fontSize: '0.85rem' }}>{t('admin.you')}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductsPanel() {
  const { t, lang } = useI18n()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '',
    nameFa: '',
    price: '',
    description: '',
    descriptionFa: '',
    imageUrl: '',
    featured: false
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    nameFa: '',
    price: '',
    description: '',
    descriptionFa: '',
    imageUrl: '',
    featured: false
  })
  const [editDetails, setEditDetails] = useState<Array<{ key: string; value: string }>>([])
  const [editBusy, setEditBusy] = useState(false)

  const load = useCallback(() => {
    api.admin.products().then(setProducts).catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.admin.createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        featured: form.featured,
        nameFa: form.nameFa || undefined,
        descriptionFa: form.descriptionFa || undefined
      })
      setForm({ name: '', nameFa: '', price: '', description: '', descriptionFa: '', imageUrl: '', featured: false })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add product.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.admin.deleteProduct(id)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  function startEdit(product: Product) {
    const details = getProductDetails(product)
    const rows = Object.entries(details).map(([k, v]) => ({ key: k, value: String(v) }))
    setEditingId(product.id)
    setEditForm({
      name: product.name,
      nameFa: (product.nameFa ?? product.name_fa ?? '') as string,
      price: String(product.price),
      description: product.description ?? '',
      descriptionFa: (product.descriptionFa ?? product.description_fa ?? '') as string,
      imageUrl: (product.imageUrl ?? product.image_url ?? product.ImageUrl ?? '') as string,
      featured: Boolean(product.featured)
    })
    setEditDetails(rows.length ? rows : [{ key: '', value: '' }])
    setError(null)
  }

  async function handleSaveEdit() {
    if (editingId === null) return
    setEditBusy(true)
    setError(null)
    try {
      const detailsObj: Record<string, string> = {}
      editDetails.forEach(r => {
        const k = r.key.trim()
        if (k) detailsObj[k] = r.value
      })
      await api.admin.updateProduct(editingId, {
        name: editForm.name,
        nameFa: editForm.nameFa,
        name_fa: editForm.nameFa,
        description: editForm.description,
        descriptionFa: editForm.descriptionFa,
        description_fa: editForm.descriptionFa,
        price: Number(editForm.price),
        imageUrl: editForm.imageUrl,
        image_url: editForm.imageUrl,
        featured: editForm.featured,
        details: detailsObj,
        DetailsJson: JSON.stringify(detailsObj)
      })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setEditBusy(false)
    }
  }

  function updateDetailRow(idx: number, field: 'key' | 'value', val: string) {
    setEditDetails(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))
  }
  function addDetailRow() {
    setEditDetails(prev => [...prev, { key: '', value: '' }])
  }
  function removeDetailRow(idx: number) {
    setEditDetails(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <>
      <form className="card form" onSubmit={handleCreate} style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>{t('admin.addProduct')}</h3>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <label className="field">
            <span>{t('admin.name')}</span>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} dir="ltr" />
          </label>
          <label className="field">
            <span>{t('admin.nameFa')}</span>
            <input value={form.nameFa} onChange={e => setForm({ ...form, nameFa: e.target.value })} dir="rtl" />
          </label>
          <label className="field">
            <span>{t('admin.priceTomans')}</span>
            <input required type="number" min="0" step="1" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} />
          </label>
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <label className="field">
            <span>{t('admin.desc')}</span>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} dir="ltr" />
          </label>
          <label className="field">
            <span>{t('admin.descFa')}</span>
            <textarea rows={2} value={form.descriptionFa} onChange={e => setForm({ ...form, descriptionFa: e.target.value })} dir="rtl" />
          </label>
        </div>
        <div className="grid grid-2" style={{ gap: 14, alignItems: 'center' }}>
          <label className="field">
            <span>{t('admin.imageUrl')}</span>
            <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
          </label>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
            <span>{t('admin.featuredHome')}</span>
          </label>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('admin.adding') : t('admin.create')}
        </button>
      </form>

      {editingId !== null ? (
        <div className="card form" style={{ marginBottom: 18, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Edit product #{editingId}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕ Cancel</button>
          </div>
          <div className="grid grid-2" style={{ gap: 14 }}>
            <label className="field">
              <span>{t('admin.name')}</span>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} dir="ltr" />
            </label>
            <label className="field">
              <span>{t('admin.nameFa')}</span>
              <input value={editForm.nameFa} onChange={e => setEditForm({ ...editForm, nameFa: e.target.value })} dir="rtl" />
            </label>
            <label className="field">
              <span>{t('admin.priceTomans')}</span>
              <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
            </label>
            <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={editForm.featured} onChange={e => setEditForm({ ...editForm, featured: e.target.checked })} />
              <span>{t('admin.featuredHome')}</span>
            </label>
          </div>
          <div className="grid grid-2" style={{ gap: 14 }}>
            <label className="field">
              <span>{t('admin.desc')}</span>
              <textarea rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} dir="ltr" />
            </label>
            <label className="field">
              <span>{t('admin.descFa')}</span>
              <textarea rows={2} value={editForm.descriptionFa} onChange={e => setEditForm({ ...editForm, descriptionFa: e.target.value })} dir="rtl" />
            </label>
          </div>
          <label className="field">
            <span>{t('admin.imageUrl')}</span>
            <input value={editForm.imageUrl} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="https://…" />
          </label>

          <div className="field">
            <span>Custom details (e.g., Size: M, Material: Cotton) — leave key empty to omit</span>
            {editDetails.map((row, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input placeholder="Key (e.g., Size)" value={row.key} onChange={e => updateDetailRow(idx, 'key', e.target.value)} style={{ flex: 1 }} />
                <input placeholder="Value (e.g., M)" value={row.value} onChange={e => updateDetailRow(idx, 'value', e.target.value)} style={{ flex: 1 }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeDetailRow(idx)} aria-label="Remove row">✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addDetailRow}>+ Add field</button>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-primary" disabled={editBusy} onClick={handleSaveEdit}>
              {editBusy ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </div>
      ) : null}

      {products === null ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('admin.name')}</th>
                <th>{t('cart.price')}</th>
                <th>{t('products.featured')}</th>
                <th>Details</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const details = getProductDetails(product)
                const entries = Object.entries(details)
                return (
                  <tr key={product.id}>
                    <td>{lang === 'fa' && (product.nameFa || product.name_fa) ? (product.nameFa || product.name_fa) as string : product.name}</td>
                    <td>{formatPrice(product.price, lang)}</td>
                    <td>{product.featured ? '★' : ''}</td>
                    <td>
                      {entries.length ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {entries.map(([k, v]) => (
                            <span key={k} className="tag">{k}: {v}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'end', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(product)} style={{ marginInlineEnd: 6 }}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>
                        {t('admin.delete')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function MessagesPanel() {
  const { t } = useI18n()
  const [messages, setMessages] = useState<AdminMessage[] | null>(null)

  useEffect(() => {
    api.admin.messages().then(setMessages).catch(() => setMessages([]))
  }, [])

  if (messages === null) return <div className="skeleton" style={{ height: 140 }} />
  if (messages.length === 0) return <div className="card muted">{t('admin.noData')}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.map(message => (
        <div key={message.id} className="card message-card">
          <div className="msg-meta">
            <strong>{message.name}</strong>
            <span>{message.email}</span>
            <span>{(message.createdAt ?? message.created_at ?? '').slice(0, 16).replace('T', ' ')}</span>
          </div>
          <p style={{ margin: 0 }}>{message.message}</p>
        </div>
      ))}
    </div>
  )
}

function TicketsPanel() {
  const { t } = useI18n()
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [thread, setThread] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')

  useEffect(() => {
    api.admin.tickets().then(setTickets).catch(() => setTickets([]))
  }, [])

  async function openTicket(id: number) {
    setOpenId(id)
    setThread(await api.admin.ticketThread(id))
  }

  async function sendReply() {
    if (!openId || !reply.trim()) return
    await api.admin.replyTicket(openId, reply)
    setReply('')
    setThread(await api.admin.ticketThread(openId))
    setTickets(await api.admin.tickets())
  }

  async function closeTicket(id: number) {
    await api.admin.closeTicket(id)
    setTickets(await api.admin.tickets())
  }

  if (tickets === null) return <div className="skeleton" style={{ height: 140 }} />
  if (tickets.length === 0) return <div className="card muted">{t('admin.noData')}</div>

  return (
    tickets.map(ticket => (
      <div key={ticket.id} className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <strong>{ticket.subject}</strong>
          <span className="muted" style={{ fontSize: '0.85rem' }}>{ticket.userEmail ?? ticket.user_email}</span>
          <StatusBadge status={ticket.status} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openTicket(ticket.id)}>
            💬 {openId === ticket.id ? '−' : '+'}
          </button>
          {ticket.status !== 'closed' && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => closeTicket(ticket.id)}>
              {t('admin.closeTicket')}
            </button>
          )}
        </div>
        {openId === ticket.id && (
          <div className="ticket-thread">
            {thread.map(message => (
              <div key={message.id} className={message.sender === 'admin' ? 'ticket-msg admin-msg' : 'ticket-msg'}>
                <div className="msg-meta">
                  <strong>{message.sender === 'admin' ? '🛡️ Support' : '👤 Customer'}</strong>
                  <span>{(message.createdAt ?? message.created_at ?? '').slice(0, 16).replace('T', ' ')}</span>
                </div>
                {message.body}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={reply} onChange={e => setReply(e.target.value)} placeholder={t('dash.writeHere')} />
              <button type="button" className="btn btn-primary btn-sm" onClick={sendReply}>
                {t('admin.reply')}
              </button>
            </div>
          </div>
        )}
      </div>
    ))
  )
}

function PaymentSettingsPanel() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<{ enabled: boolean; sandbox: boolean; merchantId: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.admin.paymentSettings().then(data =>
      setSettings({
        enabled: Boolean(data.enabled),
        sandbox: Boolean(data.sandbox),
        merchantId: data.merchantId ?? data.merchant_id ?? ''
      })
    )
  }, [])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!settings) return
    setBusy(true)
    try {
      const savedData = await api.admin.savePaymentSettings({
        enabled: settings.enabled,
        sandbox: settings.sandbox,
        merchantId: settings.merchantId.trim()
      })
      setSettings({
        enabled: Boolean(savedData.enabled),
        sandbox: Boolean(savedData.sandbox),
        merchantId: savedData.merchantId ?? savedData.merchant_id ?? ''
      })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } finally {
      setBusy(false)
    }
  }

  if (!settings) return <div className="skeleton" style={{ height: 220 }} />

  return (
    <form className="card form" onSubmit={handleSave} style={{ maxWidth: 560 }}>
      <h3 style={{ margin: 0 }}>💳 {t('admin.payTitle')}</h3>
      <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{t('admin.payNote')}</p>
      <label className="field">
        <span>{t('admin.merchantId')}</span>
        <input value={settings.merchantId} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          onChange={e => setSettings({ ...settings, merchantId: e.target.value })} />
      </label>
      <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} />
        <span>{t('admin.enablePay')}</span>
      </label>
      <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={settings.sandbox} onChange={e => setSettings({ ...settings, sandbox: e.target.checked })} />
        <span>{t('admin.sandboxMode')}</span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {saved ? t('admin.saved') : t('admin.saveSettings')}
      </button>
    </form>
  )
}
