import React, { createContext, useContext, useState, useRef } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolveRef = useRef(null)

  function confirm(message) {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setState({ message })
    })
  }

  function handleChoice(result) {
    setState(null)
    resolveRef.current?.(result)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 animate-fade-up">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-6 whitespace-pre-line">{state.message}</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => handleChoice(false)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleChoice(true)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() { return useContext(ConfirmContext) }
