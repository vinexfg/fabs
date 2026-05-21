import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../context/ToastContext'

const FORMAS = {
  pix: 'PIX', dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  convenio: 'Convênio', cheque: 'Cheque',
}

function fmtR(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export default function Relatorios() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setPayments(await api.payments.all()) }
    catch { toast('Erro ao carregar pagamentos', 'error') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
      <span className="text-2xl animate-spin">⚙️</span>
      <span className="text-sm font-medium">Carregando...</span>
    </div>
  )

  const total = payments.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalMes = payments
    .filter(p => (p.data || '').startsWith(thisMonth))
    .reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)

  // Group by month
  const byMonth = {}
  payments.forEach(p => {
    const m = (p.data || '').slice(0, 7)
    if (!m) return
    byMonth[m] = (byMonth[m] || 0) + (parseFloat(p.valor) || 0)
  })
  const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  const maxVal = Math.max(...months.map(([, v]) => v), 1)

  // Group by forma
  const byForma = {}
  payments.forEach(p => {
    const f = p.forma || 'outro'
    byForma[f] = (byForma[f] || 0) + (parseFloat(p.valor) || 0)
  })
  const formaEntries = Object.entries(byForma).sort(([, a], [, b]) => b - a)

  // Recent payments
  const recent = [...payments]
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    .slice(0, 20)

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios Financeiros</h1>
        <p className="text-sm text-slate-400 mt-0.5">Visão geral das receitas</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">💰</div>
          <div>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{fmtR(total)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total recebido</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-2xl shrink-0">📅</div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{fmtR(totalMes)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Este mês</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-2xl shrink-0">🧾</div>
          <div>
            <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{payments.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pagamentos registrados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Bar chart */}
        <div className="col-span-2 card p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-5">Receita por Mês</h2>
          {months.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Nenhum pagamento registrado.</p>
            : (
              <div className="flex items-end gap-2 h-40">
                {months.map(([ym, val]) => (
                  <div key={ym} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate w-full text-center">
                      {fmtR(val).replace('R$\xa0', '')}
                    </span>
                    <div className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${Math.max(4, (val / maxVal) * 120)}px` }} />
                    <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                      {fmtMonth(ym)}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* By payment method */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Por Forma de Pagamento</h2>
          {formaEntries.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sem dados.</p>
            : <div className="flex flex-col gap-3">
                {formaEntries.map(([forma, val]) => {
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0
                  return (
                    <div key={forma}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{FORMAS[forma] || forma}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{fmtR(val)}</p>
                    </div>
                  )
                })}
              </div>
          }
        </div>
      </div>

      {/* Recent payments table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Pagamentos Recentes</h2>
        </div>
        {recent.length === 0
          ? <p className="text-sm text-slate-400 text-center py-8">Nenhum pagamento.</p>
          : recent.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.descricao}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.patientNome && <span className="font-medium text-blue-500 dark:text-blue-400">{p.patientNome} · </span>}
                    {(p.data || '').split('-').reverse().join('/')} · {FORMAS[p.forma] || p.forma}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{fmtR(parseFloat(p.valor))}</span>
              </div>
            ))
        }
      </div>
    </div>
  )
}
