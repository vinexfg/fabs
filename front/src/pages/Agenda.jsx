import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppointmentRepository, PatientRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Modal from '../components/Modal'
import styles from './Agenda.module.css'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const TYPES  = ['Consulta','Limpeza/Profilaxia','Extração','Tratamento de Canal','Implante','Restauração','Prótese','Ortodontia','Avaliação','Retorno']

const STATUS_LABELS = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado', faltou: 'Faltou' }

const STATUS_CHIP = {
  agendado:  styles.calChipAgendado,
  realizado: styles.calChipRealizado,
  cancelado: styles.calChipCancelado,
  faltou:    styles.calChipFaltou,
}

const STATUS_DOT_COLOR = {
  agendado:  'bg-blue-500',
  realizado: 'bg-emerald-500',
  cancelado: 'bg-red-400',
  faltou:    'bg-amber-400',
}

const STATUS_BTN_ACTIVE = {
  agendado:  styles.statusAgendado,
  realizado: styles.statusRealizado,
  cancelado: styles.statusCancelado,
  faltou:    styles.statusFaltou,
}

function toISO(d) { return d.toISOString().split('T')[0] }
function today() { return toISO(new Date()) }
function fmtMonthKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month+1, 0)
  const days  = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

const EMPTY_FORM = { patientId: '', date: today(), time: '09:00', duration: 60, type: 'Consulta', notes: '' }

export default function Agenda() {
  const [ref, setRef]             = useState(new Date())
  const [selected, setSelected]   = useState(today())
  const [monthAppts, setMonthAppts] = useState([])
  const [dayAppts, setDayAppts]   = useState([])
  const [patients, setPatients]   = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType]     = useState('')
  const [mobileView, setMobileView]     = useState('list')
  const navigate = useNavigate()
  const toast    = useToast()
  const confirm  = useConfirm()

  const loadMonth = useCallback(async (d) => {
    try { setMonthAppts(await AppointmentRepository.findByMonth(fmtMonthKey(d))) }
    catch { toast('Erro ao carregar agenda', 'error') }
  }, [])

  const loadDay = useCallback(async (date) => {
    try { setDayAppts(await AppointmentRepository.findByDate(date)) }
    catch {}
  }, [])

  useEffect(() => { PatientRepository.findAll().then(setPatients).catch(() => {}) }, [])
  useEffect(() => { loadMonth(ref) }, [ref])
  useEffect(() => { loadDay(selected) }, [selected])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function prevMonth() { setRef(d => new Date(d.getFullYear(), d.getMonth()-1, 1)) }
  function nextMonth() { setRef(d => new Date(d.getFullYear(), d.getMonth()+1, 1)) }
  function openForm(date) { setForm({ ...EMPTY_FORM, date }); setShowForm(true) }

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
      await AppointmentRepository.create(form)
      toast('Consulta agendada!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadMonth(ref)
      loadDay(selected)
    } catch (error) { toast(error.message, 'error') }
  }

  async function handleStatus(appointmentId, status) {
    try { await AppointmentRepository.updateStatus(appointmentId, status); loadDay(selected); loadMonth(ref) }
    catch (error) { toast(error.message, 'error') }
  }

  async function handleDelete(appointmentId) {
    if (!await confirm('Remover esta consulta?')) return
    try { await AppointmentRepository.remove(appointmentId); loadDay(selected); loadMonth(ref) }
    catch (error) { toast(error.message, 'error') }
  }

  const visibleAppts = dayAppts.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false
    if (filterType   && a.type   !== filterType)   return false
    return true
  })

  const apptByDate = monthAppts.reduce((acc, a) => {
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

      <div className={styles.layout}>
        <div className={`${styles.calCard} ${mobileView === 'list' ? styles.calCardMobileHidden : ''}`}>
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

function toMin(time) {
  const [h, m] = (time || '00:00').split(':').map(Number)
  return h * 60 + m
}

function findConflicts(newAppt, existing) {
  const start = toMin(newAppt.time)
  const end   = start + parseInt(newAppt.duration || 60)
  return existing.filter(a => {
    if (a.status === 'cancelado') return false
    const aStart = toMin(a.time)
    const aEnd   = aStart + parseInt(a.duration || 60)
    return start < aEnd && end > aStart
  })
}

function DayAppointment({ appt, onStatus, onDelete, onPatient }) {
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

function formatSelectedDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
