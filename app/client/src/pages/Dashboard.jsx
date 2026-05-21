import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import Badge from '../components/Badge'

export default function Dashboard() {
  const [patients, setPatients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    try { setPatients(await api.patients.list()) }
    catch { toast('Erro ao carregar pacientes', 'error') }
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

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Bem-vindo ao DenteFácil</p>
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
          gradient="from-blue-500 to-blue-600"
          bg="bg-blue-50 dark:bg-blue-500/10"
          text="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Cadastros este mês"
          value={patients.filter(p => p.criadoEm?.startsWith(new Date().toISOString().slice(0,7))).length}
          icon="🆕"
          gradient="from-violet-500 to-violet-600"
          bg="bg-violet-50 dark:bg-violet-500/10"
          text="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Total na base"
          value={patients.length}
          icon="🦷"
          gradient="from-emerald-500 to-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-500/10"
          text="text-emerald-600 dark:text-emerald-400"
        />
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
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-blue-500/30">
        {initials}
      </div>
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
