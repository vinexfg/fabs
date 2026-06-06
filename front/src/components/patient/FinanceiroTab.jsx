import React, { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PaymentRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'
import { exportPaymentsCSV } from '../../utils/exportCsv'
import ReciboPrint from './print/ReciboPrint'
import styles from './FinanceiroTab.module.css'

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

export default function FinanceiroTab({ patientId, patient, clinic, treatments, payments, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ descricao: '', valor: '', data: today(), forma: 'pix' })
  const [printPayment, setPrintPayment] = useState(null)
  const reciboRef = useRef()
  const toast = useToast()
  const confirm = useConfirm()

  const printRecibo = useReactToPrint({ contentRef: reciboRef })

  const totalTrat = treatments.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
  const totalPago = payments.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const emAberto = Math.max(0, totalTrat - totalPago)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.descricao.trim() || !form.valor || parseFloat(form.valor) <= 0) return
    try {
      await PaymentRepository.create({ patientId, ...form, valor: parseFloat(form.valor) })
      toast('Pagamento registrado!', 'success')
      setShowForm(false)
      setForm({ descricao: '', valor: '', data: today(), forma: 'pix' })
      onRefresh()
    } catch (error) { toast(error.message, 'error') }
  }

  async function handleDelete(paymentId) {
    if (!await confirm('Remover este pagamento?')) return
    try { await PaymentRepository.remove(paymentId); onRefresh() }
    catch (error) { toast(error.message, 'error') }
  }

  function handlePrintRecibo(payment) {
    setPrintPayment(payment)
    setTimeout(() => printRecibo(), 50)
  }

  return (
    <div>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={`${styles.summaryLabel} text-blue-500 dark:text-blue-400`}>Total</p>
          <p className={`${styles.summaryValue} text-blue-600 dark:text-blue-400`}>{fmtR(totalTrat)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={`${styles.summaryLabel} text-emerald-500 dark:text-emerald-400`}>Pago</p>
          <p className={`${styles.summaryValue} text-emerald-600 dark:text-emerald-400`}>{fmtR(totalPago)}</p>
        </div>
        <div className={emAberto > 0 ? styles.summaryCardDebt : styles.summaryCard}>
          <p className={`${styles.summaryLabel} ${emAberto > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400'}`}>Em Aberto</p>
          <p className={`${styles.summaryValue} ${emAberto > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>{fmtR(emAberto)}</p>
        </div>
      </div>

      <div className={styles.tableHeader}>
        <p className={styles.tableTitle}>Histórico de Pagamentos</p>
        <div className={styles.tableActions}>
          {payments.length > 0 && (
            <button className="btn-secondary btn-sm" onClick={() => exportPaymentsCSV(patient, payments)}>⬇️ CSV</button>
          )}
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Registrar</button>
        </div>
      </div>

      <div className={styles.tableCard}>
        {payments.length === 0
          ? <Empty icon="💳" text="Nenhum pagamento registrado." />
          : payments.map(payment => (
              <div key={payment.id} className={styles.tableRow}>
                <div>
                  <p className={styles.tableRowName}>{payment.descricao}</p>
                  <p className={styles.tableRowMeta}>{fmtDate(payment.data)} · {FORMAS[payment.forma] || payment.forma}</p>
                </div>
                <div className={styles.tableRowRight}>
                  <span className={styles.tableRowValue}>{fmtR(parseFloat(payment.valor))}</span>
                  <button className="btn-secondary btn-sm" title="Imprimir recibo" onClick={() => handlePrintRecibo(payment)}>🖨️</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(payment.id)}>🗑️</button>
                </div>
              </div>
            ))
        }
      </div>

      <div style={{ display: 'none' }}>
        <ReciboPrint ref={reciboRef} patient={patient} clinic={clinic} payment={printPayment} />
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
