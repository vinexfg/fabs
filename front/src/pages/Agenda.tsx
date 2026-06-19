import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppointmentRepository, PatientRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Modal from '../components/Modal'
import type { Appointment, Patient } from '../types/entities'
import styles from './Agenda.module.css'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const TYPES  = ['Consulta','Limpeza/Profilaxia','Extração','Tratamento de Canal','Implante','Restauração','Prótese','Ortodontia','Avaliação','Retorno']

const STATUS_LABELS: Record<string, string> = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado', faltou: 'Faltou' }

const STATUS_CHIP: Record<string, string> = {
  agendado:  styles.calChipAgendado,
  realizado: styles.calChipRealizado,
  cancelado: styles.calChipCancelado,
  faltou:    styles.calChipFaltou,
}

const STATUS_DOT_COLOR: Record<string, string> = {
  agendado:  'bg-blue-500',
  realizado: 'bg-emerald-500',
  cancelado: 'bg-red-400',
  faltou:    'bg-amber-400',
}

const STATUS_BTN_ACTIVE: Record<string, string> = {
  agendado:  styles.statusAgendado,
  realizado: styles.statusRealizado,
  cancelado: styles.statusCancelado,
  faltou:    styles.statusFaltou,
}

function toISO(d: Date) { return d.toISOString().split('T')[0] }
function today() { return toISO(new Date()) }
function fmtMonthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month+1, 0)
  const days: (Date | null)[]  = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

// Returns Monday of the week that contains `dateStr`
function getWeekStart(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return toISO(d)
}

function getWeekDays(weekStartISO: string) {
  const start = new Date(weekStartISO + 'T12:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

interface AppointmentForm {
  patientId: string
  date: string
  time: string
  duration: number | string
  type: string
  notes: string
}

const EMPTY_FORM: AppointmentForm = { patientId: '', date: today(), time: '09:00', duration: 60, type: 'Consulta', notes: '' }

export default function Agenda() {
  const [ref, setRef]             = useState(new Date())
  const [selected, setSelected]   = useState(today())
  const [monthAppts, setMonthAppts] = useState<Appointment[]>([])
  const [dayAppts, setDayAppts]   = useState<Appointment[]>([])
  const [weekAppts, setWeekAppts] = useState<Appointment[]>([])
  const [patients, setPatients]   = useState<Patient[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState<AppointmentForm>(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType]     = useState('')
  const [mobileView, setMobileView]     = useState<'list' | 'calendar'>('list')
  const [calView, setCalView]           = useState<'month' | 'week'>('month')
  const navigate = useNavigate()
  const toast    = useToast()
  const confirm  = useConfirm()

  const loadMonth = useCallback(async (d: Date) => {
    try { setMonthAppts(await AppointmentRepository.findByMonth(fmtMonthKey(d))) }
    catch { toast('Erro ao carregar agenda', 'error') }
  }, [toast])

  const loadDay = useCallback(async (date: string) => {
    try { setDayAppts(await AppointmentRepository.findByDate(date)) }
    catch { toast('Erro ao carregar agenda', 'error') }
  }, [toast])

  const loadWeek = useCallback(async (date: string) => {
    try { setWeekAppts(await AppointmentRepository.findByWeek(getWeekStart(date))) }
    catch { toast('Erro ao carregar agenda', 'error') }
  }, [toast])

  useEffect(() => { PatientRepository.findAll().then(setPatients).catch(() => {}) }, [])
  useEffect(() => { loadMonth(ref) }, [ref, loadMonth])
  useEffect(() => { loadDay(selected) }, [selected, loadDay])
  useEffect(() => { if (calView === 'week') loadWeek(selected) }, [selected, calView, loadWeek])

  const set = (k: keyof AppointmentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function prevMonth() { setRef(d => new Date(d.getFullYear(), d.getMonth()-1, 1)) }
  function nextMonth() { setRef(d => new Date(d.getFullYear(), d.getMonth()+1, 1)) }

  function prevWeek() {
    const ws = getWeekStart(selected)
    const d  = new Date(ws + 'T12:00:00')
    d.setDate(d.getDate() - 7)
    const newSel = toISO(d)
    setSelected(newSel)
    setRef(new Date(d.getFullYear(), d.getMonth(), 1))
  }
  function nextWeek() {
    const ws = getWeekStart(selected)
    const d  = new Date(ws + 'T12:00:00')
    d.setDate(d.getDate() + 7)
    const newSel = toISO(d)
    setSelected(newSel)
    setRef(new Date(d.getFullYear(), d.getMonth(), 1))
  }
  function openForm(date: string) { setForm({ ...EMPTY_FORM, date }); setShowForm(true) }

  async function handleSave() {
    if (!form.patientId || !form.date || !form.time) { toast('Preencha os campos obrigatórios.', 'error'); return }

    const dayList = await AppointmentRepository.findByDate(form.date).catch(() => [])
    const conflicts = findConflicts(form, dayList)
    if (conflicts.length > 0) {
      const names = conflicts.map(a => `${a.time?.slice(0,5)} — ${a.patientNome}`).join('\n')
      const ok = await confirm(`Conflito de horário detectado:\n\n${names}\n\nDeseja agendar mesmo assim?`)
      if (!ok) return
    }

    try {
      await AppointmentRepository.create({ ...form, duration: Number(form.duration) || 60 })
      toast('Consulta agendada!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadMonth(ref)
      loadDay(selected)
      if (calView === 'week') loadWeek(selected)
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleStatus(appointmentId: string, status: string) {
    try {
      await AppointmentRepository.updateStatus(appointmentId, status)
      loadDay(selected)
      loadMonth(ref)
      if (calView === 'week') loadWeek(selected)
    }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleDelete(appointmentId: string) {
    if (!await confirm('Remover esta consulta?')) return
    try {
      await AppointmentRepository.remove(appointmentId)
      loadDay(selected)
      loadMonth(ref)
      if (calView === 'week') loadWeek(selected)
    }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  const visibleAppts = dayAppts.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false
    if (filterType   && a.type   !== filterType)   return false
    return true
  })

  const apptByDate = monthAppts.reduce<Record<string, Appointment[]>>((acc, a) => {
    acc[a.date] = acc[a.date] || []
    acc[a.date].push(a)
    return acc
  }, {})

  const calDays  = getCalendarDays(ref.getFullYear(), ref.getMonth())
  const todayStr = today()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Agenda</h1>
          <p className={styles.subtitle}>Gerencie as consultas do consultório</p>
        </div>
        <button className="btn-primary" onClick={() => openForm(selected)}>+ Nova Consulta</button>
      </div>

      <div className={styles.mobileToggle}>
        <button
          onClick={() => setMobileView('list')}
          className={mobileView === 'list' ? styles.mobileToggleActive : styles.mobileToggleBtn}
        >📋 Lista</button>
        <button
          onClick={() => setMobileView('calendar')}
          className={mobileView === 'calendar' ? styles.mobileToggleActive : styles.mobileToggleBtn}
        >📅 Calendário</button>
      </div>

      <div className={styles.calViewToggle}>
        <button
          onClick={() => setCalView('month')}
          className={calView === 'month' ? styles.calViewActive : styles.calViewBtn}
        >Mês</button>
        <button
          onClick={() => { setCalView('week'); loadWeek(selected) }}
          className={calView === 'week' ? styles.calViewActive : styles.calViewBtn}
        >Semana</button>
      </div>

      <div className={styles.layout}>
        <div className={`${styles.calCard} ${mobileView === 'list' ? styles.calCardMobileHidden : ''}`}>
          {calView === 'week' ? (
            <>
              <div className={styles.calNav}>
                <button className="btn-secondary btn-sm" onClick={prevWeek}>‹</button>
                <h2 className={styles.calMonth}>
                  {(() => {
                    const ws = getWeekStart(selected)
                    const we = new Date(ws + 'T12:00:00')
                    we.setDate(we.getDate() + 6)
                    return `${formatSelectedDate(ws)} – ${formatSelectedDate(toISO(we))}`
                  })()}
                </h2>
                <button className="btn-secondary btn-sm" onClick={nextWeek}>›</button>
              </div>
              <WeekView
                weekStart={getWeekStart(selected)}
                appts={weekAppts}
                selected={selected}
                todayStr={todayStr}
                onSelectDay={setSelected}
                onOpenForm={openForm}
                STATUS_CHIP={STATUS_CHIP}
              />
            </>
          ) : (
            <>
              <div className={styles.calNav}>
                <button className="btn-secondary btn-sm" onClick={prevMonth}>‹</button>
                <h2 className={styles.calMonth}>{MONTHS[ref.getMonth()]} {ref.getFullYear()}</h2>
                <button className="btn-secondary btn-sm" onClick={nextMonth}>›</button>
              </div>

              <div className={styles.calDayHeaders}>
                {DAYS.map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}
              </div>

              <div className={styles.calGrid}>
                {calDays.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />
                  const iso       = toISO(day)
                  const appts     = apptByDate[iso] || []
                  const isToday   = iso === todayStr
                  const isSelected = iso === selected
                  return (
                    <div
                      key={iso}
                      onClick={() => setSelected(iso)}
                      className={`${styles.calDay} ${isSelected ? styles.calDaySelected : isToday ? styles.calDayToday : styles.calDayDefault}`}
                    >
                      <p className={`${styles.calDayNum} ${isSelected ? styles.calDayNumSelected : isToday ? styles.calDayNumToday : styles.calDayNumDefault}`}>
                        {day.getDate()}
                      </p>
                      <div className={styles.calDayAppts}>
                        {appts.slice(0,2).map(a => (
                          <div key={a.id} className={`${styles.calChip} ${isSelected ? styles.calChipSelected : STATUS_CHIP[a.status]}`}>
                            {a.time} {a.patientNome?.split(' ')[0]}
                          </div>
                        ))}
                        {appts.length > 2 && (
                          <div className={`${styles.calMore} ${isSelected ? styles.calMoreSelected : styles.calMoreDefault}`}>
                            +{appts.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className={styles.dayPanel}>
          <div className={styles.dayCard}>
            <div className={styles.dayCardHeader}>
              <div>
                <p className={styles.dayCardTitle}>
                  {selected === todayStr ? 'Hoje' : formatSelectedDate(selected)}
                </p>
                <p className={styles.dayCardCount}>{dayAppts.length} consulta{dayAppts.length !== 1 ? 's' : ''}</p>
              </div>
              <button className="btn-primary btn-sm" onClick={() => openForm(selected)}>+</button>
            </div>

            <div className={styles.filterRow}>
              <select
                className={styles.filterSelect}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {(filterStatus || filterType) && (
                <button
                  className={styles.filterClear}
                  onClick={() => { setFilterStatus(''); setFilterType('') }}
                >✕</button>
              )}
            </div>

            {visibleAppts.length === 0
              ? <div className={styles.dayEmpty}>
                  <div className={styles.dayEmptyIcon}>📅</div>
                  <p className={styles.dayEmptyText}>
                    {dayAppts.length === 0 ? 'Nenhuma consulta neste dia' : 'Nenhuma consulta com esses filtros'}
                  </p>
                </div>
              : <div className={styles.dayList}>
                  {visibleAppts.map(a => (
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

          <div className={styles.legendCard}>
            <p className={styles.legendTitle}>Legenda</p>
            <div className={styles.legendList}>
              {Object.entries(STATUS_LABELS).map(([k, l]) => (
                <div key={k} className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${STATUS_DOT_COLOR[k]}`} />
                  <span className={styles.legendLabel}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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

const WEEK_DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface WeekViewProps {
  weekStart: string
  appts: Appointment[]
  selected: string
  todayStr: string
  onSelectDay: (iso: string) => void
  onOpenForm: (iso: string) => void
  STATUS_CHIP: Record<string, string>
}

function WeekView({ weekStart, appts, selected, todayStr, onSelectDay, onOpenForm, STATUS_CHIP }: WeekViewProps) {
  const days = getWeekDays(weekStart)
  const byDate = appts.reduce<Record<string, Appointment[]>>((acc, a) => {
    acc[a.date] = acc[a.date] || []
    acc[a.date].push(a)
    return acc
  }, {})

  return (
    <div className={styles.weekGrid}>
      {days.map((day, i) => {
        const iso = toISO(day)
        const dayAppts = byDate[iso] || []
        const isToday    = iso === todayStr
        const isSelected = iso === selected
        return (
          <div
            key={iso}
            className={`${styles.weekCol} ${isSelected ? styles.weekColSelected : isToday ? styles.weekColToday : styles.weekColDefault}`}
            onClick={() => onSelectDay(iso)}
          >
            <div className={styles.weekColHeader}>
              <p className={`${styles.weekDayName} ${isSelected ? styles.weekDayNameSelected : ''}`}>{WEEK_DAYS_SHORT[i]}</p>
              <p className={`${styles.weekDayNum} ${isSelected ? styles.weekDayNumSelected : isToday ? styles.weekDayNumToday : styles.weekDayNumDefault}`}>
                {day.getDate()}
              </p>
            </div>
            <div className={styles.weekAppts}>
              {dayAppts.map(a => (
                <div key={a.id} className={`${styles.weekApptChip} ${isSelected ? styles.calChipSelected : STATUS_CHIP[a.status]}`}>
                  <span className={styles.weekApptTime}>{a.time?.slice(0,5)}</span>
                  <span className={styles.weekApptName}>{a.patientNome?.split(' ')[0]}</span>
                </div>
              ))}
              {dayAppts.length === 0 && (
                <button
                  className={styles.weekAddBtn}
                  onClick={e => { e.stopPropagation(); onOpenForm(iso) }}
                >+</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function toMin(time: string) {
  const [h, m] = (time || '00:00').split(':').map(Number)
  return h * 60 + m
}

function findConflicts(newAppt: { time: string; duration: number | string }, existing: Appointment[]) {
  const start = toMin(newAppt.time)
  const end   = start + (parseInt(String(newAppt.duration)) || 60)
  return existing.filter(a => {
    if (a.status === 'cancelado') return false
    const aStart = toMin(a.time)
    const aEnd   = aStart + (parseInt(String(a.duration)) || 60)
    return start < aEnd && end > aStart
  })
}

interface DayAppointmentProps {
  appt: Appointment
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  onPatient: () => void
}

function DayAppointment({ appt, onStatus, onDelete, onPatient }: DayAppointmentProps) {
  return (
    <div className={styles.apptCard}>
      <div className={styles.apptCardHeader}>
        <div>
          <p className={styles.apptTitle}>{appt.time} — {appt.patientNome}</p>
          <p className={styles.apptMeta}>{appt.type} · {appt.duration} min</p>
        </div>
        <button className="btn-danger btn-sm" onClick={() => onDelete(appt.id)}>🗑️</button>
      </div>
      {appt.notes && <p className={styles.apptNotes}>{appt.notes}</p>}
      <div className={styles.apptActions}>
        <button className={styles.apptPatientLink} onClick={() => onPatient()}>Ver ficha →</button>
        <span className={styles.apptDivider}>·</span>
        {Object.entries(STATUS_LABELS).map(([k, l]) => (
          <button
            key={k}
            onClick={() => onStatus(appt.id, k)}
            className={`${styles.statusBtnBase} ${appt.status === k ? STATUS_BTN_ACTIVE[k] : styles.statusBtnInactive}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatSelectedDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
