import React, { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext()

export function GlobalSearchProvider({ children }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e) {
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

export const useGlobalSearch = () => useContext(Ctx)
