import React, { useState } from 'react'
import { api } from '../../api'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'
import { exportPaymentsCSV } from '../../utils/print'

const FORMAS = {
  pix: 'PIX', dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  convenio: 'Convênio', cheque: 'Cheque',
}

function fmtR(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function today() { return new Date().toISOString().split('T')[0] }

export default function FinanceiroTab({ patientId, patient, treatments, payments, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ descricao: '', valor: '', data: today(), forma: 'pix' })
  const toast = useToast()

  const totalTrat = treatments.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
  const totalPago = payments.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const emAberto = Math.max(0, totalTrat - totalPago)

  const confirm = useConfirm()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.descricao.trim() || !form.valor || parseFloat(form.valor) <= 0) return
    try {
      await api.payments.create({ patientId, ...form, valor: parseFloat(form.valor) })
      toast('Pagamento registrado!', 'success')
      setShowForm(false)
      setForm({ descricao: '', valor: '', data: today(), forma: 'pix' })
      onRefresh()
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleDelete(id) {
    if (!await confirm('Remover este pagamento?')) return
    try { await api.payments.delete(id); onRefresh() }
    catch (e) { toast(e.message, 'error') }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 text-center">
          <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-1.5 uppercase tracking-wide">Total</p>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{fmtR(totalTrat)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">Pago</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{fmtR(totalPago)}</p>
        </div>
        <div className={`card p-4 text-center ${emAberto > 0 ? 'border-red-200 dark:border-red-900/40' : ''}`}>
          <p className={`text-xs font-semibold mb-1.5 uppercase tracking-wide ${emAberto > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>Em Aberto</p>
          <p className={`text-xl font-extrabold ${emAberto > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{fmtR(emAberto)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Histórico de Pagamentos</p>
        <div className="flex gap-2">
          {payments.length > 0 && (
            <button className="btn-secondary btn-sm" onClick={() => exportPaymentsCSV(patient, payments)}>⬇️ CSV</button>
          )}
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Registrar</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {payments.length === 0
          ? <Empty icon="💳" text="Nenhum pagamento registrado." />
          : payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.descricao}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.data)} · {FORMAS[p.forma] || p.forma}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{fmtR(parseFloat(p.valor))}</span>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                </div>
              </div>
            ))
        }
      </div>

      {showForm && (
        <Modal title="Registrar Pagamento" onClose={() => setShowForm(false)} onSave={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Descrição *</label>
              <input className="input mt-1.5" value={form.descricao} onChange={set('descricao')} placeholder="Ex: Parcela 1, Consulta inicial..." />
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input mt-1.5" type="number" min="0" step="0.01" value={form.valor} onChange={set('valor')} placeholder="0,00" />
            </div>
            <div>
              <label className="label">Data</label>
              <input className="input mt-1.5" type="date" value={form.data} onChange={set('data')} />
            </div>
            <div className="col-span-2">
              <label className="label">Forma de pagamento</label>
              <select className="input mt-1.5" value={form.forma} onChange={set('forma')}>
                {Object.entries(FORMAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
