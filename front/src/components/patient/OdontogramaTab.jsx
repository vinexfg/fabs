import React, { useEffect, useState, useRef } from 'react'
import { OdontogramaRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'

// FDI layout: upper right → upper left / lower right → lower left
const UPPER = [[18,17,16,15,14,13,12,11], [21,22,23,24,25,26,27,28]]
const LOWER = [[48,47,46,45,44,43,42,41], [31,32,33,34,35,36,37,38]]

const STATUSES = [
  { id: 'saudavel',  label: 'Saudável',           bg: 'bg-slate-100 dark:bg-slate-700',              text: 'text-slate-500 dark:text-slate-300', icon: '✓' },
  { id: 'carie',     label: 'Cárie',               bg: 'bg-red-100 dark:bg-red-900/50',               text: 'text-red-700 dark:text-red-300',     icon: '●' },
  { id: 'restaurado',label: 'Restaurado',          bg: 'bg-blue-100 dark:bg-blue-900/50',             text: 'text-blue-700 dark:text-blue-300',   icon: '◆' },
  { id: 'canal',     label: 'Canal',               bg: 'bg-purple-100 dark:bg-purple-900/50',         text: 'text-purple-700 dark:text-purple-300',icon: '✚' },
  { id: 'coroa',     label: 'Coroa',               bg: 'bg-amber-100 dark:bg-amber-900/50',           text: 'text-amber-700 dark:text-amber-300', icon: '♛' },
  { id: 'implante',  label: 'Implante',            bg: 'bg-emerald-100 dark:bg-emerald-900/50',       text: 'text-emerald-700 dark:text-emerald-300',icon: '⬡' },
  { id: 'extraido',  label: 'Extraído',            bg: 'bg-slate-300 dark:bg-slate-600',              text: 'text-slate-600 dark:text-slate-200', icon: '✕' },
  { id: 'ausente',   label: 'Ausente / Não erupcionado', bg: 'bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600', text: 'text-slate-300 dark:text-slate-600', icon: '○' },
]

const getStatus = (id) => STATUSES.find(s => s.id === id) || STATUSES[0]

export default function OdontogramaTab({ patientId }) {
  const [data, setData]       = useState({}) // { "11": { status, notes } }
  const [popup, setPopup]     = useState(null) // tooth number with open popup
  const [saving, setSaving]   = useState(null)
  const popupRef              = useRef(null)
  const toast = useToast()

  useEffect(() => { load() }, [patientId])

  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setPopup(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function load() {
    try {
      const toothRecords = await OdontogramaRepository.findByPatient(patientId)
      const toothMap = {}
      toothRecords.forEach(record => { toothMap[record.tooth] = { status: record.status, notes: record.notes } })
      setData(toothMap)
    } catch { toast('Erro ao carregar odontograma', 'error') }
  }

  async function setToothStatus(tooth, status) {
    const toothStr = String(tooth)
    setSaving(toothStr)
    try {
      await OdontogramaRepository.update(patientId, { tooth: toothStr, status })
      setData(current => ({ ...current, [toothStr]: { ...current[toothStr], status } }))
    } catch (error) { toast(error.message, 'error') }
    finally { setSaving(null); setPopup(null) }
  }

  function Tooth({ number }) {
    const t = String(number)
    const entry  = data[t]
    const status = getStatus(entry?.status || 'saudavel')
    const isOpen = popup === t
    const isSaving = saving === t

    return (
      <div className="relative">
        <button
          onClick={() => setPopup(isOpen ? null : t)}
          className={`w-10 h-12 rounded-lg flex flex-col items-center justify-between p-1 transition-all duration-100
            hover:scale-105 hover:shadow-md active:scale-95 border border-transparent
            hover:border-slate-300 dark:hover:border-slate-500
            ${status.bg} ${isOpen ? 'ring-2 ring-blue-400 scale-105' : ''}`}
          title={`Dente ${t} — ${status.label}`}
        >
          <span className={`text-base leading-none font-bold ${status.text} ${isSaving ? 'animate-pulse' : ''}`}>
            {status.icon}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none">{t}</span>
        </button>

        {isOpen && (
          <div
            ref={popupRef}
            className="absolute z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 w-44 top-full mt-1 left-1/2 -translate-x-1/2 animate-fade-up"
          >
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1 mb-1.5 uppercase tracking-wide">Dente {t}</p>
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => setToothStatus(number, s.id)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${entry?.status === s.id
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${s.bg} ${s.text}`}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const counts = Object.values(data).reduce((acc, v) => {
    if (v.status && v.status !== 'saudavel') acc[v.status] = (acc[v.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Legend summary */}
      {Object.keys(counts).length > 0 && (
        <div className="card p-4 mb-4 flex flex-wrap gap-3">
          {STATUSES.filter(s => counts[s.id]).map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${s.bg} ${s.text}`}>{s.icon}</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{s.label}: <span className="text-slate-900 dark:text-slate-200">{counts[s.id]}</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Tooth map */}
      <div className="card p-5 overflow-x-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-4">Superior</p>

        {/* Upper arch */}
        <div className="flex justify-center gap-1 mb-1">
          {UPPER[0].map(n => <Tooth key={n} number={n} />)}
          <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          {UPPER[1].map(n => <Tooth key={n} number={n} />)}
        </div>

        <div className="border-t-2 border-slate-300 dark:border-slate-600 mx-4 my-3" />

        {/* Lower arch */}
        <div className="flex justify-center gap-1 mt-1">
          {LOWER[0].map(n => <Tooth key={n} number={n} />)}
          <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          {LOWER[1].map(n => <Tooth key={n} number={n} />)}
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mt-4">Inferior</p>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">Clique em um dente para alterar o status</p>
      </div>

      {/* Full legend */}
      <div className="card p-4 mt-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Legenda</p>
        <div className="grid grid-cols-4 gap-2">
          {STATUSES.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${s.bg} ${s.text} shrink-0`}>{s.icon}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
