import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'default'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastOptions {
  action?: ToastAction
}

interface ToastItem {
  id: number
  msg: string
  type: ToastType
  action: ToastAction | null
}

type ToastFn = (msg: string, type?: ToastType, opts?: ToastOptions) => void

const ToastContext = createContext<ToastFn | undefined>(undefined)

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white shadow-emerald-600/25',
  error:   'bg-red-600 text-white shadow-red-600/25',
  warning: 'bg-amber-500 text-white shadow-amber-500/25',
  default: 'bg-slate-900 dark:bg-slate-800 text-white shadow-black/25',
}
const ICONS: Record<ToastType, string> = { success: '✓', error: '✕', warning: '⚠', default: 'i' }
const ICON_STYLES: Record<ToastType, string> = {
  success: 'bg-white/20 text-white',
  error:   'bg-white/20 text-white',
  warning: 'bg-white/20 text-white',
  default: 'bg-white/15 text-white',
}
const ACTION_STYLES: Record<ToastType, string> = {
  success: 'text-white/80 hover:text-white border-white/30 hover:border-white/60',
  error:   'text-white/80 hover:text-white border-white/30 hover:border-white/60',
  warning: 'text-white/80 hover:text-white border-white/30 hover:border-white/60',
  default: 'text-white/70 hover:text-white border-white/20 hover:border-white/50',
}
const DURATIONS: Partial<Record<ToastType, number>> = { warning: 8000 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const toast = useCallback<ToastFn>((msg, type = 'default', opts = {}) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type, action: opts.action ?? null }])
    setTimeout(() => dismiss(id), DURATIONS[type] ?? 3500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-xs w-full sm:w-auto">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl text-sm font-semibold
                        shadow-xl pointer-events-auto animate-slide-in
                        ${TOAST_STYLES[t.type] || TOAST_STYLES.default}`}
          >
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                              ${ICON_STYLES[t.type] || ICON_STYLES.default}`}>
              {ICONS[t.type]}
            </span>
            <span className="flex-1">{t.msg}</span>
            {t.action && (
              <button
                onClick={() => { t.action?.onClick(); dismiss(t.id) }}
                className={`text-xs font-bold border rounded-lg px-2.5 py-1 shrink-0 transition-all
                            ${ACTION_STYLES[t.type] || ACTION_STYLES.default}`}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
