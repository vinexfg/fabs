import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PaymentRepository, SettingsRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import styles from './Relatorios.module.css'

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
  const [tab, setTab]                   = useState('receitas')
  const [payments, setPayments]         = useState([])
  const [inadimplentes, setInadimplentes] = useState([])
  const [clinic, setClinic]             = useState({})
  const [loading, setLoading]           = useState(true)
  const [filterFrom, setFilterFrom]     = useState('')
  const [filterTo, setFilterTo]         = useState('')
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
    <div className={styles.loading}>
      <span className={styles.loadingIcon}>⚙️</span>
      <span className={styles.loadingText}>Carregando...</span>
    </div>
  )

  const filtered = payments.filter(p => {
    const d = p.data || ''
    if (filterFrom && d < filterFrom) return false
    if (filterTo   && d > filterTo)   return false
    return true
  })

  const total    = filtered.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalMes = filtered.filter(p => (p.data || '').startsWith(thisMonth)).reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)

  const byMonth = {}
  filtered.forEach(p => {
    const m = (p.data || '').slice(0, 7)
    if (!m) return
    byMonth[m] = (byMonth[m] || 0) + (parseFloat(p.valor) || 0)
  })
  const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  const maxVal = Math.max(...months.map(([, v]) => v), 1)

  const byForma = {}
  filtered.forEach(p => {
    const f = p.forma || 'outro'
    byForma[f] = (byForma[f] || 0) + (parseFloat(p.valor) || 0)
  })
  const formaEntries = Object.entries(byForma).sort(([, a], [, b]) => b - a)

  const recent = [...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 20)
  const totalInadimplencia = inadimplentes.reduce((s, r) => s + r.emAberto, 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatórios Financeiros</h1>
          <p className={styles.subtitle}>Visão geral das receitas</p>
        </div>
      </div>

      <div className={styles.tabBar}>
        {[
          { id: 'receitas', label: '💰 Receitas' },
          { id: 'inadimplencia', label: `⚠️ Inadimplência${inadimplentes.length > 0 ? ` (${inadimplentes.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? styles.tabActive : styles.tab}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'inadimplencia' && (
        <InadimplenciaView rows={inadimplentes} total={totalInadimplencia} buildWaLink={buildWaLink} />
      )}

      {tab === 'receitas' && (
        <>
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>Período:</span>
            <input
              type="date"
              className="input"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
            />
            <span className={styles.filterSep}>até</span>
            <input
              type="date"
              className="input"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
            />
            {(filterFrom || filterTo) && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => { setFilterFrom(''); setFilterTo('') }}
              >
                Limpar
              </button>
            )}
            {(filterFrom || filterTo) && (
              <span className={styles.filterCount}>
                {filtered.length} pagamento{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} bg-blue-50 dark:bg-blue-500/10`}>💰</div>
              <div>
                <p className={`${styles.statValue} text-blue-600 dark:text-blue-400`}>{fmtR(total)}</p>
                <p className={styles.statLabel}>Total recebido</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} bg-emerald-50 dark:bg-emerald-500/10`}>📅</div>
              <div>
                <p className={`${styles.statValue} text-emerald-600 dark:text-emerald-400`}>{fmtR(totalMes)}</p>
                <p className={styles.statLabel}>Este mês</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} bg-violet-50 dark:bg-violet-500/10`}>🧾</div>
              <div>
                <p className={`${styles.statValue} text-violet-600 dark:text-violet-400`}>{payments.length}</p>
                <p className={styles.statLabel}>Pagamentos registrados</p>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Receita por Mês</h2>
              {months.length === 0
                ? <p className={styles.chartEmpty}>Nenhum pagamento registrado.</p>
                : (
                  <div className={styles.chartBars}>
                    {months.map(([ym, val]) => (
                      <div key={ym} className={styles.chartBarCol}>
                        <span className={styles.chartBarValue}>{fmtR(val).replace('R$\xa0', '')}</span>
                        <div className={styles.chartBarFill} style={{ height: `${Math.max(4, (val / maxVal) * 120)}px` }} />
                        <span className={styles.chartBarLabel}>{fmtMonth(ym)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            <div className={styles.methodCard}>
              <h2 className={styles.methodTitle}>Por Forma de Pagamento</h2>
              {formaEntries.length === 0
                ? <p className={styles.chartEmpty}>Sem dados.</p>
                : <div className={styles.methodList}>
                    {formaEntries.map(([forma, val]) => {
                      const pct = total > 0 ? Math.round((val / total) * 100) : 0
                      return (
                        <div key={forma}>
                          <div className={styles.methodHeader}>
                            <span className={styles.methodName}>{FORMAS[forma] || forma}</span>
                            <span className={styles.methodPct}>{pct}%</span>
                          </div>
                          <div className={styles.methodTrack}>
                            <div className={styles.methodFill} style={{ width: `${pct}%` }} />
                          </div>
                          <p className={styles.methodAmount}>{fmtR(val)}</p>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHeaderRow}>
              <h2 className={styles.tableTitle}>Pagamentos Recentes</h2>
            </div>
            {recent.length === 0
              ? <p className={styles.tableEmpty}>Nenhum pagamento.</p>
              : recent.map(p => (
                  <div key={p.id} className={styles.tableRow}>
                    <div>
                      <p className={styles.tableRowName}>{p.descricao}</p>
                      <p className={styles.tableRowMeta}>
                        {p.patientNome && <span className={styles.tableRowPatient}>{p.patientNome} · </span>}
                        {(p.data || '').split('-').reverse().join('/')} · {FORMAS[p.forma] || p.forma}
                      </p>
                    </div>
                    <span className={styles.tableRowValue}>{fmtR(parseFloat(p.valor))}</span>
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  )
}

function InadimplenciaView({ rows, total, buildWaLink }) {
  const navigate = useNavigate()

  if (rows.length === 0) {
    return (
      <div className={styles.inadEmpty}>
        <div className={styles.inadEmptyIcon}>✅</div>
        <p className={styles.inadEmptyTitle}>Nenhuma inadimplência!</p>
        <p className={styles.inadEmptyText}>Todos os pacientes estão com pagamentos em dia.</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.inadGrid}>
        <div className={styles.inadCard}>
          <div className={`${styles.statIcon} bg-red-50 dark:bg-red-500/10`}>⚠️</div>
          <div>
            <p className={`${styles.statValue} text-red-600 dark:text-red-400`}>{rows.length}</p>
            <p className={`${styles.statLabel}`}>Paciente{rows.length !== 1 ? 's' : ''} inadimplente{rows.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className={styles.inadCard}>
          <div className={`${styles.statIcon} bg-orange-50 dark:bg-orange-500/10`}>💸</div>
          <div>
            <p className={`${styles.statValue} text-orange-600 dark:text-orange-400`}>{fmtR(total)}</p>
            <p className={styles.statLabel}>Total em aberto</p>
          </div>
        </div>
      </div>

      <div className={styles.inadTableCard}>
        <div className={styles.inadTableHeader}>
          <h2 className={styles.inadTableTitle}>Pacientes com saldo em aberto</h2>
          <button
            className={styles.inadCobrAll}
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
          const pct    = r.totalTrat > 0 ? Math.round((r.totalPago / r.totalTrat) * 100) : 0
          return (
            <div key={r.id} className={styles.inadRow}>
              <div className={styles.inadPatientInfo} onClick={() => navigate(`/pacientes/${r.id}`)}>
                <p className={styles.inadPatientName}>{r.nome}</p>
                <p className={styles.inadPatientMeta}>
                  {r.telefone || 'Sem telefone'}
                  {r.convenio ? ` · ${r.convenio}` : ''}
                </p>
                <div className={styles.inadProgressRow}>
                  <div className={styles.inadProgressTrack}>
                    <div className={styles.inadProgressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.inadProgressPct}>{pct}% pago</span>
                </div>
              </div>
              <div className={styles.inadAmount}>
                <p className={styles.inadAmountValue}>{fmtR(r.emAberto)}</p>
                <p className={styles.inadAmountTotal}>de {fmtR(r.totalTrat)}</p>
              </div>
              {waLink
                ? <a href={waLink} target="_blank" rel="noreferrer" className={styles.inadWaBtn}>💬</a>
                : <span className={styles.inadWaAbsent} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
