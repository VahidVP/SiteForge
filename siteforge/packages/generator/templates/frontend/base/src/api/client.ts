import { site } from '../lib/site'

const TOKEN_KEY = 'auth_token'
const OWNER_KEY = 'owner_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getOwnerToken(): string | null {
  return localStorage.getItem(OWNER_KEY)
}

export function setOwnerToken(token: string | null): void {
  if (token) {
    localStorage.setItem(OWNER_KEY, token)
  } else {
    localStorage.removeItem(OWNER_KEY)
  }
}

function authHeader(): string | null {
  const owner = getOwnerToken()
  if (owner) return `Owner ${owner}`
  const token = getToken()
  if (!token) return null
  return `${site.authScheme} ${token}`
}

export interface PageContent {
  slug: string
  title: string
  content: string
}

export interface DetailRow {
  key: string
  keyFa?: string
  key_fa?: string
  value: string
  valueFa?: string
  value_fa?: string
}

export interface Product {
  id: number
  name: string
  nameFa?: string | null
  name_fa?: string | null
  description: string
  descriptionFa?: string | null
  description_fa?: string | null
  price: string | number
  imageUrl: string
  image_url?: string
  ImageUrl?: string
  gallery?: string[]
  Gallery?: string[]
  galleryJson?: string
  GalleryJson?: string
  featured: boolean
  details?: DetailRow[] | Record<string, string>
  Details?: DetailRow[] | Record<string, string>
  detailsJson?: string
  DetailsJson?: string
}

export function getProductGallery(product: Product): string[] {
  const raw = (product as unknown as Record<string, unknown>)
  const direct = (raw.gallery ?? raw.Gallery) as unknown
  if (Array.isArray(direct)) return direct as string[]
  const jsonStr = (raw.galleryJson ?? raw.GalleryJson ?? (raw as Record<string, unknown>).GalleryJson) as string | undefined
  if (typeof jsonStr === 'string' && jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) return parsed as string[]
    } catch { }
  }
  // Django serializer exposes gallery as array; .NET may expose Gallery
  // fallback to imageUrl chain handled elsewhere
  return []
}

function toDetailRow(value: unknown): DetailRow | null {
  if (!value || typeof value !== 'object') return null
  const r = value as Record<string, unknown>
  const row: DetailRow = {
    key: typeof r.key === 'string' ? r.key : typeof r.Key === 'string' ? r.Key : '',
    keyFa: typeof r.keyFa === 'string' ? r.keyFa : typeof r.key_fa === 'string' ? r.key_fa : '',
    value: typeof r.value === 'string' ? r.value : typeof r.Value === 'string' ? r.Value : '',
    valueFa: typeof r.valueFa === 'string' ? r.valueFa : typeof r.value_fa === 'string' ? r.value_fa : ''
  }
  return row.key || row.keyFa || row.value || row.valueFa ? row : null
}

function dictToRows(dict: Record<string, unknown>): DetailRow[] {
  return Object.entries(dict)
    .map(([k, v]) => toDetailRow({ key: k, value: String(v ?? '') }))
    .filter((r): r is DetailRow => r !== null)
}

function parsedToRows(parsed: unknown): DetailRow[] {
  if (Array.isArray(parsed)) {
    return parsed.map(toDetailRow).filter((r): r is DetailRow => r !== null)
  }
  if (parsed && typeof parsed === 'object') {
    return dictToRows(parsed as Record<string, unknown>)
  }
  return []
}

export function getProductDetails(product: Product): DetailRow[] {
  const raw = product as unknown as Record<string, unknown>
  const direct = raw.details ?? raw.Details
  if (Array.isArray(direct)) {
    return direct.map(toDetailRow).filter((r): r is DetailRow => r !== null)
  }
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return dictToRows(direct as Record<string, unknown>)
  }
  if (typeof direct === 'string' && direct) {
    try {
      return parsedToRows(JSON.parse(direct))
    } catch {}
  }
  const jsonStr = (raw.detailsJson ?? raw.DetailsJson ?? '') as string | undefined
  if (typeof jsonStr === 'string' && jsonStr) {
    try {
      return parsedToRows(JSON.parse(jsonStr))
    } catch {}
  }
  return []
}

export function getProductImageUrl(product: Product): string {
  const gallery = getProductGallery(product)
  if (gallery.length > 0 && gallery[0]) return gallery[0]
  const raw = product as unknown as Record<string, unknown>
  const candidate = (raw.imageUrl ?? raw.image_url ?? raw.ImageUrl ?? '') as string
  return candidate
}

export function resolveImageUrl(url: string): string {
  if (!url) return url
  // Keep absolute urls as-is; relative /media urls are proxied via vite to backend
  // If url starts with /media, proxy handles it; no need to prefix origin
  return url
}

export interface MeResponse {
  email: string
  isAdmin?: boolean
  is_staff?: boolean
}

export interface AuthResponse {
  token: string
  email: string
}

export interface AdminUser {
  id: number
  email: string
  isAdmin?: boolean
  is_staff?: boolean
}

export interface AdminMessage {
  id: number
  name: string
  email: string
  message: string
  createdAt?: string
  created_at?: string
}

export interface Order {
  id?: number
  code: string
  status: string
  totalAmount?: string | number
  total_amount?: string | number
  refId?: string | null
  ref_id?: string | null
  createdAt?: string
  created_at?: string
  itemsSnapshot?: string
  items_snapshot?: string
  userEmail?: string | null
  user_email?: string | null
}

export interface Ticket {
  id: number
  subject: string
  status: string
  createdAt?: string
  created_at?: string
  userEmail?: string
  user_email?: string
}

export interface TicketMessage {
  id: number
  sender: 'user' | 'admin'
  body: string
  createdAt?: string
  created_at?: string
}

export interface PaymentSettings {
  enabled: boolean
  sandbox: boolean
  merchantId: string | null
  merchant_id: string | null
}

export interface Project {
  id: number
  name: string
  nameFa?: string | null
  summary?: string
  summaryFa?: string | null
  description?: string
  descriptionFa?: string | null
  tags?: string[]
  Tags?: string[]
  gallery?: string[]
  Gallery?: string[]
  order?: number
}

export interface ServiceItem {
  id: number
  title: string
  titleFa?: string | null
  text?: string
  textFa?: string | null
  icon?: string
  gallery?: string[]
  Gallery?: string[]
  order?: number
}

export interface MediaFile {
  name: string
  url: string
}

export function getItemGallery(item: { gallery?: string[]; Gallery?: string[] }): string[] {
  const raw = item as unknown as Record<string, unknown>
  const direct = raw.gallery ?? raw.Gallery
  if (Array.isArray(direct)) return (direct as unknown[]).filter((u): u is string => typeof u === 'string' && u.length > 0)
  // Some backends/versions stash the list as a JSON string (galleryJson /
  // GalleryJson) — parse it instead of showing the "no image" fallback.
  if (typeof direct === 'string' && direct.trim()) {
    try {
      const parsed = JSON.parse(direct)
      if (Array.isArray(parsed)) return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0)
    } catch { /* fall through to the *Json fields */ }
  }
  const jsonStr = (raw.galleryJson ?? raw.GalleryJson ?? raw.gallery_json) as unknown
  if (typeof jsonStr === 'string' && jsonStr.trim()) {
    try {
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0)
    } catch { /* not JSON — no gallery */ }
  }
  return []
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, useAuth = true): Promise<T> {
  const headers: Record<string, string> = {}
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (options.body && !isFormData) headers['Content-Type'] = 'application/json'
  if (useAuth) {
    const header = authHeader()
    if (header) headers.Authorization = header
  }
  // merge existing headers from options if any (for FormData auth still works)
  const mergedHeaders = { ...headers, ...((options.headers as Record<string,string>) ?? {}) }

  const res = await fetch(path, { ...options, headers: mergedHeaders })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as Record<string, unknown>
      if (typeof data.detail === 'string') message = data.detail
      else if (typeof data.error === 'string') message = data.error
      else if (typeof data.message === 'string') message = data.message
    } catch {
      res.status
    }
    throw new ApiError(message, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function normalizeMe(data: MeResponse): { email: string; isAdmin: boolean } {
  return { email: data.email, isAdmin: Boolean(data.isAdmin ?? data.is_staff ?? false) }
}

export const api = {
  page: (slug: string) => request<PageContent>(`/api/pages/${slug}/`, {}, false),
  products: (lang?: string) =>
    request<Product[]>(lang ? `/api/products/?lang=${lang}/` : '/api/products/', {}, false),
  product: (id: number, lang?: string) =>
    request<Product>(`/api/products/${id}/` + (lang ? `?lang=${lang}` : ''), {}, false),
  getProduct: (id: number, lang?: string) =>
    request<Product>(`/api/products/${id}/` + (lang ? `?lang=${lang}` : ''), {}, false),
  updateProduct: (id: number, body: Record<string, unknown>) =>
    request<Product>(`/api/admin/products/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),
  sendContact: (body: { name: string; email: string; message: string }) =>
    request<{ ok: boolean }>('/api/contact/', { method: 'POST', body: JSON.stringify(body) }, false),
  register: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/register/', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }, false),
  me: async () => normalizeMe(await request<MeResponse>('/api/auth/me/')),
  logout: () => request<void>('/api/auth/logout/', { method: 'DELETE' }),

  ownerLogin: (code: string) =>
    request<{ token: string }>('/api/owner/login/', { method: 'POST', body: JSON.stringify({ code }) }, false),

  projects: () => request<Project[]>('/api/projects/', {}, false),
  project: (id: number) => request<Project>(`/api/projects/${id}/`, {}, false),
  services: () => request<ServiceItem[]>('/api/services/', {}, false),
  service: (id: number) => request<ServiceItem>(`/api/services/${id}/`, {}, false),

  paymentStatus: () => request<{ enabled: boolean; sandbox: boolean }>('/api/payments/status/', {}, false),
  checkout: (ids: number[]) =>
    request<{ mode: string; url: string }>('/api/checkout/', { method: 'POST', body: JSON.stringify({ items: ids }) }),
  myOrders: () => request<Order[]>('/api/orders/'),
  orderByCode: (code: string) => request<Order>(`/api/orders/${code}/`),

  createTicket: (subject: string, body: string) =>
    request<Ticket>('/api/support/tickets/', { method: 'POST', body: JSON.stringify({ subject, body }) }),
  myTickets: () => request<Ticket[]>('/api/support/tickets/'),
  ticketThread: (id: number) => request<TicketMessage[]>(`/api/support/tickets/${id}/`),
  replyTicket: (id: number, body: string) =>
    request<TicketMessage[]>(`/api/support/tickets/${id}/reply/`, { method: 'POST', body: JSON.stringify({ body }) }),

  admin: {
    users: () => request<AdminUser[]>('/api/admin/users/'),
    deleteUser: (id: number) => request<void>(`/api/admin/users/${id}/`, { method: 'DELETE' }),
    products: () => request<Product[]>('/api/admin/products/'),
    createProduct: (body: Omit<Product, 'id'> & { nameFa?: string; descriptionFa?: string; details?: DetailRow[] }) =>
      request<Product>('/api/admin/products/', { method: 'POST', body: JSON.stringify(body) }),
    updateProduct: (id: number, body: Record<string, unknown>) =>
      request<Product>(`/api/admin/products/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),
    getProduct: (id: number, lang?: string) =>
      request<Product>(`/api/products/${id}/` + (lang ? `?lang=${lang}` : ''), {}, false),
    deleteProduct: (id: number) => request<void>(`/api/admin/products/${id}/`, { method: 'DELETE' }),
    uploadProductImages: (id: number, files: FileList | File[]) => {
      const form = new FormData()
      const arr = files instanceof FileList ? Array.from(files) : files
      arr.slice(0, 6).forEach(f => form.append('images', f))
      return request<Product>(`/api/admin/products/${id}/images/`, { method: 'POST', body: form })
    },
    deleteProductImage: (id: number, path: string) =>
      request<Product>(`/api/admin/products/${id}/images/?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
    messages: () => request<AdminMessage[]>('/api/admin/messages/'),
    orders: () => request<Order[]>('/api/admin/orders/'),
    tickets: () => request<Ticket[]>('/api/admin/tickets/'),
    ticketThread: (id: number) => request<TicketMessage[]>(`/api/admin/tickets/${id}/`),
    replyTicket: (id: number, body: string) =>
      request<void>(`/api/admin/tickets/${id}/reply/`, { method: 'POST', body: JSON.stringify({ body }) }),
    closeTicket: (id: number) => request<void>(`/api/admin/tickets/${id}/close/`, { method: 'POST' }),
    paymentSettings: () => request<PaymentSettings>('/api/admin/settings/payment/'),
    savePaymentSettings: (body: { enabled: boolean; sandbox: boolean; merchantId: string }) =>
      request<PaymentSettings>('/api/admin/settings/payment/', { method: 'PUT', body: JSON.stringify(body) }),
    projects: () => request<Project[]>('/api/admin/projects/'),
    createProject: (body: Record<string, unknown>) =>
      request<Project>('/api/admin/projects/', { method: 'POST', body: JSON.stringify(body) }),
    updateProject: (id: number, body: Record<string, unknown>) =>
      request<Project>(`/api/admin/projects/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteProject: (id: number) => request<void>(`/api/admin/projects/${id}/`, { method: 'DELETE' }),
    services: () => request<ServiceItem[]>('/api/admin/services/'),
    createService: (body: Record<string, unknown>) =>
      request<ServiceItem>('/api/admin/services/', { method: 'POST', body: JSON.stringify(body) }),
    updateService: (id: number, body: Record<string, unknown>) =>
      request<ServiceItem>(`/api/admin/services/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteService: (id: number) => request<void>(`/api/admin/services/${id}/`, { method: 'DELETE' })
  },
  media: {
    // Admin-only endpoints: the owner/auth token must always be sent.
    list: () => request<MediaFile[]>('/api/admin/media/'),
    upload: (files: FileList | File[]) => {
      const form = new FormData()
      const arr = files instanceof FileList ? Array.from(files) : files
      arr.slice(0, 8).forEach(f => form.append('images', f))
      return request<{ url: string }[]>('/api/admin/media/', { method: 'POST', body: form })
    }
  }
}
