import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/auth'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User, rememberMe?: boolean) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'kaamlytwo_token'
const USER_KEY = 'kaamlytwo_user'

// Read token from either storage (localStorage = remember me, sessionStorage = session only)
function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

function readUser(): User | null {
  const s = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  return s ? JSON.parse(s) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken)
  const [user, setUser] = useState<User | null>(readUser)

  const isAuthenticated = token !== null && user !== null

  const login = (newToken: string, newUser: User, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage
    // Clear both storages first to avoid stale data
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY)
    storage.setItem(TOKEN_KEY, newToken)
    storage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) { setToken(null); setUser(null) }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Sync user state when profile is updated elsewhere (e.g. CustomerSearchPage quick setup)
  useEffect(() => {
    const stored = readUser()
    if (stored && JSON.stringify(stored) !== JSON.stringify(user)) {
      setUser(stored)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
