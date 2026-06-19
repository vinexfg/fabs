import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatientRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import { EmptyState } from '../components/EmptyState'
import { SkeletonList } from '../components/Skeleton'
import type { Patient } from '../types/entities'
import styles from './Pacientes.module.css'

function calculateAge(dateOfBirth: string) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  if (hasNotHadBirthdayYet) age--
  return age
}

const PAGE_SIZE = 15

export default function Pacientes() {
  const [patients, setPatients]     = useState<Patient[]>([])
  const [total, setTotal]           = useState(0)
  const [allConvenios, setAllConvenios] = useState<string[]>([])
  const [searchQuery, setSearchQuery]   = useState('')
  const [convenioFilter, setConvenioFilter] = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const navigate = useNavigate()
  const toast    = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const load = useCallback(async (q: string, conv: string, pg: number) => {
    setLoading(true)
    try {
      const search = [q, conv && conv !== 'Todos' ? conv : ''].filter(Boolean).join(' ')
      const result = await PatientRepository.findPaginated({ q: search, page: pg, limit: PAGE_SIZE })
      setPatients(result.patients)
      setTotal(result.total)
    } catch { toast('Erro ao carregar', 'error') }
    finally { setLoading(false) }
  }, [toast])

  // Load convenios for filter chips once
  useEffect(() => {
    PatientRepository.findAll()
      .then(all => {
        const convs = [...new Set(all.map(p => p.convenio || 'Particular').filter(Boolean))].sort() as string[]
        setAllConvenios(convs)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { load(searchQuery, convenioFilter, page) }, [load, searchQuery, convenioFilter, page])

  function handleSearchChange(v: string) {
    setSearchQuery(v)
    setPage(1)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(v, convenioFilter, 1), 350)
  }

  function handleConvenioChange(c: string) {
    const conv = c === 'Todos' ? '' : c
    setConvenioFilter(conv)
    setPage(1)
    load(searchQuery, conv, 1)
  }

  function handlePage(newPage: number) {
    setPage(newPage)
    load(searchQuery, convenioFilter, newPage)
  }

  async function handleCreate(data: Parameters<typeof PatientRepository.create>[0]) {
    try {
      const newPatient = await PatientRepository.create(data)
      toast('Paciente cadastrado!', 'success')
      setShowForm(false)
      navigate(`/pacientes/${newPatient.id}`)
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const convenios  = ['Todos', ...allConvenios]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pacientes</h1>
          <p className={styles.subtitle}>
            {total} paciente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
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
          onChange={e => handleSearchChange(e.target.value)}
        />
      </div>

      {allConvenios.length > 1 && (
        <div className={styles.chipRow}>
          {convenios.map(c => (
            <button
              key={c}
              onClick={() => handleConvenioChange(c)}
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
            {patients.length === 0
              ? <EmptyState
                  type={searchQuery || convenioFilter ? 'search' : 'patients'}
                  title={searchQuery || convenioFilter ? 'Nenhum resultado' : 'Nenhum paciente ainda'}
                  description={searchQuery || convenioFilter ? 'Tente outros termos de busca.' : 'Cadastre o primeiro paciente para começar.'}
                  action={!searchQuery && !convenioFilter ? { label: '+ Novo Paciente', onClick: () => setShowForm(true) } : undefined}
                />
              : patients.map(patient => (
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
            onClick={() => handlePage(Math.max(page - 1, 1))}
            disabled={page === 1}
          >‹ Anterior</button>
          <span className={styles.pageInfo}>
            {page} de {totalPages} · {total} pacientes
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => handlePage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
          >Próximo ›</button>
        </div>
      )}

      {showForm && <PatientForm onSave={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
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
