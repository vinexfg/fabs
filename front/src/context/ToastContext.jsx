import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: 'bg-emerald-600 text-white shadow-emerald-600/25',
  error:   'bg-red-600 text-white shadow-red-600/25',
  warning: 'bg-amber-500 text-white shadow-amber-500/25',
  default: 'bg-slate-900 dark:bg-slate-800 text-white shadow-black/25',
}
const ICONS = { success: '✓', error: '✕', warning: '⚠', default: 'i' }
const ICON_STYLES = {
  success: 'bg-white/20 text-white',
  error:   'bg-white/20 text-white',
  warning: 'bg-white/20 text-white',
  default: 'bg-white/15 text-white',
}
const DURATIONS = { warning: 8000 }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'default') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), DURATIONS[type] ?? 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl text-sm font-semibold
                        shadow-xl pointer-events-auto animate-slide-in max-w-xs
                        ${TOAST_STYLES[t.type] || TOAST_STYLES.default}`}
          >
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                              ${ICON_STYLES[t.type] || ICON_STYLES.default}`}>
              {ICONS[t.type]}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
