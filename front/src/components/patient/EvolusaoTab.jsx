import React, { useState } from 'react'
import { EvolutionRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'
import styles from './EvolusaoTab.module.css'

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function today() { return new Date().toISOString().split('T')[0] }

const EMPTY_FORM = { proc: '', data: today(), hora: '', notas: '', proxConsulta: '' }

export default function EvolusaoTab({ patientId, evolutions, onRefresh }) {
  const [showForm, setShowForm]   = useState(false)
  const [editEvo, setEditEvo]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editForm, setEditForm]   = useState(EMPTY_FORM)
  const toast   = useToast()
  const confirm = useConfirm()

  const set     = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setEdit = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.proc.trim() || !form.data) return
    try {
      await EvolutionRepository.create({ patientId, ...form })
      toast('Evolução registrada!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      onRefresh()
    } catch (error) { toast(error.message, 'error') }
  }

  function openEdit(evo) {
    setEditForm({ proc: evo.proc, data: evo.data || '', hora: evo.hora || '', notas: evo.notas || '', proxConsulta: evo.proxConsulta || '' })
    setEditEvo(evo)
  }

  async function handleEditSave() {
    if (!editForm.proc.trim() || !editForm.data) return
    try {
      await EvolutionRepository.update(editEvo.id, editForm)
      toast('Evolução atualizada!', 'success')
      setEditEvo(null)
      onRefresh()
    } catch (error) { toast(error.message, 'error') }
  }

  async function handleDelete(evolutionId) {
    if (!await confirm('Remover esta evolução?')) return
    try { await EvolutionRepository.remove(evolutionId); onRefresh() }
    catch (error) { toast(error.message, 'error') }
  }

  const formFields = (vals, setter) => (
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
        <label className="label">Notas / Evolução clínica</label>
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
          {formFields(form, set)}
        </Modal>
      )}

      {editEvo && (
        <Modal title="Editar Evolução" onClose={() => setEditEvo(null)} onSave={handleEditSave}>
          {formFields(editForm, setEdit)}
        </Modal>
      )}
    </div>
  )
}
