import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PaymentRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../Empty'
import { exportPaymentsCSV } from '../../utils/exportCsv'
import ReciboPrint from './print/ReciboPrint'
import type { Patient, Treatment, Payment, ClinicSettings } from '../../types/entities'
import styles from './FinanceiroTab.module.css'

const FORMAS: Record<string, string> = {
  pix: 'PIX', dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  convenio: 'Convênio', cheque: 'Cheque',
}

function fmtR(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function today() { return new Date().toISOString().split('T')[0] }

interface PaymentForm {
  descricao: string
  valor: string
  data: string
  forma: string
}

const EMPTY_FORM: PaymentForm = { descricao: '', valor: '', data: today(), forma: 'pix' }

interface FinanceiroTabProps {
  patientId: string
  patient: Patient
  clinic: Partial<ClinicSettings>
  treatments: Treatment[]
  payments: Payment[]
  onRefresh: () => void
}

export default function FinanceiroTab({ patientId, patient, clinic, treatments, payments, onRefresh }: FinanceiroTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [form, setForm] = useState<PaymentForm>(EMPTY_FORM)
  const [editForm, setEditForm] = useState<PaymentForm>({ descricao: '', valor: '', data: '', forma: 'pix' })
  const [printPayment, setPrintPayment] = useState<Payment | null>(null)
  const reciboRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const confirm = useConfirm()

  const printRecibo = useReactToPrint({ contentRef: reciboRef })

  const totalTrat = treatments.reduce((s, t) => s + (Number(t.valor) || 0), 0)
  const totalPago = payments.reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const emAberto = Math.max(0, totalTrat - totalPago)

  const set = (k: keyof PaymentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.descricao.trim() || !form.valor || parseFloat(form.valor) <= 0) return
    try {
      await PaymentRepository.create({ patientId, ...form, valor: parseFloat(form.valor) })
      toast('Pagamento registrado!', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      onRefresh()
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleDelete(paymentId: string) {
    if (!await confirm('Remover este pagamento?')) return
    try { await PaymentRepository.remove(paymentId); onRefresh() }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  function handlePrintRecibo(payment: Payment) {
    setPrintPayment(payment)
    setTimeout(() => printRecibo(), 50)
  }

  function openEdit(payment: Payment) {
    setEditForm({ descricao: payment.descricao, valor: String(payment.valor), data: payment.data || '', forma: payment.forma || 'pix' })
    setEditPayment(payment)
  }

  async function handleEditSave() {
    if (!editPayment || !editForm.descricao.trim() || !editForm.valor || parseFloat(editForm.valor) <= 0) return
    try {
      await PaymentRepository.update(editPayment.id, { patientId, ...editForm, valor: parseFloat(editForm.valor) })
      toast('Pagamento atualizado!', 'success')
      setEditPayment(null)
      onRefresh()
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
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
                  <p className={styles.tableRowMeta}>{fmtDate(payment.data)} · {FORMAS[payment.forma || ''] || payment.forma}</p>
                </div>
                <div className={styles.tableRowRight}>
                  <span className={styles.tableRowValue}>{fmtR(Number(payment.valor))}</span>
                  <button className="btn-secondary btn-sm" title="Imprimir recibo" onClick={() => handlePrintRecibo(payment)}>🖨️</button>
                  <button className="btn-secondary btn-sm" title="Editar" onClick={() => openEdit(payment)}>✏️</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(payment.id)}>🗑️</button>
                </div>
              </div>
            ))
        }
      </div>

      <div style={{ display: 'none' }}>
        <ReciboPrint ref={reciboRef} patient={patient} clinic={clinic} payment={printPayment} />
      </div>

      {editPayment && (
        <Modal title="Editar Pagamento" onClose={() => setEditPayment(null)} onSave={handleEditSave}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Descrição *</label>
              <input className="input mt-1.5" value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input mt-1.5" type="number" min="0" step="0.01" value={editForm.valor} onChange={e => setEditForm(f => ({ ...f, valor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Data</label>
              <input className="input mt-1.5" type="date" value={editForm.data} onChange={e => setEditForm(f => ({ ...f, data: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Forma de pagamento</label>
              <select className="input mt-1.5" value={editForm.forma} onChange={e => setEditForm(f => ({ ...f, forma: e.target.value }))}>
                {Object.entries(FORMAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

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
