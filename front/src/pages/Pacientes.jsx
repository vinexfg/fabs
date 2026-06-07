import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import { EmptyState } from '../components/EmptyState'
import { SkeletonList } from '../components/Skeleton'
import styles from './Pacientes.module.css'

function calculateAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  if (hasNotHadBirthdayYet) age--
  return age
}

const PAGE_SIZE = 15

export default function Pacientes() {
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [convenioFilter, setConvenioFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setPatients(await PatientRepository.findAll()) }
    catch { toast('Erro ao carregar', 'error') }
    finally { setLoading(false) }
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function onFilterChange(setter) {
    return v => { setter(v); setPage(1) }
  }

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
          onChange={e => onFilterChange(setSearchQuery)(e.target.value)}
        />
      </div>

      {convenios.length > 2 && (
        <div className={styles.chipRow}>
          {convenios.map(c => (
            <button
              key={c}
              onClick={() => onFilterChange(setConvenioFilter)(c === 'Todos' ? '' : c)}
              className={(convenioFilter === c) || (c === 'Todos' && !convenioFilter) ? styles.chipActive : styles.chip}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading
        ? <SkeletonList rows={6} />
        : (
          <div className={styles.list}>
            {filtered.length === 0
              ? <EmptyState
                  type={searchQuery || convenioFilter ? 'search' : 'patients'}
                  title={searchQuery || convenioFilter ? 'Nenhum resultado' : 'Nenhum paciente ainda'}
                  description={searchQuery || convenioFilter ? 'Tente outros termos de busca.' : 'Cadastre o primeiro paciente para começar.'}
                  action={!searchQuery && !convenioFilter ? { label: '+ Novo Paciente', onClick: () => setShowForm(true) } : undefined}
                />
              : paginated.map(patient => (
                  <PatientCard key={patient.id} patient={patient} onClick={() => navigate(`/pacientes/${patient.id}`)} />
                ))
            }
          </div>
        )
      }

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
          >‹ Anterior</button>
          <span className={styles.pageInfo}>
            {page} de {totalPages} · {filtered.length} pacientes
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >Próximo ›</button>
        </div>
      )}

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
