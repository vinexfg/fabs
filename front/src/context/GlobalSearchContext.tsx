import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode, Dispatch, SetStateAction } from 'react'

interface GlobalSearchContextValue {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

const Ctx = createContext<GlobalSearchContextValue | undefined>(undefined)

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlobalSearch() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGlobalSearch deve ser usado dentro de GlobalSearchProvider')
  return ctx
}
