import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConsoleLayout, { type ConsoleItem } from '../components/ConsoleLayout'
import { api, type AdminMessage, type AdminUser, type MediaFile, type Order, type Product, type Project, type ServiceItem, type Ticket, type TicketMessage, getItemGallery, getOwnerToken, getProductDetails, resolveImageUrl } from '../api/client'
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

  if (!site.auth && !getOwnerToken()) {
    return (
      <main className="container page page-narrow">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="muted">🔑 This area is for the website owner only.</p>
          <Link to="/owner" className="btn btn-primary">
            {t('owner.enter')}
          </Link>
        </div>
      </main>
    )
  }

const items: ConsoleItem[] = [{ key: 'messages', icon: '✉️', label: t('admin.messages') }]
  if (site.isPersonal) {
    items.unshift({ key: 'projects', icon: '🗂️', label: t('admin.projects') })
  }
  if (site.isBusiness) {
    items.unshift({ key: 'services', icon: '🧩', label: t('admin.services') })
  }
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
      {section === 'projects' && site.isPersonal && <ProjectsPanel />}
      {section === 'services' && site.isBusiness && <ServicesPanel />}
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

  async function handleRole(id: number, isAdmin: boolean) {
    try {
      await api.admin.setUserRole(id, isAdmin)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Role change failed.')
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
              <td style={{ textAlign: 'end', whiteSpace: 'nowrap' }}>
                {user.email !== email ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginInlineEnd: 6 }}
                      onClick={() => handleRole(user.id, !(user.isAdmin ?? user.is_staff))}
                    >
                      {(user.isAdmin ?? user.is_staff) ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                      {t('admin.delete')}
                    </button>
                  </>
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

type DetailRow = { key: string; keyFa: string; value: string; valueFa: string }

const emptyDetailRow = (): DetailRow => ({ key: '', keyFa: '', value: '', valueFa: '' })

function buildDetails(rows: DetailRow[]): DetailRow[] {
  return rows
    .map(r => ({ key: r.key.trim(), keyFa: r.keyFa.trim(), value: r.value.trim(), valueFa: r.valueFa.trim() }))
    .filter(r => r.key || r.keyFa || r.value || r.valueFa)
}

function updateDetailRow(rows: DetailRow[], idx: number, field: keyof DetailRow, val: string): DetailRow[] {
  return rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
}

function DetailsEditor({ rows, onChange }: { rows: DetailRow[]; onChange: (rows: DetailRow[]) => void }) {
  const { t } = useI18n()
  const bilingual = Boolean(site.bilingual)
  return (
    <div className="field">
      <span>{t('admin.details')}</span>
      {rows.map((row, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input
            placeholder={bilingual ? `${t('admin.detailKey')} (EN)` : t('admin.detailKey')}
            value={row.key}
            onChange={e => onChange(updateDetailRow(rows, idx, 'key', e.target.value))}
            style={{ flex: 1, minWidth: 90 }}
          />
          {bilingual ? (
            <input
              placeholder={t('admin.detailKeyFa')}
              value={row.keyFa}
              dir="rtl"
              onChange={e => onChange(updateDetailRow(rows, idx, 'keyFa', e.target.value))}
              style={{ flex: 1, minWidth: 90 }}
            />
          ) : null}
          <input
            placeholder={bilingual ? `${t('admin.detailValue')} (EN)` : t('admin.detailValue')}
            value={row.value}
            onChange={e => onChange(updateDetailRow(rows, idx, 'value', e.target.value))}
            style={{ flex: 1, minWidth: 90 }}
          />
          {bilingual ? (
            <input
              placeholder={t('admin.detailValueFa')}
              value={row.valueFa}
              dir="rtl"
              onChange={e => onChange(updateDetailRow(rows, idx, 'valueFa', e.target.value))}
              style={{ flex: 1, minWidth: 90 }}
            />
          ) : null}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(rows.filter((_, i) => i !== idx))} aria-label={t('admin.removeField')}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...rows, emptyDetailRow()])}>+ {t('admin.addField')}</button>
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
  const [formDetails, setFormDetails] = useState<DetailRow[]>([emptyDetailRow()])
  const [editDetails, setEditDetails] = useState<DetailRow[]>([])
  const [editBusy, setEditBusy] = useState(false)
  const [formGallery, setFormGallery] = useState<string[]>([])
  const [editGallery, setEditGallery] = useState<string[]>([])

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
      const detailsRows = buildDetails(formDetails)
      await api.admin.createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        featured: form.featured,
        nameFa: form.nameFa || undefined,
        descriptionFa: form.descriptionFa || undefined,
        gallery: formGallery,
        details: detailsRows,
        DetailsJson: detailsRows.length ? JSON.stringify(detailsRows) : undefined
      })
      setForm({ name: '', nameFa: '', price: '', description: '', descriptionFa: '', imageUrl: '', featured: false })
      setFormDetails([emptyDetailRow()])
      setFormGallery([])
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
    const rows = getProductDetails(product)
    const detailRows: DetailRow[] = rows.map(r => ({
      key: r.key,
      keyFa: r.keyFa ?? r.key_fa ?? '',
      value: r.value,
      valueFa: r.valueFa ?? r.value_fa ?? ''
    }))
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
    setEditDetails(detailRows.length ? detailRows : [emptyDetailRow()])
    setEditGallery(getItemGallery(product))
    setError(null)
  }

  async function handleSaveEdit() {
    if (editingId === null) return
    setEditBusy(true)
    setError(null)
    try {
      const detailsRows = buildDetails(editDetails)
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
        gallery: editGallery,
        details: detailsRows,
        DetailsJson: JSON.stringify(detailsRows)
      })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setEditBusy(false)
    }
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
        <MediaPicker value={formGallery} onChange={setFormGallery} />
        <DetailsEditor rows={formDetails} onChange={setFormDetails} />
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

          <MediaPicker value={editGallery} onChange={setEditGallery} />

          <div className="field">
            <DetailsEditor rows={editDetails} onChange={setEditDetails} />
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
                <th>{t('admin.details')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const details = getProductDetails(product)
                return (
                  <tr key={product.id}>
                    <td>{lang === 'fa' && (product.nameFa || product.name_fa) ? (product.nameFa || product.name_fa) as string : product.name}</td>
                    <td>{formatPrice(product.price, lang)}</td>
                    <td>{product.featured ? '★' : ''}</td>
                    <td>
                      {details.length ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {details.map((row, idx) => (
                            <span key={idx} className="tag">
                              {lang === 'fa' && row.keyFa ? row.keyFa : row.key}: {lang === 'fa' && row.valueFa ? row.valueFa : row.value}
                            </span>
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

function MediaPicker({ value, onChange, max = 8 }: { value: string[]; onChange: (next: string[]) => void; max?: number }) {
  const { t } = useI18n()
  const [media, setMedia] = useState<MediaFile[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.media.list().then(setMedia).catch(err => {
      setMedia([])
      setError(err instanceof Error ? err.message : 'Could not load images.')
    })
  }, [])

  function toggle(url: string) {
    setError(null)
    onChange(null === value ? [url] : value.includes(url) ? value.filter(u => u !== url) : [...value, url].slice(0, max))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const uploaded = (await api.media.upload(files)) || []
      // Be liberal in what we accept: some stacks wrap the urls, some return
      // plain strings — either way we want thumbnails to appear instantly.
      const urls = uploaded
        .map(u => (typeof u === 'string' ? u : u?.url))
        .filter((u): u is string => typeof u === 'string' && u.length > 0)
      setMedia(prev => {
        const existing = prev ?? []
        const known = new Set(existing.map(m => m.url))
        const fresh = urls.filter(u => !known.has(u)).map(u => ({ name: u.split('/').pop() ?? u, url: u }))
        return [...existing, ...fresh]
      })
      if (urls.length) onChange([...(value ?? []), ...urls].slice(0, max))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const selected = value ?? []

  return (
    <div className="field">
      <span>{t('admin.gallery')} {selected.length ? `(${selected.length}/${max})` : ''}</span>
      {/* Chosen images — visible immediately so it is obvious the pick worked.
          The first one becomes the card cover on the portfolio/services pages. */}
      {selected.length > 0 ? (
        <div className="media-grid" style={{ marginBottom: 8 }}>
          {selected.map(url => (
            <span key={url} className="media-item selected" title={url}>
              <img src={resolveImageUrl(url)} alt="" loading="lazy" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', top: 2, insetInlineEnd: 2, padding: '0 6px' }}
                onClick={() => onChange(selected.filter(u => u !== url))}
                aria-label={t('admin.removeField')}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {/* Library grid hides already-chosen images — otherwise every pick
          shows twice (once above, once highlighted below), which reads as
          a duplicate in the edit form. Unpick via the ✕ above to return
          an image to the library. */}
      <div className="media-grid">
        {(media ?? []).filter(file => !selected.includes(file.url)).map(file => (
          <button
            key={file.url}
            type="button"
            className="media-item"
            onClick={() => toggle(file.url)}
            title={file.name}
          >
            <img src={resolveImageUrl(file.url)} alt={file.name} loading="lazy" />
          </button>
        ))}
      </div>
      {media !== null && media.length === 0 && selected.length === 0 ? (
        <p className="muted" style={{ fontSize: '0.85rem', margin: '6px 0 0' }}>{t('admin.noData')}</p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <label className="btn btn-ghost btn-sm" style={{ marginTop: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {busy ? t('admin.uploading') : `⬆ ${t('admin.uploadImages')}`}
        <input type="file" accept="image/webp,image/png,image/jpeg,image/svg+xml,image/gif" multiple hidden onChange={handleUpload} />
      </label>
    </div>
  )
}

type ProjectDraft = {
  name: string
  nameFa: string
  summary: string
  summaryFa: string
  description: string
  descriptionFa: string
  tags: string
  gallery: string[]
}

function ProjectsPanel() {
  const { t, lang } = useI18n()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<ProjectDraft>({ name: '', nameFa: '', summary: '', summaryFa: '', description: '', descriptionFa: '', tags: '', gallery: [] })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ProjectDraft>({ name: '', nameFa: '', summary: '', summaryFa: '', description: '', descriptionFa: '', tags: '', gallery: [] })
  const [editBusy, setEditBusy] = useState(false)

  const load = useCallback(() => {
    api.admin.projects().then(setProjects).catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const tagsToArray = (raw: string) => raw.split(',').map(s => s.trim()).filter(Boolean)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.admin.createProject({
        name: form.name,
        nameFa: form.nameFa || undefined,
        summary: form.summary,
        summaryFa: form.summaryFa || undefined,
        description: form.description,
        descriptionFa: form.descriptionFa || undefined,
        tags: tagsToArray(form.tags),
        gallery: form.gallery
      })
      setForm({ name: '', nameFa: '', summary: '', summaryFa: '', description: '', descriptionFa: '', tags: '', gallery: [] })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add project.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.admin.deleteProject(id)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  function startEdit(project: Project) {
    const gallery = getItemGallery(project)
    const tags = Array.isArray(project.tags) && project.tags.length > 0 ? project.tags : (project.Tags ?? [])
    setEditingId(project.id)
    setEditForm({
      name: project.name,
      nameFa: project.nameFa ?? '',
      summary: project.summary ?? '',
      summaryFa: project.summaryFa ?? '',
      description: project.description ?? '',
      descriptionFa: project.descriptionFa ?? '',
      tags: tags.join(', '),
      gallery
    })
    setError(null)
  }

  async function handleSaveEdit() {
    if (editingId === null) return
    setEditBusy(true)
    setError(null)
    try {
      await api.admin.updateProject(editingId, {
        name: editForm.name,
        nameFa: editForm.nameFa,
        name_fa: editForm.nameFa,
        summary: editForm.summary,
        summaryFa: editForm.summaryFa,
        summary_fa: editForm.summaryFa,
        description: editForm.description,
        descriptionFa: editForm.descriptionFa,
        description_fa: editForm.descriptionFa,
        tags: tagsToArray(editForm.tags),
        gallery: editForm.gallery
      })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setEditBusy(false)
    }
  }

  return (
    <>
      <form className="card form" onSubmit={handleCreate} style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>{t('admin.addProject')}</h3>
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
            <span>{t('admin.summary')}</span>
            <textarea rows={2} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} dir="ltr" />
          </label>
          <label className="field">
            <span>{t('admin.summaryFa')}</span>
            <textarea rows={2} value={form.summaryFa} onChange={e => setForm({ ...form, summaryFa: e.target.value })} dir="rtl" />
          </label>
          <label className="field">
            <span>{t('admin.desc')}</span>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} dir="ltr" />
          </label>
          <label className="field">
            <span>{t('admin.descFa')}</span>
            <textarea rows={3} value={form.descriptionFa} onChange={e => setForm({ ...form, descriptionFa: e.target.value })} dir="rtl" />
          </label>
          <label className="field">
            <span>{t('admin.tags')}</span>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="React, PWA" dir="ltr" />
          </label>
        </div>
        <MediaPicker value={form.gallery} onChange={next => setForm({ ...form, gallery: next })} />
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('admin.adding') : t('admin.create')}
        </button>
      </form>

      {editingId !== null ? (
        <div className="card form" style={{ marginBottom: 18, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Edit project #{editingId}</h3>
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
              <span>{t('admin.summary')}</span>
              <textarea rows={2} value={editForm.summary} onChange={e => setEditForm({ ...editForm, summary: e.target.value })} dir="ltr" />
            </label>
            <label className="field">
              <span>{t('admin.summaryFa')}</span>
              <textarea rows={2} value={editForm.summaryFa} onChange={e => setEditForm({ ...editForm, summaryFa: e.target.value })} dir="rtl" />
            </label>
            <label className="field">
              <span>{t('admin.desc')}</span>
              <textarea rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} dir="ltr" />
            </label>
            <label className="field">
              <span>{t('admin.descFa')}</span>
              <textarea rows={3} value={editForm.descriptionFa} onChange={e => setEditForm({ ...editForm, descriptionFa: e.target.value })} dir="rtl" />
            </label>
            <label className="field">
              <span>{t('admin.tags')}</span>
              <input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} dir="ltr" />
            </label>
          </div>
          <MediaPicker value={editForm.gallery} onChange={next => setEditForm({ ...editForm, gallery: next })} />
          {error ? <p className="form-error">{error}</p> : null}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-primary" disabled={editBusy} onClick={handleSaveEdit}>
              {editBusy ? t('admin.saving') : t('admin.save')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </div>
      ) : null}

      {projects === null ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : projects.length === 0 ? (
        <div className="card muted">{t('admin.noData')}</div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('admin.name')}</th>
                <th>{t('admin.summary')}</th>
                <th>Gallery</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const name = lang === 'fa' && project.nameFa ? project.nameFa : project.name
                const summary = lang === 'fa' && project.summaryFa ? project.summaryFa : (project.summary ?? '')
                const gallery = getItemGallery(project)
                return (
                  <tr key={project.id}>
                    <td>{name}</td>
                    <td className="muted">{summary}</td>
                    <td>
                      {gallery.length ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {gallery.slice(0, 3).map(url => (
                            <img key={url} src={resolveImageUrl(url)} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} loading="lazy" />
                          ))}
                          {gallery.length > 3 ? <span className="muted">+{gallery.length - 3}</span> : null}
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'end', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(project)} style={{ marginInlineEnd: 6 }}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(project.id)}>
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

type ServiceDraft = {
  title: string
  titleFa: string
  text: string
  textFa: string
  icon: string
  gallery: string[]
}

function ServicesPanel() {
  const { t, lang } = useI18n()
  const [services, setServices] = useState<ServiceItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<ServiceDraft>({ title: '', titleFa: '', text: '', textFa: '', icon: '', gallery: [] })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ServiceDraft>({ title: '', titleFa: '', text: '', textFa: '', icon: '', gallery: [] })
  const [editBusy, setEditBusy] = useState(false)

  const load = useCallback(() => {
    api.admin.services().then(setServices).catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.admin.createService({
        title: form.title,
        titleFa: form.titleFa || undefined,
        text: form.text,
        textFa: form.textFa || undefined,
        icon: form.icon,
        gallery: form.gallery
      })
      setForm({ title: '', titleFa: '', text: '', textFa: '', icon: '', gallery: [] })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add service.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this service?')) return
    try {
      await api.admin.deleteService(id)
      load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  function startEdit(service: ServiceItem) {
    setEditingId(service.id)
    setEditForm({
      title: service.title,
      titleFa: service.titleFa ?? '',
      text: service.text ?? '',
      textFa: service.textFa ?? '',
      icon: service.icon ?? '',
      gallery: getItemGallery(service)
    })
    setError(null)
  }

  async function handleSaveEdit() {
    if (editingId === null) return
    setEditBusy(true)
    setError(null)
    try {
      await api.admin.updateService(editingId, {
        title: editForm.title,
        titleFa: editForm.titleFa,
        title_fa: editForm.titleFa,
        text: editForm.text,
        textFa: editForm.textFa,
        text_fa: editForm.textFa,
        icon: editForm.icon,
        gallery: editForm.gallery
      })
      setEditingId(null)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setEditBusy(false)
    }
  }

  return (
    <>
      <form className="card form" onSubmit={handleCreate} style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>{t('admin.addService')}</h3>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <label className="field">
            <span>{t('admin.name')}</span>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} dir="ltr" />
          </label>
          <label className="field">
            <span>{t('admin.nameFa')}</span>
            <input value={form.titleFa} onChange={e => setForm({ ...form, titleFa: e.target.value })} dir="rtl" />
          </label>
          <label className="field">
            <span>{t('admin.icon')}</span>
            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🌐" />
          </label>
          <div />
          <label className="field">
            <span>{t('admin.text')}</span>
            <textarea rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} dir="ltr" />
          </label>
          <label className="field">
            <span>{t('admin.textFa')}</span>
            <textarea rows={3} value={form.textFa} onChange={e => setForm({ ...form, textFa: e.target.value })} dir="rtl" />
          </label>
        </div>
        <MediaPicker value={form.gallery} onChange={next => setForm({ ...form, gallery: next })} />
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('admin.adding') : t('admin.create')}
        </button>
      </form>

      {editingId !== null ? (
        <div className="card form" style={{ marginBottom: 18, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Edit service #{editingId}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕ Cancel</button>
          </div>
          <div className="grid grid-2" style={{ gap: 14 }}>
            <label className="field">
              <span>{t('admin.name')}</span>
              <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} dir="ltr" />
            </label>
            <label className="field">
              <span>{t('admin.nameFa')}</span>
              <input value={editForm.titleFa} onChange={e => setEditForm({ ...editForm, titleFa: e.target.value })} dir="rtl" />
            </label>
            <label className="field">
              <span>{t('admin.icon')}</span>
              <input value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} />
            </label>
            <div />
            <label className="field">
              <span>{t('admin.text')}</span>
              <textarea rows={3} value={editForm.text} onChange={e => setEditForm({ ...editForm, text: e.target.value })} dir="ltr" />
            </label>
            <label className="field">
              <span>{t('admin.textFa')}</span>
              <textarea rows={3} value={editForm.textFa} onChange={e => setEditForm({ ...editForm, textFa: e.target.value })} dir="rtl" />
            </label>
          </div>
          <MediaPicker value={editForm.gallery} onChange={next => setEditForm({ ...editForm, gallery: next })} />
          {error ? <p className="form-error">{error}</p> : null}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-primary" disabled={editBusy} onClick={handleSaveEdit}>
              {editBusy ? t('admin.saving') : t('admin.save')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </div>
      ) : null}

      {services === null ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : services.length === 0 ? (
        <div className="card muted">{t('admin.noData')}</div>
      ) : (
        <div className="card table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('admin.name')}</th>
                <th>{t('admin.text')}</th>
                <th>Gallery</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {services.map(service => {
                const title = lang === 'fa' && service.titleFa ? service.titleFa : service.title
                const text = lang === 'fa' && service.textFa ? service.textFa : (service.text ?? '')
                const gallery = getItemGallery(service)
                return (
                  <tr key={service.id}>
                    <td>{service.icon ? `${service.icon} ` : ''}{title}</td>
                    <td className="muted">{text}</td>
                    <td>
                      {gallery.length ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {gallery.slice(0, 3).map(url => (
                            <img key={url} src={resolveImageUrl(url)} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} loading="lazy" />
                          ))}
                          {gallery.length > 3 ? <span className="muted">+{gallery.length - 3}</span> : null}
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'end', whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(service)} style={{ marginInlineEnd: 6 }}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(service.id)}>
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
