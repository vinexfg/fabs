import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import PatientForm from '../components/patient/PatientForm'
import FichaTab from '../components/patient/FichaTab'
import TratamentoTab from '../components/patient/TratamentoTab'
import FinanceiroTab from '../components/patient/FinanceiroTab'
import EvolusaoTab from '../components/patient/EvolusaoTab'
import OdontogramaTab from '../components/patient/OdontogramaTab'
import Badge from '../components/Badge'
import { printPatientFile } from '../utils/print'

const TABS = [
  { id: 'ficha',        label: 'Ficha',        icon: '📋' },
  { id: 'odontograma',  label: 'Odontograma',  icon: '🦷' },
  { id: 'tratamento',   label: 'Tratamento',   icon: '⚕️' },
  { id: 'financeiro',   label: 'Financeiro',   icon: '💰' },
  { id: 'evolucoes',    label: 'Evoluções',    icon: '📝' },
]

function fmtR(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function calcAge(dob) {
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [patient, setPatient] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [payments, setPayments] = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [tab, setTab] = useState('ficha')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    try {
      const [p, tr, py, ev] = await Promise.all([
        api.patients.get(id),
        api.treatments.list(id),
        api.payments.list(id),
        api.evolutions.list(id),
      ])
      setPatient(p); setTreatments(tr); setPayments(py); setEvolutions(ev)
    } catch {
      toast('Erro ao carregar paciente', 'error')
      navigate('/pacientes')
    } finally { setLoading(false) }
  }

  async function handleEdit(data) {
    try {
      const updated = await api.patients.update(id, data)
      setPatient(updated)
      toast('Dados atualizados!', 'success')
      setEditing(false)
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${patient.nome}"? Todos os dados serão removidos permanentemente.`)) return
    try {
      await api.patients.delete(id)
      toast('Paciente excluído.')
      navigate('/pacientes')
    } catch (e) { toast(e.message, 'error') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
      <span className="text-2xl animate-spin">⚙️</span>
      <span className="text-sm font-medium">Carregando...</span>
    </div>
  )
  if (!patient) return null

  const initials = patient.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const totalTrat = treatments.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
  const totalPago = payments.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const emAberto = Math.max(0, totalTrat - totalPago)
  const doneTr = treatments.filter(t => t.status === 'concluido').length

  return (
    <div className="animate-fade-up">
      <button
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-5 font-semibold transition-colors"
        onClick={() => navigate('/pacientes')}
      >
        ← Voltar
      </button>

      {/* Header card */}
      <div className="card p-5 mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-md shadow-blue-500/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{patient.nome}</h1>
            <p className="text-sm text-slate-400 mt-1">
              {patient.telefone
                ? <a href={`tel:${patient.telefone}`} className="hover:text-blue-500 transition-colors">{patient.telefone}</a>
                : 'Sem telefone'}
              {patient.dataNascimento ? ` · ${calcAge(patient.dataNascimento)} anos` : ''}
              {patient.convenio ? ` · ${patient.convenio}` : ''}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {emAberto > 0
                ? <Badge variant="red">💰 Em aberto: {fmtR(emAberto)}</Badge>
                : <Badge variant="green">✓ Sem pendências</Badge>
              }
              {treatments.length > 0 && (
                <Badge variant="blue">🦷 {doneTr}/{treatments.length} procedimentos</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button className="btn-secondary btn-sm" onClick={() => printPatientFile(patient, treatments, payments, evolutions)}>🖨️ Imprimir</button>
            <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Editar</button>
            <button className="btn-danger" onClick={handleDelete}>🗑️</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150
              ${tab === t.id
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ficha'       && <FichaTab patient={patient} />}
      {tab === 'odontograma' && <OdontogramaTab patientId={id} />}
      {tab === 'tratamento'  && <TratamentoTab patientId={id} treatments={treatments} onRefresh={loadAll} />}
      {tab === 'financeiro'  && <FinanceiroTab patientId={id} patient={patient} treatments={treatments} payments={payments} onRefresh={loadAll} />}
      {tab === 'evolucoes'   && <EvolusaoTab patientId={id} evolutions={evolutions} onRefresh={loadAll} />}

      {editing && <PatientForm initial={patient} onSave={handleEdit} onClose={() => setEditing(false)} />}
    </div>
  )
}
