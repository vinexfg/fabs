import React, { useState, useEffect } from 'react'
import { TreatmentRepository, TemplateRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'

const STATUS = {
  pendente:     { label: 'Pendente',      dot: 'bg-slate-300 dark:bg-slate-600',   badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
  em_andamento: { label: 'Em andamento',  dot: 'bg-amber-400',                     badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  concluido:    { label: 'Concluído ✓',   dot: 'bg-emerald-500',                   badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
}

function fmtR(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function TratamentoTab({ patientId, treatments, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState({ proc: '', dente: '', valor: '', status: 'pendente', obs: '' })
  const toast = useToast()
  const confirm = useConfirm()

  const done = treatments.filter(t => t.status === 'concluido').length
  const total = treatments.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    TemplateRepository.findAll().then(setTemplates).catch(() => {})
  }, [])

  function applyTemplate(name) {
    setForm(f => ({ ...f, proc: name }))
    setShowTemplates(false)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.proc.trim()) return
    try {
      await TreatmentRepository.create({ patientId, ...form })
      toast('Procedimento adicionado!', 'success')
      setShowForm(false)
      setForm({ proc: '', dente: '', valor: '', status: 'pendente', obs: '' })
      onRefresh()
    } catch (error) { toast(error.message, 'error') }
  }

  async function handleStatus(treatmentId, status) {
    try { await TreatmentRepository.updateStatus(treatmentId, status); onRefresh() }
    catch (error) { toast(error.message, 'error') }
  }

  async function handleDelete(treatmentId) {
    if (!await confirm('Remover este procedimento?')) return
    try { await TreatmentRepository.remove(treatmentId); onRefresh() }
    catch (error) { toast(error.message, 'error') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Plano de Tratamento</p>
          {total > 0 && <p className="text-xs text-slate-400 mt-0.5">{done} de {total} concluídos · {pct}%</p>}
        </div>
        <div className="flex gap-2">
          {templates.length > 0 && (
            <button className="btn-secondary btn-sm" onClick={() => setShowTemplates(true)}>📋 Templates</button>
          )}
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Adicionar</button>
        </div>
      </div>

      {total > 0 && (
        <div className="mb-5">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {treatments.length === 0
        ? <Empty icon="🦷" text="Nenhum procedimento no plano de tratamento." />
        : <div className="flex flex-col gap-2">
            {treatments.map(treatment => (
              <div key={treatment.id} className="card px-4 py-3.5 flex items-center gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS[treatment.status]?.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{treatment.proc}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {treatment.dente ? `Dente ${treatment.dente}` : ''}
                    {treatment.dente && treatment.valor ? ' · ' : ''}
                    {treatment.valor ? fmtR(treatment.valor) : ''}
                    {(treatment.dente || treatment.valor) && treatment.obs ? ' · ' : ''}
                    {treatment.obs || ''}
                  </p>
                </div>
                <select
                  className={`text-xs px-2.5 py-1.5 rounded-lg border-0 cursor-pointer outline-none font-semibold ${STATUS[treatment.status]?.badge}`}
                  value={treatment.status}
                  onChange={e => handleStatus(treatment.id, e.target.value)}
                >
                  {Object.entries(STATUS).map(([statusValue, statusConfig]) => <option key={statusValue} value={statusValue}>{statusConfig.label}</option>)}
                </select>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(treatment.id)}>🗑️</button>
              </div>
            ))}
          </div>
      }

      {/* Template picker */}
      {showTemplates && (
        <Modal title="📋 Selecionar Template" onClose={() => setShowTemplates(false)} onSave={() => setShowTemplates(false)} saveLabel="Fechar">
          <div className="flex flex-wrap gap-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template.name)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-semibold rounded-xl transition-colors"
              >
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
