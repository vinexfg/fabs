import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { BudgetRepository, TemplateRepository } from '../../infrastructure/http'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import Modal from '../Modal'
import { Empty } from '../../pages/Dashboard'
import OrcamentoPrint from './print/OrcamentoPrint'
import type { Patient, Budget, Template, ClinicSettings } from '../../types/entities'
import styles from './OrcamentoTab.module.css'

function fmtR(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

const STATUS_LABELS: Record<string, string> = { rascunho: 'Rascunho', aprovado: 'Aprovado', recusado: 'Recusado' }
const STATUS_STYLES: Record<string, string> = {
  rascunho: styles.badgeRascunho,
  aprovado: styles.badgeAprovado,
  recusado: styles.badgeRecusado,
}

interface ItemForm {
  proc: string
  dente: string
  valor: string
}

const EMPTY_ITEM: ItemForm = { proc: '', dente: '', valor: '' }

interface OrcamentoTabProps {
  patientId: string
  patient: Patient
  clinic: Partial<ClinicSettings>
}

export default function OrcamentoTab({ patientId, patient, clinic }: OrcamentoTabProps) {
  const [budgets, setBudgets]         = useState<Budget[]>([])
  const [templates, setTemplates]     = useState<Template[]>([])
  const [showForm, setShowForm]       = useState(false)
  const [editBudget, setEditBudget]   = useState<Budget | null>(null)
  const [printBudget, setPrintBudget] = useState<Budget | null>(null)
  const [items, setItems]             = useState<ItemForm[]>([{ ...EMPTY_ITEM }])
  const [desconto, setDesconto]       = useState('0')
  const [obs, setObs]                 = useState('')
  const orcamentoRef = useRef<HTMLDivElement>(null)
  const toast   = useToast()
  const confirm = useConfirm()

  const printOrcamento = useReactToPrint({ contentRef: orcamentoRef })

  useEffect(() => { load() }, [patientId])

  async function load() {
    try {
      const [b, t] = await Promise.all([
        BudgetRepository.findByPatient(patientId),
        TemplateRepository.findAll(),
      ])
      setBudgets(b)
      setTemplates(t)
    } catch { toast('Erro ao carregar orçamentos', 'error') }
  }

  function openNew() {
    setItems([{ ...EMPTY_ITEM }])
    setDesconto('0')
    setObs('')
    setEditBudget(null)
    setShowForm(true)
  }

  function openEdit(budget: Budget) {
    setItems(budget.items.length ? budget.items.map(i => ({ proc: i.proc, dente: i.dente || '', valor: String(i.valor) })) : [{ ...EMPTY_ITEM }])
    setDesconto(String(budget.desconto || 0))
    setObs(budget.obs || '')
    setEditBudget(budget)
    setShowForm(true)
  }

  function addItem() { setItems(it => [...it, { ...EMPTY_ITEM }]) }
  function removeItem(i: number) { setItems(it => it.filter((_, idx) => idx !== i)) }
  function setItem(i: number, k: keyof ItemForm, v: string) { setItems(it => it.map((item, idx) => idx === i ? { ...item, [k]: v } : item)) }

  function applyTemplate(i: number, tpl: Template) {
    setItem(i, 'proc', tpl.name)
    setItem(i, 'valor', String(tpl.valor))
  }

  async function handleSave() {
    const validItems = items.filter(it => it.proc.trim())
    if (validItems.length === 0) { toast('Adicione ao menos um procedimento', 'error'); return }
    const payload = { patientId, items: validItems.map(it => ({ ...it, valor: parseFloat(it.valor) || 0 })), desconto: parseFloat(desconto) || 0, obs }
    try {
      if (editBudget) {
        await BudgetRepository.update(editBudget.id, payload)
        toast('Orçamento atualizado!', 'success')
      } else {
        await BudgetRepository.create(payload)
        toast('Orçamento criado!', 'success')
      }
      setShowForm(false)
      load()
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleStatus(id: string, status: string) {
    try { await BudgetRepository.updateStatus(id, status); load() }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleDelete(id: string) {
    if (!await confirm('Remover este orçamento?')) return
    try { await BudgetRepository.remove(id); load() }
    catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  function handlePrint(budget: Budget) {
    setPrintBudget(budget)
    setTimeout(() => printOrcamento(), 50)
  }

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0)
  const total    = Math.max(0, subtotal - (parseFloat(desconto) || 0))

  return (
    <div>
      <div className={styles.header}>
        <p className={styles.headerTitle}>Orçamentos</p>
        <button className="btn-primary btn-sm" onClick={openNew}>+ Novo Orçamento</button>
      </div>

      {budgets.length === 0
        ? <Empty icon="📋" text="Nenhum orçamento criado." />
        : <div className={styles.list}>
            {budgets.map((budget, idx) => {
              const sub = (budget.items || []).reduce((s, i) => s + (Number(i.valor) || 0), 0)
              const tot = Math.max(0, sub - (Number(budget.desconto) || 0))
              return (
                <div key={budget.id} className={styles.budgetCard}>
                  <div className={styles.budgetHeader}>
                    <div>
                      <div className={styles.budgetMeta}>
                        <span className={`${styles.badge} ${STATUS_STYLES[budget.status]}`}>
                          {STATUS_LABELS[budget.status]}
                        </span>
                        <span className={styles.budgetNum}>Nº {budgets.length - idx}</span>
                        <span className={styles.budgetDate}>{budget.criadoEm?.slice(0, 10).split('-').reverse().join('/')}</span>
                      </div>
                      <p className={styles.budgetTotal}>{fmtR(tot)}</p>
                      <p className={styles.budgetCount}>{(budget.items || []).length} procedimento{(budget.items || []).length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className={styles.budgetActions}>
                      <button className="btn-secondary btn-sm" onClick={() => handlePrint(budget)}>🖨️</button>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(budget)}>✏️</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(budget.id)}>🗑️</button>
                    </div>
                  </div>

                  <div className={styles.itemList}>
                    {(budget.items || []).slice(0, 3).map((item, i) => (
                      <div key={i} className={styles.itemRow}>
                        <span className={styles.itemProc}>{item.proc}</span>
                        {item.dente && <span className={styles.itemDente}>{item.dente}</span>}
                        <span className={styles.itemValor}>{fmtR(Number(item.valor))}</span>
                      </div>
                    ))}
                    {(budget.items || []).length > 3 && (
                      <p className={styles.itemMore}>+{(budget.items || []).length - 3} procedimento{(budget.items || []).length - 3 !== 1 ? 's' : ''}...</p>
                    )}
                  </div>

                  <div className={styles.statusRow}>
                    {Object.entries(STATUS_LABELS).map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => handleStatus(budget.id, k)}
                        className={`${styles.statusBtn} ${budget.status === k ? STATUS_STYLES[k] : styles.statusBtnInactive}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
      }

      <div style={{ display: 'none' }}>
        <OrcamentoPrint
          ref={orcamentoRef}
          patient={patient}
          clinic={clinic}
          budget={printBudget}
          numero={printBudget ? budgets.length - budgets.findIndex(b => b.id === printBudget?.id) : ''}
        />
      </div>

      {showForm && (
        <Modal
          title={editBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          wide
        >
          <div className={styles.formSection}>
            <p className={styles.formLabel}>Procedimentos</p>
            {items.map((item, i) => (
              <div key={i} className={styles.itemFormRow}>
                <div className={styles.itemFormProc}>
                  <input
                    className="input"
                    placeholder="Procedimento..."
                    value={item.proc}
                    onChange={e => setItem(i, 'proc', e.target.value)}
                  />
                  {templates.length > 0 && (
                    <select className={styles.tplSelect} onChange={e => { const t = templates.find(t => t.id === e.target.value); if (t) applyTemplate(i, t) }} defaultValue="">
                      <option value="" disabled>Modelo...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>
                <input
                  className="input w-28"
                  placeholder="Dente"
                  value={item.dente}
                  onChange={e => setItem(i, 'dente', e.target.value)}
                />
                <input
                  className="input w-28"
                  type="number"
                  placeholder="R$"
                  min="0"
                  step="0.01"
                  value={item.valor}
                  onChange={e => setItem(i, 'valor', e.target.value)}
                />
                <button className="btn-danger btn-sm shrink-0" onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
              </div>
            ))}
            <button className={styles.addItemBtn} onClick={addItem}>+ Adicionar procedimento</button>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.formRow}>
              <div>
                <label className="label">Desconto (R$)</label>
                <input className="input mt-1.5 w-32" type="number" min="0" step="0.01" value={desconto} onChange={e => setDesconto(e.target.value)} />
              </div>
              <div className={styles.totalBox}>
                <p className={styles.totalLabel}>Total</p>
                <p className={styles.totalValue}>{fmtR(total)}</p>
                {parseFloat(desconto) > 0 && <p className={styles.totalSub}>Subtotal: {fmtR(subtotal)}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Observações</label>
              <textarea className="input mt-1.5 resize-none" rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Condições, parcelamento, validade..." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
