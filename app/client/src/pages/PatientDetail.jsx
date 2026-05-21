import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import PatientForm from '../components/patient/PatientForm'
import FichaTab from '../components/patient/FichaTab'
import TratamentoTab from '../components/patient/TratamentoTab'
import FinanceiroTab from '../components/patient/FinanceiroTab'
import EvolusaoTab from '../components/patient/EvolusaoTab'
import OdontogramaTab from '../components/patient/OdontogramaTab'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { printPatientFile, printReceita, printAtestado } from '../utils/print'

const TABS = [
  { id: 'ficha',       label: 'Ficha',       icon: '📋' },
  { id: 'odontograma', label: 'Odontograma', icon: '🦷' },
  { id: 'tratamento',  label: 'Tratamento',  icon: '⚕️' },
  { id: 'financeiro',  label: 'Financeiro',  icon: '💰' },
  { id: 'evolucoes',   label: 'Evoluções',   icon: '📝' },
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
function fmtPhone(p) {
  return p.replace(/\D/g, '')
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [patient, setPatient] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [payments, setPayments] = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [tab, setTab] = useState('ficha')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [docModal, setDocModal] = useState(null) // 'receita' | 'atestado'
  const [clinic, setClinic] = useState({})

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    try {
      const [p, tr, py, ev, cl] = await Promise.all([
        api.patients.get(id),
        api.treatments.list(id),
        api.payments.list(id),
        api.evolutions.list(id),
        api.settings.get(),
      ])
      setPatient(p); setTreatments(tr); setPayments(py); setEvolutions(ev); setClinic(cl)
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
    if (!await confirm(`Excluir "${patient.nome}"?\n\nTodos os dados serão removidos permanentemente.`)) return
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

  const waPhone = patient.telefone ? `55${fmtPhone(patient.telefone)}` : null
  const waMsg = encodeURIComponent(`Olá ${patient.nome.split(' ')[0]}! Aqui é o consultório ${clinic.clinicName || 'DenteFácil'}.`)

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
          {patient.foto
            ? <img src={patient.foto} alt={patient.nome} className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-md" />
            : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-md shadow-blue-500/30">{initials}</div>
          }
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
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${waMsg}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-sm"
                title="WhatsApp"
              >
                💬 WhatsApp
              </a>
            )}
            <button className="btn-secondary btn-sm" onClick={() => setDocModal('receita')}>📄 Receita</button>
            <button className="btn-secondary btn-sm" onClick={() => setDocModal('atestado')}>📋 Atestado</button>
            <button className="btn-secondary btn-sm" onClick={() => printPatientFile(patient, treatments, payments, evolutions)}>🖨️ Ficha</button>
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

      {docModal && (
        <DocModal
          type={docModal}
          patient={patient}
          clinic={clinic}
          onClose={() => setDocModal(null)}
        />
      )}
    </div>
  )
}

function DocModal({ type, patient, clinic, onClose }) {
  const isReceita = type === 'receita'
  const [medicines, setMedicines] = useState('')
  const [instructions, setInstructions] = useState('')
  const [days, setDays] = useState('1')
  const [reason, setReason] = useState('')

  function handlePrint() {
    if (isReceita) printReceita(patient, clinic, medicines, instructions)
    else printAtestado(patient, clinic, days, reason)
    onClose()
  }

  return (
    <Modal
      title={isReceita ? '📄 Receituário' : '📋 Atestado Odontológico'}
      onClose={onClose}
      onSave={handlePrint}
      saveLabel="🖨️ Imprimir"
    >
      {isReceita ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Medicamentos prescritos</label>
            <textarea
              className="input mt-1.5 resize-none font-mono"
              rows={6}
              value={medicines}
              onChange={e => setMedicines(e.target.value)}
              placeholder={'1. Amoxicilina 500mg\n   Tomar 1 cápsula de 8 em 8h por 7 dias\n\n2. Dipirona 500mg\n   Tomar 1 comprimido se dor'}
            />
          </div>
          <div>
            <label className="label">Instruções adicionais</label>
            <textarea
              className="input mt-1.5 resize-none"
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Não ingerir álcool durante o tratamento..."
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Dias de atestado</label>
            <input
              className="input mt-1.5"
              type="number"
              min="1"
              value={days}
              onChange={e => setDays(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Motivo (opcional)</label>
            <input
              className="input mt-1.5"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: pós-operatório de extração dentária"
            />
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            O atestado será gerado em nome de <strong className="text-slate-700 dark:text-slate-300">{patient.nome}</strong> para {days} dia{+days !== 1 ? 's' : ''} de repouso.
          </div>
        </div>
      )}
    </Modal>
  )
}
