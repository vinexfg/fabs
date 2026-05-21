import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PatientRepository, TreatmentRepository, PaymentRepository, EvolutionRepository, SettingsRepository } from '../infrastructure/http'
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
import PatientFilePrint from '../components/patient/print/PatientFilePrint'
import ReceitaPrint from '../components/patient/print/ReceitaPrint'
import AtestadoPrint from '../components/patient/print/AtestadoPrint'
import { usePrint } from '../components/patient/print/usePrint'

const TABS = [
  { id: 'ficha',       label: 'Ficha',       icon: '📋' },
  { id: 'odontograma', label: 'Odontograma', icon: '🦷' },
  { id: 'tratamento',  label: 'Tratamento',  icon: '⚕️' },
  { id: 'financeiro',  label: 'Financeiro',  icon: '💰' },
  { id: 'evolucoes',   label: 'Evoluções',   icon: '📝' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function calculateAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  if (hasNotHadBirthdayYet) age--
  return age
}

function stripNonDigits(phoneNumber) {
  return phoneNumber.replace(/\D/g, '')
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const { patientFileRef, receitaRef, atestadoRef, printPatientFile, printReceita, printAtestado } = usePrint()

  const [patient, setPatient] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [payments, setPayments] = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [activeTab, setActiveTab] = useState('ficha')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [docModal, setDocModal] = useState(null) // 'receita' | 'atestado'
  const [clinic, setClinic] = useState({})

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    try {
      const [patientData, treatmentList, paymentList, evolutionList, clinicSettings] = await Promise.all([
        PatientRepository.findById(id),
        TreatmentRepository.findByPatient(id),
        PaymentRepository.findByPatient(id),
        EvolutionRepository.findByPatient(id),
        SettingsRepository.find(),
      ])
      setPatient(patientData)
      setTreatments(treatmentList)
      setPayments(paymentList)
      setEvolutions(evolutionList)
      setClinic(clinicSettings)
    } catch {
      toast('Erro ao carregar paciente', 'error')
      navigate('/pacientes')
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(data) {
    try {
      const updated = await PatientRepository.update(id, data)
      setPatient(updated)
      toast('Dados atualizados!', 'success')
      setEditing(false)
    } catch (error) {
      toast(error.message, 'error')
    }
  }

  async function handleDelete() {
    const confirmed = await confirm(`Excluir "${patient.nome}"?\n\nTodos os dados serão removidos permanentemente.`)
    if (!confirmed) return
    try {
      await PatientRepository.remove(id)
      toast('Paciente excluído.')
      navigate('/pacientes')
    } catch (error) {
      toast(error.message, 'error')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
      <span className="text-2xl animate-spin">⚙️</span>
      <span className="text-sm font-medium">Carregando...</span>
    </div>
  )
  if (!patient) return null

  const initials = patient.nome.split(' ').map(namePart => namePart[0]).slice(0, 2).join('').toUpperCase()
  const totalTreatments = treatments.reduce((sum, treatment) => sum + (parseFloat(treatment.valor) || 0), 0)
  const totalPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.valor) || 0), 0)
  const amountOwed = Math.max(0, totalTreatments - totalPaid)
  const completedTreatments = treatments.filter(treatment => treatment.status === 'concluido').length

  const whatsappPhone = patient.telefone ? `55${stripNonDigits(patient.telefone)}` : null
  const whatsappMessage = encodeURIComponent(`Olá ${patient.nome.split(' ')[0]}! Aqui é o consultório ${clinic.clinicName || 'DenteFácil'}.`)

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
              {patient.dataNascimento ? ` · ${calculateAge(patient.dataNascimento)} anos` : ''}
              {patient.convenio ? ` · ${patient.convenio}` : ''}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {amountOwed > 0
                ? <Badge variant="red">💰 Em aberto: {formatCurrency(amountOwed)}</Badge>
                : <Badge variant="green">✓ Sem pendências</Badge>
              }
              {treatments.length > 0 && (
                <Badge variant="blue">🦷 {completedTreatments}/{treatments.length} procedimentos</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
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
            <button className="btn-secondary btn-sm" onClick={printPatientFile}>🖨️ Ficha</button>
            <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Editar</button>
            <button className="btn-danger" onClick={handleDelete}>🗑️</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ficha'       && <FichaTab patient={patient} />}
      {activeTab === 'odontograma' && <OdontogramaTab patientId={id} />}
      {activeTab === 'tratamento'  && <TratamentoTab patientId={id} treatments={treatments} onRefresh={loadAll} />}
      {activeTab === 'financeiro'  && <FinanceiroTab patientId={id} patient={patient} treatments={treatments} payments={payments} onRefresh={loadAll} />}
      {activeTab === 'evolucoes'   && <EvolusaoTab patientId={id} evolutions={evolutions} onRefresh={loadAll} />}

      {editing && <PatientForm initial={patient} onSave={handleEdit} onClose={() => setEditing(false)} />}

      {docModal && (
        <DocModal
          type={docModal}
          patient={patient}
          clinic={clinic}
          receitaRef={receitaRef}
          atestadoRef={atestadoRef}
          printReceita={printReceita}
          printAtestado={printAtestado}
          onClose={() => setDocModal(null)}
        />
      )}

      {/* Hidden print components — rendered in DOM but invisible, activated by usePrint */}
      <div style={{ display: 'none' }}>
        <PatientFilePrint
          ref={patientFileRef}
          patient={patient}
          treatments={treatments}
          payments={payments}
          evolutions={evolutions}
        />
      </div>
    </div>
  )
}

function DocModal({ type, patient, clinic, receitaRef, atestadoRef, printReceita, printAtestado, onClose }) {
  const isReceita = type === 'receita'
  const [medicines, setMedicines] = useState('')
  const [instructions, setInstructions] = useState('')
  const [days, setDays] = useState('1')
  const [reason, setReason] = useState('')

  function handlePrint() {
    if (isReceita) {
      printReceita()
    } else {
      printAtestado()
    }
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
          <div style={{ display: 'none' }}>
            <ReceitaPrint
              ref={receitaRef}
              patient={patient}
              clinic={clinic}
              medicines={medicines}
              instructions={instructions}
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
          <div style={{ display: 'none' }}>
            <AtestadoPrint
              ref={atestadoRef}
              patient={patient}
              clinic={clinic}
              days={days}
              reason={reason}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
