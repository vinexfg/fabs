import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaymentRepository, SettingsRepository } from '../infrastructure/http'
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
  const [tab, setTab] = useState('receitas')
  const [payments, setPayments] = useState([])
  const [inadimplentes, setInadimplentes] = useState([])
  const [clinic, setClinic] = useState({})
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [paymentList, inadimplentesList, clinicSettings] = await Promise.all([
        PaymentRepository.findAll(),
        PaymentRepository.findInadimplentes(),
        SettingsRepository.find(),
      ])
      setPayments(paymentList)
      setInadimplentes(inadimplentesList)
      setClinic(clinicSettings)
    }
    catch { toast('Erro ao carregar relatórios', 'error') }
    finally { setLoading(false) }
  }

  function buildWaLink(row) {
    const phone = (row.telefone || '').replace(/\D/g, '')
    if (!phone) return null
    const msg = encodeURIComponent(
      `Olá ${row.nome.split(' ')[0]}! 👋\n` +
      `Identificamos um saldo em aberto de *${fmtR(row.emAberto)}* referente ao seu tratamento` +
      `${clinic.clinicName ? ` em *${clinic.clinicName}*` : ''}.\n` +
      `Por favor, entre em contato para regularizar. Obrigado! 😊`
    )
    return `https://wa.me/55${phone}?text=${msg}`
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

  const totalInadimplencia = inadimplentes.reduce((s, r) => s + r.emAberto, 0)

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios Financeiros</h1>
          <p className="text-sm text-slate-400 mt-0.5">Visão geral das receitas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl mb-6 w-fit">
        {[
          { id: 'receitas', label: '💰 Receitas' },
          { id: 'inadimplencia', label: `⚠️ Inadimplência${inadimplentes.length > 0 ? ` (${inadimplentes.length})` : ''}` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150
              ${tab === t.id
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'inadimplencia' && (
        <InadimplenciaView
          rows={inadimplentes}
          total={totalInadimplencia}
          buildWaLink={buildWaLink}
        />
      )}

      {tab === 'receitas' && <>

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
      </>}
    </div>
  )
}

function InadimplenciaView({ rows, total, buildWaLink }) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-3 opacity-60">✅</div>
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhuma inadimplência!</p>
        <p className="text-sm text-slate-400 mt-1">Todos os pacientes estão com pagamentos em dia.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-2xl shrink-0">⚠️</div>
          <div>
            <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{rows.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Paciente{rows.length !== 1 ? 's' : ''} inadimplente{rows.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-2xl shrink-0">💸</div>
          <div>
            <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{fmtR(total)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Total em aberto</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Pacientes com saldo em aberto</h2>
          <button
            className="text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors"
            onClick={() => {
              const links = rows.filter(r => buildWaLink(r))
              links.forEach(r => window.open(buildWaLink(r), '_blank'))
            }}
          >
            💬 Cobrar todos por WhatsApp
          </button>
        </div>
        {rows.map(r => {
          const waLink = buildWaLink(r)
          const pct = r.totalTrat > 0 ? Math.round((r.totalPago / r.totalTrat) * 100) : 0
          return (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/pacientes/${r.id}`)}>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {r.nome}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {r.telefone || 'Sem telefone'}
                  {r.convenio ? ` · ${r.convenio}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">{pct}% pago</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-extrabold text-red-600 dark:text-red-400">{fmtR(r.emAberto)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">de {fmtR(r.totalTrat)}</p>
              </div>
              {waLink
                ? <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-sm bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full px-3 py-1.5 text-xs transition-colors shrink-0 shadow-sm shadow-green-500/30"
                  >
                    💬
                  </a>
                : <span className="w-8" />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
