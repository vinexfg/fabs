import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PatientRepository, TreatmentRepository, PaymentRepository, EvolutionRepository, SettingsRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { SkeletonPatientHeader } from '../components/Skeleton'
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
import OrcamentoTab from '../components/patient/OrcamentoTab'
import styles from './PatientDetail.module.css'

const TABS = [
  { id: 'ficha',       label: 'Ficha',       icon: '📋' },
  { id: 'odontograma', label: 'Odontograma', icon: '🦷' },
  { id: 'tratamento',  label: 'Tratamento',  icon: '⚕️' },
  { id: 'financeiro',  label: 'Financeiro',  icon: '💰' },
  { id: 'evolucoes',   label: 'Evoluções',   icon: '📝' },
  { id: 'orcamento',   label: 'Orçamento',   icon: '📋' },
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

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast    = useToast()
  const confirm  = useConfirm()
  const { patientFileRef, receitaRef, atestadoRef, printPatientFile, printReceita, printAtestado } = usePrint()

  const [patient, setPatient]     = useState(null)
  const [treatments, setTreatments] = useState([])
  const [payments, setPayments]   = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [activeTab, setActiveTab] = useState('ficha')
  const [editing, setEditing]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [docModal, setDocModal]   = useState(null)
  const [clinic, setClinic]       = useState({})

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
    } catch (error) { toast(error.message, 'error') }
  }

  async function handleDelete() {
    const confirmed = await confirm(`Excluir "${patient.nome}"?\n\nTodos os dados serão removidos permanentemente.`)
    if (!confirmed) return
    try {
      await PatientRepository.remove(id)
      toast('Paciente excluído.')
      navigate('/pacientes')
    } catch (error) { toast(error.message, 'error') }
  }

  if (loading) return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/pacientes')}>← Voltar</button>
      <SkeletonPatientHeader />
    </div>
  )
  if (!patient) return null

  const initials       = patient.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const totalTreatments = treatments.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
  const totalPaid      = payments.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const amountOwed     = Math.max(0, totalTreatments - totalPaid)
  const completedTreatments = treatments.filter(t => t.status === 'concluido').length
  const whatsappPhone  = patient.telefone ? `55${patient.telefone.replace(/\D/g, '')}` : null
  const whatsappMessage = encodeURIComponent(`Olá ${patient.nome.split(' ')[0]}! Aqui é o consultório ${clinic.clinicName || 'DenteFácil'}.`)

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/pacientes')}>← Voltar</button>

      <div className={styles.headerCard}>
        <div className={styles.headerInner}>
          {patient.foto
            ? <img src={patient.foto} alt={patient.nome} className={styles.patientAvatar} />
            : <div className={styles.patientAvatarFallback}>{initials}</div>
          }
          <div className={styles.patientInfo}>
            <h1 className={styles.patientName}>{patient.nome}</h1>
            <p className={styles.patientMeta}>
              {patient.telefone
                ? <a href={`tel:${patient.telefone}`} className={styles.phoneLink}>{patient.telefone}</a>
                : 'Sem telefone'}
              {patient.dataNascimento ? ` · ${calculateAge(patient.dataNascimento)} anos` : ''}
              {patient.convenio ? ` · ${patient.convenio}` : ''}
            </p>
            <div className={styles.badgeRow}>
              {amountOwed > 0
                ? <Badge variant="red">💰 Em aberto: {formatCurrency(amountOwed)}</Badge>
                : <Badge variant="green">✓ Sem pendências</Badge>
              }
              {treatments.length > 0 && (
                <Badge variant="blue">🦷 {completedTreatments}/{treatments.length} procedimentos</Badge>
              )}
            </div>
            {totalTreatments > 0 && (
              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>Pagamento</span>
                  <span className={styles.progressPct}>
                    {Math.min(100, Math.round((totalPaid / totalTreatments) * 100))}%
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.min(100, (totalPaid / totalTreatments) * 100)}%` }}
                  />
                </div>
                <div className={styles.progressAmounts}>
                  <span>{formatCurrency(totalPaid)} pago</span>
                  <span>de {formatCurrency(totalTreatments)}</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.actions}>
            {whatsappPhone && (
              <a href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm" title="WhatsApp">
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

      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? styles.tabActive : styles.tab}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ficha'       && <FichaTab patient={patient} />}
      {activeTab === 'odontograma' && <OdontogramaTab patientId={id} />}
      {activeTab === 'tratamento'  && <TratamentoTab patientId={id} treatments={treatments} onRefresh={loadAll} />}
      {activeTab === 'financeiro'  && <FinanceiroTab patientId={id} patient={patient} clinic={clinic} treatments={treatments} payments={payments} onRefresh={loadAll} />}
      {activeTab === 'evolucoes'   && <EvolusaoTab patientId={id} evolutions={evolutions} onRefresh={loadAll} />}
      {activeTab === 'orcamento'   && <OrcamentoTab patientId={id} patient={patient} clinic={clinic} />}

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

      <div style={{ display: 'none' }}>
        <PatientFilePrint ref={patientFileRef} patient={patient} treatments={treatments} payments={payments} evolutions={evolutions} />
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
    isReceita ? printReceita() : printAtestado()
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
        <div className={styles.docContent}>
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
            <ReceitaPrint ref={receitaRef} patient={patient} clinic={clinic} medicines={medicines} instructions={instructions} />
          </div>
        </div>
      ) : (
        <div className={styles.docContent}>
          <div>
            <label className="label">Dias de atestado</label>
            <input className="input mt-1.5" type="number" min="1" value={days} onChange={e => setDays(e.target.value)} />
          </div>
          <div>
            <label className="label">Motivo (opcional)</label>
            <input className="input mt-1.5" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: pós-operatório de extração dentária" />
          </div>
          <div className={styles.docInfo}>
            O atestado será gerado em nome de <strong className="text-slate-700 dark:text-slate-300">{patient.nome}</strong> para {days} dia{+days !== 1 ? 's' : ''} de repouso.
          </div>
          <div style={{ display: 'none' }}>
            <AtestadoPrint ref={atestadoRef} patient={patient} clinic={clinic} days={days} reason={reason} />
          </div>
        </div>
      )}
    </Modal>
  )
}
