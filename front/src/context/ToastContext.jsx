import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

const icons = { success: '✅', error: '❌', default: 'ℹ️' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'default') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl pointer-events-auto animate-slide-in
              ${t.type === 'error'   ? 'bg-red-600 text-white shadow-red-600/30'
              : t.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              :                        'bg-slate-900 dark:bg-slate-700 text-white shadow-black/30'}`}
          >
            <span>{icons[t.type]}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
