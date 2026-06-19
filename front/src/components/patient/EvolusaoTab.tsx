import { useState } from 'react'
import { EvolutionRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'
import type { Evolution } from '../../types/entities'
import styles from './EvolusaoTab.module.css'

const EVO_TEMPLATES = [
  { label: 'Sem queixas', text: 'Paciente compareceu sem queixas. Procedimento realizado com sucesso. Paciente tolerou bem.' },
  { label: 'Anestesia', text: 'Realizada anestesia local infiltrativa sem intercorrências. Paciente sem intercorrências anestésicas.' },
  { label: 'Boa evolução', text: 'Paciente apresentou boa evolução clínica desde a última consulta. Sem sinais de infecção ou inflamação.' },
  { label: 'Sensível', text: 'Paciente relata sensibilidade leve ao procedimento. Orientado sobre uso de analgésico e retorno em caso de piora.' },
  { label: 'Pós-op', text: 'Orientações pós-operatórias fornecidas: repouso, dieta pastosa, higiene local cuidadosa e uso de medicação conforme prescrição.' },
  { label: 'Retorno', text: 'Paciente retornou para avaliação. Evolução satisfatória. Agendado retorno para continuidade do tratamento.' },
  { label: 'Endodontia', text: 'Realizado acesso endodôntico e instrumentação dos canais. Curativo de demora realizado. Paciente orientado sobre sintomatologia esperada.' },
  { label: 'Exodontia', text: 'Exodontia realizada sem intercorrências. Sutura realizada. Orientações pós-operatórias fornecidas. Retorno agendado para remoção de sutura.' },
]

function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function today() { return new Date().toISOString().split('T')[0] }

interface EvolutionForm {
  proc: string
  data: string
  hora: string
  notas: string
  proxConsulta: string
}

const EMPTY_FORM: EvolutionForm = { proc: '', data: today(), hora: '', notas: '', proxConsulta: '' }

interface EvolusaoTabProps {
  patientId: string
  evolutions: Evolution[]
  onRefresh: () => void
}

export default function EvolusaoTab({ patientId, evolutions, onRefresh }: EvolusaoTabProps) {
  const [showForm, setShowForm]   = useState(false)
  const [editEvo, setEditEvo]     = useState<Evolution | null>(null)
  const [form, setForm]           = useState<EvolutionForm>(EMPTY_FORM)
  const [editForm, setEditForm]   = useState<EvolutionForm>(EMPTY_FORM)
  const toast   = useToast()
  const confirm = useConfirm()

  const set     = (k: keyof EvolutionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setEdit = (k: keyof EvolutionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.proc.trim() || !form.data) return
    try {
      await EvolutionRepository.create({ patientId, ...form })
      toast('Evolução registrada!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      onRefresh()
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  function openEdit(evo: Evolution) {
    setEditForm({ proc: evo.proc, data: evo.data || '', hora: evo.hora || '', notas: evo.notas || '', proxConsulta: evo.proxConsulta || '' })
    setEditEvo(evo)
  }

  async function handleEditSave() {
    if (!editEvo || !editForm.proc.trim() || !editForm.data) return
    try {
      await EvolutionRepository.update(editEvo.id, { patientId, ...editForm })
      toast('Evolução atualizada!', 'success')
      setEditEvo(null)
      onRefresh()
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleDelete(evolutionId: string) {
    if (!await confirm('Remover esta evolução?')) return
    try { await EvolutionRepository.remove(evolutionId); onRefresh() }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  const formFields = (
    vals: EvolutionForm,
    setter: (k: keyof EvolutionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
    setterFn: React.Dispatch<React.SetStateAction<EvolutionForm>>,
  ) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="label">Procedimento realizado *</label>
        <input className="input mt-1.5" value={vals.proc} onChange={setter('proc')} placeholder="Ex: Limpeza, Restauração, Extração..." />
      </div>
      <div>
        <label className="label">Data *</label>
        <input className="input mt-1.5" type="date" value={vals.data} onChange={setter('data')} />
      </div>
      <div>
        <label className="label">Hora</label>
        <input className="input mt-1.5" type="time" value={vals.hora} onChange={setter('hora')} />
      </div>
      <div className="col-span-2">
        <div className={styles.tplRow}>
          <label className="label">Notas / Evolução clínica</label>
          <div className={styles.tplBtns}>
            {EVO_TEMPLATES.map(t => (
              <button
                key={t.label}
                type="button"
                className={styles.tplBtn}
                onClick={() => setterFn(f => ({ ...f, notas: f.notas ? f.notas + '\n' + t.text : t.text }))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <textarea className="input mt-1.5 resize-none" rows={4} value={vals.notas} onChange={setter('notas')} placeholder="Queixas, observações, evolução do caso..." />
      </div>
      <div className="col-span-2">
        <label className="label">Próxima consulta</label>
        <input className="input mt-1.5" type="date" value={vals.proxConsulta} onChange={setter('proxConsulta')} />
      </div>
    </div>
  )

  return (
    <div>
      <div className={styles.header}>
        <p className={styles.headerTitle}>Evoluções por Consulta</p>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Nova Evolução</button>
      </div>

      {evolutions.length === 0
        ? <Empty icon="📝" text="Nenhuma evolução registrada." />
        : <div className={styles.list}>
            {evolutions.map(evolution => (
              <div key={evolution.id} className={styles.evoCard}>
                <div className={styles.evoCardHeader}>
                  <div>
                    <p className={styles.evoDate}>
                      📅 {fmtDate(evolution.data)}{evolution.hora ? ` · ${evolution.hora}` : ''}
                    </p>
                    <p className={styles.evoTitle}>{evolution.proc}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(evolution)}>✏️</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(evolution.id)}>🗑️</button>
                  </div>
                </div>
                {evolution.notas && <p className={styles.evoNotes}>{evolution.notas}</p>}
                {evolution.proxConsulta && (
                  <div className={styles.evoNextRow}>
                    <span className={styles.evoNextLabel}>
                      Próxima consulta: {fmtDate(evolution.proxConsulta)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
      }

      {showForm && (
        <Modal title="Nova Evolução" onClose={() => setShowForm(false)} onSave={handleSave}>
          {formFields(form, set, setForm)}
        </Modal>
      )}

      {editEvo && (
        <Modal title="Editar Evolução" onClose={() => setEditEvo(null)} onSave={handleEditSave}>
          {formFields(editForm, setEdit, setEditForm)}
        </Modal>
      )}
    </div>
  )
}
