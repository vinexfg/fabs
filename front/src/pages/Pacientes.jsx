import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import { Empty } from './Dashboard'
import styles from './Pacientes.module.css'

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
    } catch (error) { toast(error.message, 'error') }
  }

  const convenios = ['Todos', ...Array.from(new Set(patients.map(p => p.convenio || 'Particular').filter(Boolean))).sort()]

  const filtered = patients
    .filter(patient => {
      if (convenioFilter && convenioFilter !== 'Todos') {
        if ((patient.convenio || 'Particular') !== convenioFilter) return false
      }
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        patient.nome.toLowerCase().includes(q) ||
        (patient.telefone || '').includes(searchQuery) ||
        (patient.cpf || '').replace(/\D/g, '').includes(searchQuery.replace(/\D/g, '')) ||
        (patient.convenio || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pacientes</h1>
          <p className={styles.subtitle}>
            {patients.length} paciente{patients.length !== 1 ? 's' : ''} cadastrado{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <span>+</span> Novo Paciente
        </button>
      </div>

      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className="input pl-10"
          placeholder="Buscar por nome, telefone, CPF ou convênio..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {convenios.length > 2 && (
        <div className={styles.chipRow}>
          {convenios.map(c => (
            <button
              key={c}
              onClick={() => setConvenioFilter(c === 'Todos' ? '' : c)}
              className={(convenioFilter === c) || (c === 'Todos' && !convenioFilter) ? styles.chipActive : styles.chip}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {filtered.length === 0
          ? <Empty icon="🔍" text={searchQuery || convenioFilter ? 'Nenhum resultado encontrado.' : 'Nenhum paciente cadastrado.'} />
          : filtered.map(patient => (
              <PatientCard key={patient.id} patient={patient} onClick={() => navigate(`/pacientes/${patient.id}`)} />
            ))
        }
      </div>

      {showForm && <PatientForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function PatientCard({ patient, onClick }) {
  const initials = patient.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const age = patient.dataNascimento ? calculateAge(patient.dataNascimento) : null

  return (
    <div className={`group ${styles.patientCard}`} onClick={onClick}>
      {patient.foto
        ? <img src={patient.foto} alt={patient.nome} className={styles.avatar} />
        : <div className={styles.avatarFallback}>{initials}</div>
      }
      <div className={styles.patientInfo}>
        <p className={styles.patientName}>{patient.nome}</p>
        <p className={styles.patientMeta}>
          {patient.telefone || 'Sem telefone'}
          {age ? ` · ${age} anos` : ''}
          {patient.convenio ? ` · ${patient.convenio}` : ''}
        </p>
      </div>
      <span className={styles.arrow}>→</span>
    </div>
  )
}
