import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

function parseJwtExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('df_token'))
  const toast = useToast()
  const timerRef = useRef(null)

  const scheduleWarning = useCallback((t) => {
    clearTimeout(timerRef.current)
    if (!t) return
    const exp = parseJwtExp(t)
    if (!exp) return
    const warnAt = exp - 5 * 60 * 1000
    const delay = warnAt - Date.now()
    if (delay > 0) {
      timerRef.current = setTimeout(() => {
        toast('Sua sessão expira em 5 minutos. Salve seu trabalho e faça login novamente.', 'warning')
      }, delay)
    }
  }, [toast])

  useEffect(() => {
    scheduleWarning(token)
    return () => clearTimeout(timerRef.current)
  }, [token, scheduleWarning])

  const login = useCallback(async (password) => {
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
    clearTimeout(timerRef.current)
    localStorage.removeItem('df_token')
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
