import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import { Empty } from './Dashboard'

function calcAge(dob) {
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

export default function Pacientes() {
  const [patients, setPatients] = useState([])
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    try { setPatients(await api.patients.list()) }
    catch { toast('Erro ao carregar', 'error') }
  }

  async function handleCreate(data) {
    try {
      const p = await api.patients.create(data)
      toast('Paciente cadastrado!', 'success')
      setShowForm(false)
      navigate(`/pacientes/${p.id}`)
    } catch (e) { toast(e.message, 'error') }
  }

  const filtered = patients
    .filter(p => {
      if (!q) return true
      const lq = q.toLowerCase()
      return (
        p.nome.toLowerCase().includes(lq) ||
        (p.telefone || '').includes(q) ||
        (p.cpf || '').replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
        (p.convenio || '').toLowerCase().includes(lq)
      )
    })
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pacientes</h1>
          <p className="text-sm text-slate-400 mt-0.5">{patients.length} paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <span>+</span> Novo Paciente
        </button>
      </div>

      <div className="mb-5 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          className="input pl-10"
          placeholder="Buscar por nome, telefone, CPF ou convênio..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0
          ? <Empty icon="🔍" text={q ? 'Nenhum resultado encontrado.' : 'Nenhum paciente cadastrado.'} />
          : filtered.map(p => <PatientCard key={p.id} patient={p} onClick={() => navigate(`/pacientes/${p.id}`)} />)
        }
      </div>

      {showForm && <PatientForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function PatientCard({ patient: p, onClick }) {
  const initials = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const age = p.dataNascimento ? calcAge(p.dataNascimento) : null

  return (
    <div
      className="card px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-150 group"
      onClick={onClick}
    >
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-blue-500/30">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{p.nome}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {p.telefone || 'Sem telefone'}
          {age ? ` · ${age} anos` : ''}
          {p.convenio ? ` · ${p.convenio}` : ''}
        </p>
      </div>
      <span className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors font-bold">→</span>
    </div>
  )
}
