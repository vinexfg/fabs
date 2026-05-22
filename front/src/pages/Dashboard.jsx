import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRepository, AppointmentRepository, SettingsRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import styles from './Dashboard.module.css'

const STATUS_BADGE = {
  agendado:  styles.statusAgendado,
  realizado: styles.statusRealizado,
  cancelado: styles.statusCancelado,
  faltou:    styles.statusFaltou,
}

const STATUS_LABELS = {
  agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado', faltou: 'Faltou',
}

export default function Dashboard() {
  const [patients, setPatients] = useState([])
  const [todayAppts, setTodayAppts] = useState([])
  const [tomorrowAppts, setTomorrowAppts] = useState([])
  const [clinic, setClinic] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [sentReminders, setSentReminders] = useState(new Set())
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const today = new Date().toISOString().split('T')[0]
    try {
      const [patientList, todayAppointments, tomorrowAppointments, clinicSettings] = await Promise.all([
        PatientRepository.findAll(),
        AppointmentRepository.findByDate(today),
        AppointmentRepository.findTomorrow(),
        SettingsRepository.find(),
      ])
      setPatients(patientList)
      setTodayAppts(todayAppointments)
      setTomorrowAppts(tomorrowAppointments)
      setClinic(clinicSettings)
    } catch { toast('Erro ao carregar dados', 'error') }
  }

  function buildWaLink(appt) {
    const phone = (appt.patientTelefone || '').replace(/\D/g, '')
    if (!phone) return null
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const msg = encodeURIComponent(
      `Olá ${appt.patientNome.split(' ')[0]}! 👋\n` +
      `Lembrando que você tem consulta *amanhã, ${dateStr}*, às *${appt.time?.slice(0,5)}h*` +
      `${clinic.clinicName ? ` no *${clinic.clinicName}*` : ''}.\n` +
      `Em caso de dúvidas, estamos à disposição. Até amanhã! 😊`
    )
    return `https://wa.me/55${phone}?text=${msg}`
  }

  function markSent(id) {
    setSentReminders(s => new Set([...s, id]))
    toast('Lembrete aberto no WhatsApp!', 'success')
  }

  async function handleCreate(data) {
    try {
      const newPatient = await PatientRepository.create(data)
      toast('Paciente cadastrado!', 'success')
      setShowForm(false)
      navigate(`/pacientes/${newPatient.id}`)
    } catch (error) { toast(error.message, 'error') }
  }

  const recent = [...patients].sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? '')).slice(0, 6)
  const thisMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <span>+</span> Novo Paciente
        </button>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total de Pacientes" value={patients.length} icon="👥"
          bg="bg-blue-50 dark:bg-blue-500/10" text="text-blue-600 dark:text-blue-400" />
        <StatCard label="Cadastros este mês" value={patients.filter(p => p.criadoEm?.startsWith(thisMonth)).length}
          icon="🆕" bg="bg-violet-50 dark:bg-violet-500/10" text="text-violet-600 dark:text-violet-400" />
        <StatCard label="Consultas hoje" value={todayAppts.length} icon="📅"
          bg="bg-emerald-50 dark:bg-emerald-500/10" text="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Consultas de Hoje</h2>
          <button className={styles.sectionLink} onClick={() => navigate('/agenda')}>Ver agenda →</button>
        </div>
        {todayAppts.length === 0
          ? <Empty icon="📅" text="Nenhuma consulta agendada para hoje." />
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
                const links = tomorrowAppts.filter(a => buildWaLink(a))
                if (links.length === 0) { toast('Nenhum paciente tem telefone cadastrado', 'error'); return }
                links.forEach(a => window.open(buildWaLink(a), '_blank'))
                setSentReminders(new Set(tomorrowAppts.map(a => a.id)))
                toast(`${links.length} lembrete${links.length !== 1 ? 's' : ''} aberto${links.length !== 1 ? 's' : ''}!`, 'success')
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
          ? <Empty icon="👤" text='Nenhum paciente ainda. Clique em "Novo Paciente" para começar.' />
          : <div className={styles.list}>
              {recent.map(p => <PatientRow key={p.id} patient={p} onClick={() => navigate(`/pacientes/${p.id}`)} />)}
            </div>
        }
      </div>

      {showForm && <PatientForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function StatCard({ label, value, icon, bg, text }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcon} ${bg}`}>{icon}</div>
      <div>
        <p className={`${styles.statValue} ${text}`}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </div>
  )
}

export function PatientRow({ patient: p, onClick }) {
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

export function Empty({ icon, text }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
