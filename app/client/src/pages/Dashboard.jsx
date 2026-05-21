import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import Badge from '../components/Badge'

const STATUS_APPT = {
  agendado:  { label: 'Agendado',  cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  realizado: { label: 'Realizado', cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  faltou:    { label: 'Faltou',    cls: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
}

export default function Dashboard() {
  const [patients, setPatients] = useState([])
  const [todayAppts, setTodayAppts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    const today = new Date().toISOString().split('T')[0]
    try {
      const [ps, appts] = await Promise.all([
        api.patients.list(),
        api.appointments.byDate(today),
      ])
      setPatients(ps)
      setTodayAppts(appts)
    } catch { toast('Erro ao carregar dados', 'error') }
  }

  async function handleCreate(data) {
    try {
      const p = await api.patients.create(data)
      toast('Paciente cadastrado!', 'success')
      setShowForm(false)
      navigate(`/pacientes/${p.id}`)
    } catch (e) { toast(e.message, 'error') }
  }

  const recent = [...patients].sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? '')).slice(0, 6)
  const thisMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <span>+</span> Novo Paciente
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-7">
        <StatCard
          label="Total de Pacientes"
          value={patients.length}
          icon="👥"
          bg="bg-blue-50 dark:bg-blue-500/10"
          text="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Cadastros este mês"
          value={patients.filter(p => p.criadoEm?.startsWith(thisMonth)).length}
          icon="🆕"
          bg="bg-violet-50 dark:bg-violet-500/10"
          text="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Consultas hoje"
          value={todayAppts.length}
          icon="📅"
          bg="bg-emerald-50 dark:bg-emerald-500/10"
          text="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Today's appointments */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Consultas de Hoje</h2>
          <button onClick={() => navigate('/agenda')} className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors">
            Ver agenda →
          </button>
        </div>
        {todayAppts.length === 0
          ? <Empty icon="📅" text="Nenhuma consulta agendada para hoje." />
          : <div className="flex flex-col gap-2">
              {todayAppts.map(a => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150 group"
                  onClick={() => navigate(`/pacientes/${a.patientId}`)}
                >
                  <div className="text-center min-w-[52px]">
                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 leading-none">{a.time?.slice(0, 5) || '--'}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{a.duration || 60}min</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{a.patientNome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.type || 'Consulta'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_APPT[a.status]?.cls || ''}`}>
                    {STATUS_APPT[a.status]?.label || a.status}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors text-sm">→</span>
                </div>
              ))}
            </div>
        }
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Pacientes Recentes</h2>
          <button onClick={() => navigate('/pacientes')} className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors">
            Ver todos →
          </button>
        </div>
        {recent.length === 0
          ? <Empty icon="👤" text='Nenhum paciente ainda. Clique em "Novo Paciente" para começar.' />
          : <div className="flex flex-col gap-2">
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
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className={`text-3xl font-extrabold ${text}`}>{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function PatientRow({ patient: p, onClick }) {
  const initials = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-150 group"
      onClick={onClick}
    >
      {p.foto
        ? <img src={p.foto} alt={p.nome} className="w-10 h-10 rounded-full object-cover shrink-0" />
        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-blue-500/30">{initials}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{p.nome}</p>
        <p className="text-xs text-slate-400 mt-0.5">{p.telefone || 'Sem telefone'}</p>
      </div>
      <span className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors text-sm">→</span>
    </div>
  )
}

export function Empty({ icon, text }) {
  return (
    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
      <div className="text-5xl mb-3 opacity-60">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
