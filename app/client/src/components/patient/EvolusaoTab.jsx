import React, { useState } from 'react'
import { api } from '../../api'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function today() { return new Date().toISOString().split('T')[0] }

export default function EvolusaoTab({ patientId, evolutions, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ proc: '', data: today(), hora: '', notas: '', proxConsulta: '' })
  const toast = useToast()
  const confirm = useConfirm()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.proc.trim() || !form.data) return
    try {
      await api.evolutions.create({ patientId, ...form })
      toast('Evolução registrada!', 'success')
      setShowForm(false)
      setForm({ proc: '', data: today(), hora: '', notas: '', proxConsulta: '' })
      onRefresh()
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleDelete(id) {
    if (!await confirm('Remover esta evolução?')) return
    try { await api.evolutions.delete(id); onRefresh() }
    catch (e) { toast(e.message, 'error') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Evoluções por Consulta</p>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Nova Evolução</button>
      </div>

      {evolutions.length === 0
        ? <Empty icon="📝" text="Nenhuma evolução registrada." />
        : <div className="flex flex-col gap-3">
            {evolutions.map(e => (
              <div key={e.id} className="card p-5 border-l-4 border-l-blue-500 dark:border-l-blue-400 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold mb-1">
                      📅 {fmtDate(e.data)}{e.hora ? ` · ${e.hora}` : ''}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{e.proc}</p>
                  </div>
                  <button className="btn-danger btn-sm shrink-0" onClick={() => handleDelete(e.id)}>🗑️</button>
                </div>
                {e.notas && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {e.notas}
                  </p>
                )}
                {e.proxConsulta && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">
                      Próxima consulta: {fmtDate(e.proxConsulta)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
      }

      {showForm && (
        <Modal title="Nova Evolução" onClose={() => setShowForm(false)} onSave={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Procedimento realizado *</label>
              <input className="input mt-1.5" value={form.proc} onChange={set('proc')} placeholder="Ex: Limpeza, Restauração, Extração..." />
            </div>
            <div>
              <label className="label">Data *</label>
              <input className="input mt-1.5" type="date" value={form.data} onChange={set('data')} />
            </div>
            <div>
              <label className="label">Hora</label>
              <input className="input mt-1.5" type="time" value={form.hora} onChange={set('hora')} />
            </div>
            <div className="col-span-2">
              <label className="label">Notas / Evolução clínica</label>
              <textarea className="input mt-1.5 resize-none" rows={4} value={form.notas} onChange={set('notas')} placeholder="Queixas, observações, evolução do caso..." />
            </div>
            <div className="col-span-2">
              <label className="label">Próxima consulta</label>
              <input className="input mt-1.5" type="date" value={form.proxConsulta} onChange={set('proxConsulta')} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
