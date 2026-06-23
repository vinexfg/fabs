import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { PaymentRepository, SettingsRepository, ReportRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { exportRelatorioCSV } from '../utils/exportCsv'
import { openWhatsAppSequential } from '../utils/openWhatsAppSequential'
import RelatoriosPrint from '../components/print/RelatoriosPrint'
import type { Payment, Inadimplente, ClinicSettings } from '../types/entities'
import type { ReportStats, AgendaPorMes } from '../infrastructure/http/ReportRepository'
import styles from './Relatorios.module.css'

const FORMAS: Record<string, string> = {
  pix: 'PIX', dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  convenio: 'Convênio', cheque: 'Cheque',
}

function fmtR(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

type Tab = 'receitas' | 'inadimplencia' | 'clinico' | 'agenda'

export default function Relatorios() {
  const [tab, setTab]                   = useState<Tab>('receitas')
  const [payments, setPayments]         = useState<Payment[]>([])
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([])
  const [reports, setReports]           = useState<ReportStats | null>(null)
  const [clinic, setClinic]             = useState<Partial<ClinicSettings>>({})
  const [loading, setLoading]           = useState(true)
  const [filterFrom, setFilterFrom]     = useState('')
  const [filterTo, setFilterTo]         = useState('')
  const toast    = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({ contentRef: printRef })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [paymentList, inadimplentesList, clinicSettings, reportData] = await Promise.all([
        PaymentRepository.findAll(),
        PaymentRepository.findInadimplentes(),
        SettingsRepository.find(),
        ReportRepository.find(),
      ])
      setPayments(paymentList)
      setInadimplentes(inadimplentesList)
      setClinic(clinicSettings)
      setReports(reportData)
    }
    catch { toast('Erro ao carregar relatórios', 'error') }
    finally { setLoading(false) }
  }

  function buildWaLink(row: Inadimplente): string | null {
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

  const total    = filtered.reduce((s, p) => s + (Number(p.valor) || 0), 0)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalMes = filtered.filter(p => (p.data || '').startsWith(thisMonth)).reduce((s, p) => s + (Number(p.valor) || 0), 0)

  const byMonth: Record<string, number> = {}
  filtered.forEach(p => {
    const m = (p.data || '').slice(0, 7)
    if (!m) return
    byMonth[m] = (byMonth[m] || 0) + (Number(p.valor) || 0)
  })
  const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12) as [string, number][]
  const maxVal = Math.max(...months.map(([, v]) => v), 1)

  const byForma: Record<string, number> = {}
  filtered.forEach(p => {
    const f = p.forma || 'outro'
    byForma[f] = (byForma[f] || 0) + (Number(p.valor) || 0)
  })
  const formaEntries = Object.entries(byForma).sort(([, a], [, b]) => b - a) as [string, number][]

  const recent = [...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, 20)
  const totalInadimplencia = inadimplentes.reduce((s, r) => s + r.emAberto, 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatórios Financeiros</h1>
          <p className={styles.subtitle}>Visão geral das receitas</p>
        </div>
        {tab === 'receitas' && filtered.length > 0 && (
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => exportRelatorioCSV(filtered, { from: filterFrom, to: filterTo })}
            >
              ⬇️ Exportar CSV
            </button>
            <button className="btn-secondary" onClick={handlePrint}>
              🖨️ Imprimir
            </button>
          </div>
        )}
      </div>

      <div className={styles.tabBar}>
        {[
          { id: 'receitas',      label: '💰 Receitas' },
          { id: 'inadimplencia', label: `⚠️ Inadimplência${inadimplentes.length > 0 ? ` (${inadimplentes.length})` : ''}` },
          { id: 'clinico',       label: '🦷 Clínico' },
          { id: 'agenda',        label: '📅 Agenda' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)} className={tab === t.id ? styles.tabActive : styles.tab}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'inadimplencia' && (
        <InadimplenciaView rows={inadimplentes} total={totalInadimplencia} buildWaLink={buildWaLink} />
      )}

      {tab === 'clinico' && (
        <ClinicView data={reports} />
      )}

      {tab === 'agenda' && (
        <AgendaView data={reports} />
      )}

      <div style={{ display: 'none' }}>
        <RelatoriosPrint
          ref={printRef}
          clinic={clinic}
          filtered={filtered}
          total={total}
          totalMes={totalMes}
          months={months}
          formaEntries={formaEntries}
          filterFrom={filterFrom}
          filterTo={filterTo}
        />
      </div>

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
                        {(p.data || '').split('-').reverse().join('/')} · {FORMAS[p.forma || ''] || p.forma}
                      </p>
                    </div>
                    <span className={styles.tableRowValue}>{fmtR(Number(p.valor))}</span>
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  )
}

function ClinicView({ data }: { data: ReportStats | null }) {
  if (!data) return <p className={styles.chartEmpty}>Carregando...</p>

  const procs = data.procedimentos || []
  if (procs.length === 0) {
    return (
      <div className={styles.inadEmpty}>
        <div className={styles.inadEmptyIcon}>🦷</div>
        <p className={styles.inadEmptyTitle}>Nenhum tratamento registrado</p>
        <p className={styles.inadEmptyText}>Os procedimentos aparecerão aqui conforme forem cadastrados.</p>
      </div>
    )
  }

  const totalCount  = procs.reduce((s, p) => s + Number(p.count), 0)
  const totalRevenue = procs.reduce((s, p) => s + Number(p.total || 0), 0)
  const ticketMedio = totalCount > 0 ? totalRevenue / totalCount : 0
  const maxCount    = Math.max(...procs.map(p => Number(p.count)), 1)

  return (
    <>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-teal-50 dark:bg-teal-500/10`}>🦷</div>
          <div>
            <p className={`${styles.statValue} text-teal-600 dark:text-teal-400`}>{totalCount}</p>
            <p className={styles.statLabel}>Tratamentos registrados</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-blue-50 dark:bg-blue-500/10`}>💰</div>
          <div>
            <p className={`${styles.statValue} text-blue-600 dark:text-blue-400`}>{fmtR(totalRevenue)}</p>
            <p className={styles.statLabel}>Receita total de tratamentos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-violet-50 dark:bg-violet-500/10`}>🎯</div>
          <div>
            <p className={`${styles.statValue} text-violet-600 dark:text-violet-400`}>{fmtR(ticketMedio)}</p>
            <p className={styles.statLabel}>Ticket médio</p>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h2 className={styles.tableTitle}>Top Procedimentos</h2>
        </div>
        <div className={styles.procHeader}>
          <span className={styles.procHeaderName}>Procedimento</span>
          <span className={styles.procHeaderNum}>Qtd</span>
          <span className={styles.procHeaderNum}>Ticket médio</span>
          <span className={styles.procHeaderNum}>Total</span>
        </div>
        {procs.map((p, i) => {
          const pct = Math.round((Number(p.count) / maxCount) * 100)
          return (
            <div key={p.proc} className={styles.procRow}>
              <span className={styles.procRank}>{i + 1}</span>
              <div className={styles.procNameCol}>
                <span className={styles.procName}>{p.proc}</span>
                <div className={styles.procBarTrack}>
                  <div className={styles.procBarFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className={styles.procNum}>{Number(p.count)}</span>
              <span className={styles.procNum}>{fmtR(Number(p.avg || 0))}</span>
              <span className={`${styles.procNum} ${styles.procTotal}`}>{fmtR(Number(p.total || 0))}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function AgendaView({ data }: { data: ReportStats | null }) {
  if (!data) return <p className={styles.chartEmpty}>Carregando...</p>

  const meses: AgendaPorMes[] = (data.agendaPorMes || []).slice(-12)

  if (meses.length === 0) {
    return (
      <div className={styles.inadEmpty}>
        <div className={styles.inadEmptyIcon}>📅</div>
        <p className={styles.inadEmptyTitle}>Nenhuma consulta registrada</p>
        <p className={styles.inadEmptyText}>Os dados da agenda aparecerão aqui conforme as consultas forem registradas.</p>
      </div>
    )
  }

  const totalConsultas  = meses.reduce((s, m) => s + Number(m.total), 0)
  const totalRealizados = meses.reduce((s, m) => s + Number(m.realizados), 0)
  const totalFaltou     = meses.reduce((s, m) => s + Number(m.faltou), 0)
  const totalCancelados = meses.reduce((s, m) => s + Number(m.cancelados), 0)
  const taxaPresenca    = totalConsultas > 0 ? Math.round((totalRealizados / totalConsultas) * 100) : 0
  const maxTotal        = Math.max(...meses.map(m => Number(m.total)), 1)

  return (
    <>
      <div className={styles.agendaStatsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-blue-50 dark:bg-blue-500/10`}>📅</div>
          <div>
            <p className={`${styles.statValue} text-blue-600 dark:text-blue-400`}>{totalConsultas}</p>
            <p className={styles.statLabel}>Total de consultas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-emerald-50 dark:bg-emerald-500/10`}>✅</div>
          <div>
            <p className={`${styles.statValue} text-emerald-600 dark:text-emerald-400`}>{taxaPresenca}%</p>
            <p className={styles.statLabel}>Taxa de presença</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-red-50 dark:bg-red-500/10`}>❌</div>
          <div>
            <p className={`${styles.statValue} text-red-600 dark:text-red-400`}>{totalFaltou}</p>
            <p className={styles.statLabel}>Faltas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-amber-50 dark:bg-amber-500/10`}>🚫</div>
          <div>
            <p className={`${styles.statValue} text-amber-600 dark:text-amber-400`}>{totalCancelados}</p>
            <p className={styles.statLabel}>Cancelamentos</p>
          </div>
        </div>
      </div>

      <div className={styles.tableCard} style={{ marginBottom: '1.25rem' }}>
        <div className={styles.tableHeaderRow}>
          <h2 className={styles.tableTitle}>Consultas por Mês (últimos 12 meses)</h2>
        </div>
        <div className={styles.agendaChartBars}>
          {meses.map(m => (
            <div key={m.mes} className={styles.agendaBarCol}>
              <span className={styles.agendaBarTotal}>{Number(m.total)}</span>
              <div className={styles.agendaBarStack} style={{ height: `${Math.max(6, (Number(m.total) / maxTotal) * 120)}px` }}>
                {Number(m.realizados) > 0 && <div className={styles.agendaBarRealizados} style={{ flex: Number(m.realizados) }} />}
                {Number(m.faltou)     > 0 && <div className={styles.agendaBarFaltou}     style={{ flex: Number(m.faltou) }} />}
                {Number(m.cancelados) > 0 && <div className={styles.agendaBarCancelados} style={{ flex: Number(m.cancelados) }} />}
                {Number(m.agendados)  > 0 && <div className={styles.agendaBarAgendados}  style={{ flex: Number(m.agendados) }} />}
              </div>
              <span className={styles.agendaBarLabel}>{fmtMonth(m.mes)}</span>
            </div>
          ))}
        </div>
        <div className={styles.agendaLegend}>
          <span className={styles.agendaLegendItem}><span className={`${styles.agendaLegendDot} ${styles.dotRealizados}`} />Realizados</span>
          <span className={styles.agendaLegendItem}><span className={`${styles.agendaLegendDot} ${styles.dotFaltou}`} />Faltou</span>
          <span className={styles.agendaLegendItem}><span className={`${styles.agendaLegendDot} ${styles.dotCancelados}`} />Cancelados</span>
          <span className={styles.agendaLegendItem}><span className={`${styles.agendaLegendDot} ${styles.dotAgendados}`} />Agendados</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h2 className={styles.tableTitle}>Detalhamento por Mês</h2>
        </div>
        <div className={styles.agendaTableHeader}>
          <span className={styles.agendaTHMes}>Mês</span>
          <span className={styles.agendaTHNum}>Total</span>
          <span className={styles.agendaTHNum}>Realizados</span>
          <span className={styles.agendaTHNum}>Faltou</span>
          <span className={styles.agendaTHNum}>Cancelados</span>
          <span className={styles.agendaTHNum}>Agendados</span>
        </div>
        {[...meses].reverse().map(m => {
          const total = Number(m.total)
          const pres  = total > 0 ? Math.round((Number(m.realizados) / total) * 100) : 0
          return (
            <div key={m.mes} className={styles.agendaTableRow}>
              <span className={styles.agendaTableMes}>{fmtMonth(m.mes)}</span>
              <span className={styles.agendaTableNum}>{total}</span>
              <span className={`${styles.agendaTableNum} text-emerald-600 dark:text-emerald-400`}>
                {Number(m.realizados)} <span className={styles.agendaTablePct}>({pres}%)</span>
              </span>
              <span className={`${styles.agendaTableNum} text-red-500 dark:text-red-400`}>{Number(m.faltou)}</span>
              <span className={`${styles.agendaTableNum} text-amber-500 dark:text-amber-400`}>{Number(m.cancelados)}</span>
              <span className={`${styles.agendaTableNum} text-blue-500 dark:text-blue-400`}>{Number(m.agendados)}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

interface InadimplenciaViewProps {
  rows: Inadimplente[]
  total: number
  buildWaLink: (row: Inadimplente) => string | null
}

function InadimplenciaView({ rows, total, buildWaLink }: InadimplenciaViewProps) {
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
              const withLink = rows.filter(r => buildWaLink(r))
              if (withLink.length > 0) openWhatsAppSequential(withLink.map(r => buildWaLink(r) as string))
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
