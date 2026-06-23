import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRepository, AppointmentRepository, SettingsRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import { EmptyState } from '../components/EmptyState'
import { SkeletonStatCards, SkeletonList } from '../components/Skeleton'
import { openWhatsAppSequential } from '../utils/openWhatsAppSequential'
import type { Patient, Appointment, ClinicSettings } from '../types/entities'
import styles from './Dashboard.module.css'

const STATUS_BADGE: Record<string, string> = {
  agendado:  styles.statusAgendado,
  realizado: styles.statusRealizado,
  cancelado: styles.statusCancelado,
  faltou:    styles.statusFaltou,
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado', faltou: 'Faltou',
}

type NotesSaveStatus = 'idle' | 'saving' | 'saved'

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [tomorrowAppts, setTomorrowAppts] = useState<Appointment[]>([])
  const [clinic, setClinic] = useState<Partial<ClinicSettings>>({})
  const [showForm, setShowForm] = useState(false)
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [notesSaveStatus, setNotesSaveStatus] = useState<NotesSaveStatus>('idle')
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const navigate = useNavigate()
  const toast = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    try {
      const [patientList, todayAppointments, tomorrowAppointments, clinicSettings, notesData] = await Promise.all([
        PatientRepository.findAll(),
        AppointmentRepository.findByDate(today),
        AppointmentRepository.findTomorrow(),
        SettingsRepository.find(),
        SettingsRepository.getNotes(),
      ])
      setPatients(patientList)
      setTodayAppts(todayAppointments)
      setTomorrowAppts(tomorrowAppointments)
      setClinic(clinicSettings)
      setNotes(notesData.notes ?? '')
    } catch { toast('Erro ao carregar dados', 'error') }
    finally { setLoading(false) }
  }

  function buildWaLink(appt: Appointment): string | null {
    const phone = (appt.patientTelefone || '').replace(/\D/g, '')
    if (!phone) return null
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const msg = encodeURIComponent(
      `Olá ${(appt.patientNome || '').split(' ')[0]}! 👋\n` +
      `Lembrando que você tem consulta *amanhã, ${dateStr}*, às *${appt.time?.slice(0,5)}h*` +
      `${clinic.clinicName ? ` no *${clinic.clinicName}*` : ''}.\n` +
      `Em caso de dúvidas, estamos à disposição. Até amanhã! 😊`
    )
    return `https://wa.me/55${phone}?text=${msg}`
  }

  function markSent(id: string) {
    setSentReminders(s => new Set([...s, id]))
    toast('Lembrete aberto no WhatsApp!', 'success')
  }

  function handleNotesChange(value: string) {
    setNotes(value)
    setNotesSaveStatus('saving')
    clearTimeout(notesSaveTimer.current)
    notesSaveTimer.current = setTimeout(async () => {
      try {
        await SettingsRepository.updateNotes(value)
        setNotesSaveStatus('saved')
        setTimeout(() => setNotesSaveStatus('idle'), 2000)
      } catch {
        setNotesSaveStatus('idle')
      }
    }, 1000)
  }

  async function handleCreate(data: Parameters<typeof PatientRepository.create>[0]) {
    try {
      const newPatient = await PatientRepository.create(data)
      toast('Paciente cadastrado!', 'success', {
        action: { label: 'Ver ficha', onClick: () => navigate(`/pacientes/${newPatient.id}`) }
      })
      setShowForm(false)
      navigate(`/pacientes/${newPatient.id}`)
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 7)
  const thisMonthCount = patients.filter(p => p.criadoEm?.startsWith(thisMonth)).length
  const lastMonthCount = patients.filter(p => p.criadoEm?.startsWith(lastMonth)).length
  const trend = thisMonthCount - lastMonthCount
  const recent = [...patients].sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? '')).slice(0, 6)

  const { birthdaysToday, birthdaysWeek } = getBirthdays(patients)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {clinic.clinicName || 'Dashboard'}
          </h1>
          <p className={styles.subtitle}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <span>+</span> Novo Paciente
        </button>
      </div>

      {loading ? (
        <>
          <SkeletonStatCards />
          <SkeletonList rows={3} />
          <SkeletonList rows={4} />
        </>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <StatCard
              label="Total de Pacientes" value={patients.length} icon="👥"
              bg="bg-blue-50 dark:bg-blue-500/10" text="text-blue-600 dark:text-blue-400"
              trend={thisMonthCount > 0 ? `+${thisMonthCount} este mês` : null}
              trendPositive
            />
            <StatCard
              label="Cadastros este mês" value={thisMonthCount}
              icon="🆕" bg="bg-violet-50 dark:bg-violet-500/10" text="text-violet-600 dark:text-violet-400"
              trend={trend !== 0 ? `${trend > 0 ? '+' : ''}${trend} vs mês anterior` : 'igual ao mês anterior'}
              trendPositive={trend >= 0}
            />
            <StatCard
              label="Consultas hoje" value={todayAppts.length} icon="📅"
              bg="bg-emerald-50 dark:bg-emerald-500/10" text="text-emerald-600 dark:text-emerald-400"
              trend={tomorrowAppts.length > 0 ? `${tomorrowAppts.length} amanhã` : null}
              trendPositive
            />
          </div>

          <div className={styles.notesSection}>
            <div className={styles.notesSectionHeader}>
              <span className={styles.notesIcon}>📝</span>
              <h2 className={styles.sectionTitle}>Notas do Dia</h2>
              <span className={styles.notesSaveStatus}>
                {notesSaveStatus === 'saving' && 'Salvando...'}
                {notesSaveStatus === 'saved' && '✓ Salvo'}
              </span>
            </div>
            <textarea
              className={styles.notesTextarea}
              placeholder="Anotações rápidas, lembretes, observações do dia..."
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              rows={4}
            />
          </div>

          {(birthdaysToday.length > 0 || birthdaysWeek.length > 0) && (
            <div className={styles.birthdaySection}>
              <div className={styles.sectionHeader}>
                <div className={styles.reminderTitleRow}>
                  <span>🎂</span>
                  <h2 className={styles.sectionTitle}>Aniversariantes</h2>
                  {birthdaysToday.length > 0 && (
                    <span className={styles.birthdayBadge}>{birthdaysToday.length} hoje!</span>
                  )}
                </div>
              </div>
              <div className={styles.list}>
                {[...birthdaysToday, ...birthdaysWeek].map(p => {
                  const [, mm, dd] = (p.dataNascimento || '').split('-')
                  const isToday = birthdaysToday.includes(p)
                  const age = p.dataNascimento ? new Date().getFullYear() - parseInt(p.dataNascimento.split('-')[0]) : null
                  const phone = (p.telefone || '').replace(/\D/g, '')
                  const waMsg = phone ? encodeURIComponent(`Olá ${p.nome.split(' ')[0]}! 🎂 A equipe ${clinic.clinicName || 'DenteFácil'} deseja um feliz aniversário! Que seja um dia especial!`) : null
                  return (
                    <div key={p.id} className={styles.birthdayRow}>
                      <div className={`${styles.birthdayIcon} ${isToday ? styles.birthdayIconToday : ''}`}>
                        {isToday ? '🎂' : '🎁'}
                      </div>
                      <div className={styles.rowInfo} onClick={() => navigate(`/pacientes/${p.id}`)}>
                        <p className={styles.rowName}>{p.nome}</p>
                        <p className={styles.rowSub}>
                          {dd}/{mm}{age ? ` · ${age} anos` : ''}
                          {isToday ? ' · Hoje! 🎉' : ' · Esta semana'}
                        </p>
                      </div>
                      {waMsg && phone && (
                        <a
                          href={`https://wa.me/55${phone}?text=${waMsg}`}
                          target="_blank" rel="noreferrer"
                          className={styles.waSend}
                        >
                          💬 Parabéns
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Consultas de Hoje</h2>
              <button className={styles.sectionLink} onClick={() => navigate('/agenda')}>Ver agenda →</button>
            </div>
            {todayAppts.length === 0
              ? <EmptyState type="appointments" title="Nenhuma consulta hoje" description="Sem consultas agendadas para hoje." />
              : <div className={styles.list}>
                  {todayAppts.map(a => (
                    <div key={a.id} className={`group ${styles.row}`} onClick={() => navigate(`/pacientes/${a.patientId}`)}>
                      <div className={styles.timeBlock}>
                        <p className={`${styles.timeValue} text-blue-600 dark:text-blue-400`}>{a.time?.slice(0, 5) || '--'}</p>
                        <p className={styles.timeDuration}>{a.duration || 60}min</p>
                      </div>
                      <div className={styles.rowInfo}>
                        <p className={styles.rowName}>{a.patientNome}</p>
                        <p className={styles.rowSub}>{a.type || 'Consulta'}</p>
                      </div>
                      <span className={`${styles.statusBadge} ${STATUS_BADGE[a.status] || ''}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                      <span className={styles.arrow}>→</span>
                    </div>
                  ))}
                </div>
            }
          </div>

          {tomorrowAppts.length > 0 && (
            <div className={styles.reminderSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.reminderTitleRow}>
                  <span className="text-base">🔔</span>
                  <h2 className={styles.sectionTitle}>Lembretes de Amanhã</h2>
                  <span className={styles.reminderBadge}>
                    {tomorrowAppts.length} consulta{tomorrowAppts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  className={styles.reminderAllBtn}
                  onClick={() => {
                    const withLink = tomorrowAppts.filter(a => buildWaLink(a))
                    if (withLink.length === 0) { toast('Nenhum paciente tem telefone cadastrado', 'error'); return }
                    openWhatsAppSequential(withLink.map(a => buildWaLink(a) as string), () => {})
                    setSentReminders(new Set(tomorrowAppts.map(a => a.id)))
                    toast(`${withLink.length} lembrete${withLink.length !== 1 ? 's' : ''} sendo aberto${withLink.length !== 1 ? 's' : ''}...`, 'success')
                  }}
                >
                  Enviar todos →
                </button>
              </div>
              <div className={styles.list}>
                {tomorrowAppts.map(a => {
                  const waLink = buildWaLink(a)
                  const sent = sentReminders.has(a.id)
                  return (
                    <div key={a.id} className={styles.reminderRow}>
                      <div className={styles.timeBlock}>
                        <p className={`${styles.timeValue} text-amber-600 dark:text-amber-400`}>{a.time?.slice(0, 5) || '--'}</p>
                        <p className={styles.timeDuration}>{a.duration || 60}min</p>
                      </div>
                      <div className={styles.rowInfo}>
                        <p className={styles.rowName}>{a.patientNome}</p>
                        <p className={styles.rowSub}>
                          {a.patientTelefone || <span className={styles.noPhone}>Sem telefone</span>}
                          {a.type ? ` · ${a.type}` : ''}
                        </p>
                      </div>
                      {waLink
                        ? <a href={waLink} target="_blank" rel="noreferrer"
                            onClick={() => markSent(a.id)}
                            className={sent ? styles.waSent : styles.waSend}>
                            {sent ? '✓ Enviado' : '💬 Enviar'}
                          </a>
                        : <span className={styles.waAbsent}>Sem telefone</span>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pacientes Recentes</h2>
              <button className={styles.sectionLink} onClick={() => navigate('/pacientes')}>Ver todos →</button>
            </div>
            {recent.length === 0
              ? <EmptyState type="patients" title="Nenhum paciente ainda" description='Clique em "Novo Paciente" para começar.' action={{ label: '+ Novo Paciente', onClick: () => setShowForm(true) }} />
              : <div className={styles.list}>
                  {recent.map(p => <PatientRow key={p.id} patient={p} onClick={() => navigate(`/pacientes/${p.id}`)} />)}
                </div>
            }
          </div>
        </>
      )}

      {showForm && <PatientForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: string
  bg: string
  text: string
  trend?: string | null
  trendPositive?: boolean
}

function StatCard({ label, value, icon, bg, text, trend, trendPositive }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcon} ${bg}`}>{icon}</div>
      <div>
        <p className={`${styles.statValue} ${text}`}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
        {trend && (
          <p className={`${styles.statTrend} ${trendPositive ? styles.trendUp : styles.trendDown}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

export function PatientRow({ patient: p, onClick }: { patient: Patient; onClick: () => void }) {
  const initials = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`group ${styles.row}`} onClick={onClick}>
      {p.foto
        ? <img src={p.foto} alt={p.nome} className={styles.avatar} />
        : <div className={styles.avatarFallback}>{initials}</div>
      }
      <div className={styles.rowInfo}>
        <p className={styles.rowName}>{p.nome}</p>
        <p className={styles.rowSub}>{p.telefone || 'Sem telefone'}</p>
      </div>
      <span className={styles.arrow}>→</span>
    </div>
  )
}

function getBirthdays(patients: Patient[]) {
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayMMDD = `${mm}-${dd}`

  const birthdaysToday: Patient[] = []
  const birthdaysWeek: Patient[] = []

  patients.forEach(p => {
    if (!p.dataNascimento) return
    const parts = p.dataNascimento.split('-')
    if (parts.length < 3) return
    const bMMDD = `${parts[1]}-${parts[2]}`
    if (bMMDD === todayMMDD) { birthdaysToday.push(p); return }
    const bThisYear = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const diff = (bThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    if (diff > 0 && diff <= 7) birthdaysWeek.push(p)
  })

  birthdaysWeek.sort((a, b) => {
    const [, am, ad] = (a.dataNascimento as string).split('-')
    const [, bm, bd] = (b.dataNascimento as string).split('-')
    return `${am}-${ad}`.localeCompare(`${bm}-${bd}`)
  })

  return { birthdaysToday, birthdaysWeek }
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
