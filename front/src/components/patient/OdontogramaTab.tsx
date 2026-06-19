import { useEffect, useState, useRef } from 'react'
import { OdontogramaRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import styles from './OdontogramaTab.module.css'

const UPPER = [[18,17,16,15,14,13,12,11], [21,22,23,24,25,26,27,28]]
const LOWER = [[48,47,46,45,44,43,42,41], [31,32,33,34,35,36,37,38]]

interface ToothStatusDef {
  id: string
  label: string
  bg: string
  text: string
  icon: string
}

const STATUSES: ToothStatusDef[] = [
  { id: 'saudavel',   label: 'Saudável',                  bg: 'bg-slate-100 dark:bg-slate-700',              text: 'text-slate-500 dark:text-slate-300', icon: '✓' },
  { id: 'carie',      label: 'Cárie',                     bg: 'bg-red-100 dark:bg-red-900/50',               text: 'text-red-700 dark:text-red-300',     icon: '●' },
  { id: 'restaurado', label: 'Restaurado',                bg: 'bg-blue-100 dark:bg-blue-900/50',             text: 'text-blue-700 dark:text-blue-300',   icon: '◆' },
  { id: 'canal',      label: 'Canal',                     bg: 'bg-purple-100 dark:bg-purple-900/50',         text: 'text-purple-700 dark:text-purple-300',icon: '✚' },
  { id: 'coroa',      label: 'Coroa',                     bg: 'bg-amber-100 dark:bg-amber-900/50',           text: 'text-amber-700 dark:text-amber-300', icon: '♛' },
  { id: 'implante',   label: 'Implante',                  bg: 'bg-emerald-100 dark:bg-emerald-900/50',       text: 'text-emerald-700 dark:text-emerald-300',icon: '⬡' },
  { id: 'extraido',   label: 'Extraído',                  bg: 'bg-slate-300 dark:bg-slate-600',              text: 'text-slate-600 dark:text-slate-200', icon: '✕' },
  { id: 'ausente',    label: 'Ausente / Não erupcionado', bg: 'bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600', text: 'text-slate-300 dark:text-slate-600', icon: '○' },
]

const getStatus = (id: string) => STATUSES.find(s => s.id === id) || STATUSES[0]

interface ToothEntry {
  status: string
  notes: string | null
}

export default function OdontogramaTab({ patientId }: { patientId: string }) {
  const [data, setData] = useState<Record<string, ToothEntry>>({})
  const [popup, setPopup] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => { load() }, [patientId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setPopup(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function load() {
    try {
      const toothRecords = await OdontogramaRepository.findByPatient(patientId)
      const toothMap: Record<string, ToothEntry> = {}
      toothRecords.forEach((record) => { toothMap[record.tooth] = { status: record.status, notes: record.notes } })
      setData(toothMap)
    } catch { toast('Erro ao carregar odontograma', 'error') }
  }

  async function setToothStatus(tooth: number, status: string) {
    const toothStr = String(tooth)
    setSaving(toothStr)
    try {
      await OdontogramaRepository.update(patientId, { tooth: toothStr, status })
      setData(current => ({ ...current, [toothStr]: { ...current[toothStr], status } }))
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
    finally { setSaving(null); setPopup(null) }
  }

  function Tooth({ number }: { number: number }) {
    const t = String(number)
    const entry = data[t]
    const status = getStatus(entry?.status || 'saudavel')
    const isOpen = popup === t
    const isSaving = saving === t

    return (
      <div className={styles.toothWrapper}>
        <button
          onClick={() => setPopup(isOpen ? null : t)}
          className={`${styles.toothBtn} ${status.bg} ${isOpen ? styles.toothBtnOpen : ''}`}
          title={`Dente ${t} — ${status.label}`}
        >
          <span className={`${styles.toothIcon} ${status.text} ${isSaving ? 'animate-pulse' : ''}`}>
            {status.icon}
          </span>
          <span className={styles.toothNum}>{t}</span>
        </button>

        {isOpen && (
          <div ref={popupRef} className={styles.popup}>
            <p className={styles.popupTitle}>Dente {t}</p>
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => setToothStatus(number, s.id)}
                className={`${styles.popupItem} ${entry?.status === s.id ? styles.popupItemActive : styles.popupItemInactive}`}
              >
                <span className={`${styles.popupItemIcon} ${s.bg} ${s.text}`}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const counts = Object.values(data).reduce<Record<string, number>>((acc, v) => {
    if (v.status && v.status !== 'saudavel') acc[v.status] = (acc[v.status] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {Object.keys(counts).length > 0 && (
        <div className={styles.summary}>
          {STATUSES.filter(s => counts[s.id]).map(s => (
            <div key={s.id} className={styles.summaryItem}>
              <span className={`${styles.summaryIcon} ${s.bg} ${s.text}`}>{s.icon}</span>
              <span className={styles.summaryText}>
                {s.label}: <span className="text-slate-900 dark:text-slate-200">{counts[s.id]}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.toothMap}>
        <p className={styles.archLabelTop}>Superior</p>

        <div className={styles.arch}>
          {UPPER[0].map(n => <Tooth key={n} number={n} />)}
          <div className={styles.archSeparator} />
          {UPPER[1].map(n => <Tooth key={n} number={n} />)}
        </div>

        <div className={styles.archDivider} />

        <div className={styles.arch}>
          {LOWER[0].map(n => <Tooth key={n} number={n} />)}
          <div className={styles.archSeparator} />
          {LOWER[1].map(n => <Tooth key={n} number={n} />)}
        </div>

        <p className={styles.archLabelBottom}>Inferior</p>
        <p className={styles.toothHint}>Clique em um dente para alterar o status</p>
      </div>

      <div className={styles.fullLegend}>
        <p className={styles.fullLegendTitle}>Legenda</p>
        <div className={styles.fullLegendGrid}>
          {STATUSES.map(s => (
            <div key={s.id} className={styles.fullLegendItem}>
              <span className={`${styles.fullLegendIcon} ${s.bg} ${s.text}`}>{s.icon}</span>
              <span className={styles.fullLegendLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
