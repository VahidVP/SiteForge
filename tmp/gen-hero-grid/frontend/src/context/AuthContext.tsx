import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../api/client'

interface AuthState {
  email: string | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthState>({
  email: null,
  isAdmin: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then(data => {
        setEmail(data.email)
        setIsAdmin(data.isAdmin)
      })
      .catch(() => setToken(null))
  }, [])

  function applySession(token: string, userEmail: string, admin = false) {
    setToken(token)
    setEmail(userEmail)
    setIsAdmin(admin)
  }

  const value = useMemo<AuthState>(
    () => ({
      email,
      isAdmin,
      async signIn(userEmail, password) {
        const res = await api.login(userEmail, password)
        applySession(res.token, res.email)
        try {
          const meData = await api.me()
          setEmail(meData.email)
          setIsAdmin(meData.isAdmin)
        } catch {}
      },
      async signUp(userEmail, password) {
        const res = await api.register(userEmail, password)
        applySession(res.token, res.email)
        try {
          const meData = await api.me()
          setEmail(meData.email)
          setIsAdmin(meData.isAdmin)
        } catch {}
      },
      signOut() {
        try {
          api.logout().catch(() => {})
        } catch {
          // token already gone server-side
        }
        setToken(null)
        setEmail(null)
        setIsAdmin(false)
        window.setTimeout(() => {
          window.location.assign('/')
        }, 0)
      }
    }),
    [email, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
