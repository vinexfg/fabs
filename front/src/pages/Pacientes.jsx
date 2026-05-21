import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import { Empty } from './Dashboard'

function calculateAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  if (hasNotHadBirthdayYet) age--
  return age
}

export default function Pacientes() {
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [convenioFilter, setConvenioFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    try { setPatients(await PatientRepository.findAll()) }
    catch { toast('Erro ao carregar', 'error') }
  }

  async function handleCreate(data) {
    try {
      const newPatient = await PatientRepository.create(data)
      toast('Paciente cadastrado!', 'success')
      setShowForm(false)
      navigate(`/pacientes/${newPatient.id}`)
    } catch (error) {
      toast(error.message, 'error')
    }
  }

  const convenios = ['Todos', ...Array.from(new Set(patients.map(patient => patient.convenio || 'Particular').filter(Boolean))).sort()]

  const filtered = patients
    .filter(patient => {
      if (convenioFilter && convenioFilter !== 'Todos') {
        const patientConvenio = patient.convenio || 'Particular'
        if (patientConvenio !== convenioFilter) return false
      }
      if (!searchQuery) return true
      const lowerQuery = searchQuery.toLowerCase()
      return (
        patient.nome.toLowerCase().includes(lowerQuery) ||
        (patient.telefone || '').includes(searchQuery) ||
        (patient.cpf || '').replace(/\D/g, '').includes(searchQuery.replace(/\D/g, '')) ||
        (patient.convenio || '').toLowerCase().includes(lowerQuery)
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

      <div className="mb-4 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          className="input pl-10"
          placeholder="Buscar por nome, telefone, CPF ou convênio..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Convenio filter chips */}
      {convenios.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {convenios.map(c => (
            <button
              key={c}
              onClick={() => setConvenioFilter(c === 'Todos' ? '' : c)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150
                ${(convenioFilter === c) || (c === 'Todos' && !convenioFilter)
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.length === 0
          ? <Empty icon="🔍" text={searchQuery || convenioFilter ? 'Nenhum resultado encontrado.' : 'Nenhum paciente cadastrado.'} />
          : filtered.map(patient => <PatientCard key={patient.id} patient={patient} onClick={() => navigate(`/pacientes/${patient.id}`)} />)
        }
      </div>

      {showForm && <PatientForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function PatientCard({ patient, onClick }) {
  const initials = patient.nome.split(' ').map(namePart => namePart[0]).slice(0, 2).join('').toUpperCase()
  const age = patient.dataNascimento ? calculateAge(patient.dataNascimento) : null

  return (
    <div
      className="card px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-150 group"
      onClick={onClick}
    >
      {patient.foto
        ? <img src={patient.foto} alt={patient.nome} className="w-11 h-11 rounded-full object-cover shrink-0" />
        : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm shadow-blue-500/30">{initials}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{patient.nome}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {patient.telefone || 'Sem telefone'}
          {age ? ` · ${age} anos` : ''}
          {patient.convenio ? ` · ${patient.convenio}` : ''}
        </p>
      </div>
      <span className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors font-bold">→</span>
    </div>
  )
}
