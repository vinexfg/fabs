import { useState, useEffect } from 'react'
import { TreatmentRepository, TemplateRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../Empty'
import { TREATMENT_STATUS as STATUS } from '../../utils/treatmentStatus'
import type { Treatment, Template } from '../../types/entities'
import styles from './TratamentoTab.module.css'

function fmtR(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

interface TreatmentForm {
  proc: string
  dente: string
  valor: string
  status: string
  obs: string
}

const EMPTY_FORM: TreatmentForm = { proc: '', dente: '', valor: '', status: 'pendente', obs: '' }

interface TratamentoTabProps {
  patientId: string
  treatments: Treatment[]
  onRefresh: () => void
}

export default function TratamentoTab({ patientId, treatments, onRefresh }: TratamentoTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [form, setForm] = useState<TreatmentForm>(EMPTY_FORM)
  const toast = useToast()
  const confirm = useConfirm()

  const done = treatments.filter(t => t.status === 'concluido').length
  const total = treatments.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const set = (k: keyof TreatmentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    TemplateRepository.findAll().then(setTemplates).catch(() => {})
  }, [])

  function applyTemplate(name: string) {
    setForm(f => ({ ...f, proc: name }))
    setShowTemplates(false)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.proc.trim()) return
    try {
      await TreatmentRepository.create({ patientId, ...form, valor: parseFloat(form.valor) || 0 })
      toast('Procedimento adicionado!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      onRefresh()
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleStatus(treatmentId: string, status: string) {
    try { await TreatmentRepository.updateStatus(treatmentId, status); onRefresh() }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleDelete(treatmentId: string) {
    if (!await confirm('Remover este procedimento?')) return
    try { await TreatmentRepository.remove(treatmentId); onRefresh() }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.headerTitle}>Plano de Tratamento</p>
          {total > 0 && <p className={styles.headerSubtitle}>{done} de {total} concluídos · {pct}%</p>}
        </div>
        <div className={styles.headerActions}>
          {templates.length > 0 && (
            <button className="btn-secondary btn-sm" onClick={() => setShowTemplates(true)}>📋 Templates</button>
          )}
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Adicionar</button>
        </div>
      </div>

      {total > 0 && (
        <div className={styles.progressWrapper}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {treatments.length === 0
        ? <Empty icon="🦷" text="Nenhum procedimento no plano de tratamento." />
        : <div className={styles.list}>
            {treatments.map(treatment => (
              <div key={treatment.id} className={styles.treatRow}>
                <div className={`${styles.treatDot} ${STATUS[treatment.status]?.dot}`} />
                <div className={styles.treatInfo}>
                  <p className={styles.treatName}>{treatment.proc}</p>
                  <p className={styles.treatMeta}>
                    {treatment.dente ? `Dente ${treatment.dente}` : ''}
                    {treatment.dente && treatment.valor ? ' · ' : ''}
                    {treatment.valor ? fmtR(treatment.valor) : ''}
                    {(treatment.dente || treatment.valor) && treatment.obs ? ' · ' : ''}
                    {treatment.obs || ''}
                  </p>
                </div>
                <select
                  className={`${styles.statusSelect} ${STATUS[treatment.status]?.badge}`}
                  value={treatment.status}
                  onChange={e => handleStatus(treatment.id, e.target.value)}
                >
                  {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                </select>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(treatment.id)}>🗑️</button>
              </div>
            ))}
          </div>
      }

      {showTemplates && (
        <Modal title="📋 Selecionar Template" onClose={() => setShowTemplates(false)} onSave={() => setShowTemplates(false)} saveLabel="Fechar">
          <div className={styles.templateGrid}>
            {templates.map(template => (
              <button key={template.id} className={styles.templateBtn} onClick={() => applyTemplate(template.name)}>
                {template.name}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal title="Adicionar Procedimento" onClose={() => setShowForm(false)} onSave={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Procedimento *</label>
              <input className="input mt-1.5" value={form.proc} onChange={set('proc')} placeholder="Ex: Extração, Canal, Implante..." autoFocus />
            </div>
            <div>
              <label className="label">Número do dente</label>
              <input className="input mt-1.5" value={form.dente} onChange={set('dente')} placeholder="Ex: 36" />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input mt-1.5" type="number" min="0" step="0.01" value={form.valor} onChange={set('valor')} placeholder="0,00" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input mt-1.5" value={form.status} onChange={set('status')}>
                {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <textarea className="input mt-1.5 resize-none" rows={2} value={form.obs} onChange={set('obs')} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
