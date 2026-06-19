import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useToast } from './ToastContext'

interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  login: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('df_token'))
  const toast = useToast()
  const warnTimerRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const scheduleTimers = useCallback((t: string | null) => {
    clearTimeout(warnTimerRef.current)
    clearTimeout(logoutTimerRef.current)
    if (!t) return
    const exp = parseJwtExp(t)
    if (!exp) return
    const now = Date.now()

    const warnDelay = exp - 5 * 60 * 1000 - now
    if (warnDelay > 0) {
      warnTimerRef.current = setTimeout(() => {
        toast('Sua sessão expira em 5 minutos. Salve seu trabalho e faça login novamente.', 'warning')
      }, warnDelay)
    }

    const logoutDelay = exp - now
    if (logoutDelay > 0) {
      logoutTimerRef.current = setTimeout(() => {
        localStorage.removeItem('df_token')
        setToken(null)
        toast('Sessão expirada. Faça login novamente.', 'error')
      }, logoutDelay)
    } else {
      localStorage.removeItem('df_token')
      setToken(null)
    }
  }, [toast])

  useEffect(() => {
    scheduleTimers(token)
    return () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(logoutTimerRef.current)
    }
  }, [token, scheduleTimers])

  const login = useCallback(async (password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Senha incorreta')
    }
    const data = await res.json()
    localStorage.setItem('df_token', data.token)
    setToken(data.token)
  }, [])

  const logout = useCallback(() => {
    clearTimeout(warnTimerRef.current)
    clearTimeout(logoutTimerRef.current)
    localStorage.removeItem('df_token')
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
