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
  const warnTimerRef   = useRef(null)
  const logoutTimerRef = useRef(null)

  const scheduleTimers = useCallback((t) => {
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

export function useAuth() { return useContext(AuthContext) }
