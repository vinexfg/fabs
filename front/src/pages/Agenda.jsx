import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Modal from '../components/Modal'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TYPES = ['Consulta','Limpeza/Profilaxia','Extração','Tratamento de Canal','Implante','Restauração','Prótese','Ortodontia','Avaliação','Retorno']

const STATUS_STYLE = {
  agendado:  'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  realizado: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  cancelado: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 line-through',
  faltou:    'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
}
const STATUS_DOT = {
  agendado:  'bg-blue-500',
  realizado: 'bg-emerald-500',
  cancelado: 'bg-red-400',
  faltou:    'bg-amber-400',
}
const STATUS_LABELS = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado', faltou: 'Faltou' }

function toISO(d) { return d.toISOString().split('T')[0] }
function today() { return toISO(new Date()) }
function fmtMonthKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month+1, 0)
  const days = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

const EMPTY_FORM = { patientId: '', date: today(), time: '09:00', duration: 60, type: 'Consulta', notes: '' }

export default function Agenda() {
  const [ref, setRef]           = useState(new Date())
  const [selected, setSelected] = useState(today())
  const [monthAppts, setMonthAppts] = useState([])
  const [dayAppts,   setDayAppts]   = useState([])
  const [patients,   setPatients]   = useState([])
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const loadMonth = useCallback(async (d) => {
    try { setMonthAppts(await api.appointments.byMonth(fmtMonthKey(d))) }
    catch { toast('Erro ao carregar agenda', 'error') }
  }, [])

  const loadDay = useCallback(async (date) => {
    try { setDayAppts(await api.appointments.byDate(date)) }
    catch {}
  }, [])

  useEffect(() => { api.patients.list().then(setPatients).catch(() => {}) }, [])
  useEffect(() => { loadMonth(ref) }, [ref])
  useEffect(() => { loadDay(selected) }, [selected])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.patientId || !form.date || !form.time) { toast('Preencha os campos obrigatórios.', 'error'); return }
    try {
      await api.appointments.create(form)
      toast('Consulta agendada!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadMonth(ref)
      loadDay(selected)
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleStatus(id, status) {
    try {
      await api.appointments.updateStatus(id, status)
      loadDay(selected)
      loadMonth(ref)
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleDelete(id) {
    if (!await confirm('Remover esta consulta?')) return
    try {
      await api.appointments.delete(id)
      loadDay(selected)
      loadMonth(ref)
    } catch (e) { toast(e.message, 'error') }
  }

  // Group month appointments by date
  const apptByDate = monthAppts.reduce((acc, a) => {
    acc[a.date] = acc[a.date] || []
    acc[a.date].push(a)
    return acc
  }, {})

  const calDays  = getCalendarDays(ref.getFullYear(), ref.getMonth())
  const todayStr = today()

  function prevMonth() { setRef(d => new Date(d.getFullYear(), d.getMonth()-1, 1)) }
  function nextMonth() { setRef(d => new Date(d.getFullYear(), d.getMonth()+1, 1)) }

  function openForm(date) {
    setForm({ ...EMPTY_FORM, date })
    setShowForm(true)
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gerencie as consultas do consultório</p>
        </div>
        <button className="btn-primary" onClick={() => openForm(selected)}>+ Nova Consulta</button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Calendar */}
        <div className="col-span-3 card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-secondary btn-sm">‹</button>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {MONTHS[ref.getMonth()]} {ref.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="btn-secondary btn-sm">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((day, i) => {
              if (!day) return <div key={`e${i}`} />
              const iso = toISO(day)
              const appts = apptByDate[iso] || []
              const isToday    = iso === todayStr
              const isSelected = iso === selected
              return (
                <div
                  key={iso}
                  onClick={() => setSelected(iso)}
                  className={`min-h-[72px] p-1.5 rounded-xl cursor-pointer transition-all duration-100
                    ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : isToday    ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30'
                    :              'hover:bg-slate-50 dark:hover:bg-slate-800'}
                  `}
                >
                  <p className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {day.getDate()}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {appts.slice(0,2).map(a => (
                      <div key={a.id} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate
                        ${isSelected ? 'bg-white/20 text-white' : STATUS_STYLE[a.status]}`}>
                        {a.time} {a.patientNome?.split(' ')[0]}
                      </div>
                    ))}
                    {appts.length > 2 && (
                      <div className={`text-[10px] font-semibold px-1.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                        +{appts.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day panel */}
        <div className="col-span-2 flex flex-col gap-3">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selected === todayStr ? 'Hoje' : formatSelectedDate(selected)}
                </p>
                <p className="text-xs text-slate-400">{dayAppts.length} consulta{dayAppts.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="btn-primary btn-sm" onClick={() => openForm(selected)}>+</button>
            </div>

            {dayAppts.length === 0
              ? <div className="text-center py-8 text-slate-400">
                  <div className="text-3xl mb-2 opacity-50">📅</div>
                  <p className="text-xs">Nenhuma consulta neste dia</p>
                </div>
              : <div className="flex flex-col gap-2">
                  {dayAppts.map(a => (
                    <DayAppointment
                      key={a.id}
                      appt={a}
                      onStatus={handleStatus}
                      onDelete={handleDelete}
                      onPatient={() => navigate(`/pacientes/${a.patientId}`)}
                    />
                  ))}
                </div>
            }
          </div>

          {/* Legend */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Legenda</p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(STATUS_LABELS).map(([k, l]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[k]}`} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New appointment modal */}
      {showForm && (
        <Modal title="Nova Consulta" onClose={() => setShowForm(false)} onSave={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Paciente *</label>
              <select className="input mt-1.5" value={form.patientId} onChange={set('patientId')}>
                <option value="">Selecionar paciente...</option>
                {patients.sort((a,b) => a.nome.localeCompare(b.nome)).map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data *</label>
              <input className="input mt-1.5" type="date" value={form.date} onChange={set('date')} />
            </div>
            <div>
              <label className="label">Hora *</label>
              <input className="input mt-1.5" type="time" value={form.time} onChange={set('time')} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input mt-1.5" value={form.type} onChange={set('type')}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duração (min)</label>
              <input className="input mt-1.5" type="number" min="15" step="15" value={form.duration} onChange={set('duration')} />
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <textarea className="input mt-1.5 resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Observações opcionais..." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function DayAppointment({ appt, onStatus, onDelete, onPatient }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{appt.time} — {appt.patientNome}</p>
          <p className="text-xs text-slate-400">{appt.type} · {appt.duration} min</p>
        </div>
        <button onClick={() => onDelete(appt.id)} className="btn-danger btn-sm">🗑️</button>
      </div>
      {appt.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{appt.notes}</p>}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => onPatient()} className="text-xs text-blue-500 hover:text-blue-600 font-semibold">Ver ficha →</button>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        {Object.entries(STATUS_LABELS).map(([k, l]) => (
          <button
            key={k}
            onClick={() => onStatus(appt.id, k)}
            className={`text-xs px-2 py-0.5 rounded-lg font-semibold transition-all
              ${appt.status === k ? STATUS_STYLE[k] + ' ring-1 ring-current' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatSelectedDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
