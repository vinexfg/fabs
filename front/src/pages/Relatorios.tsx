import { useEffect, useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PaymentRepository, SettingsRepository, ReportRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { exportRelatorioCSV } from '../utils/exportCsv'
import { formatCurrency, formatMonthLabel, PAYMENT_FORMS } from '../utils/format'
import {
  filterPaymentsByRange, sumPayments, sumPaymentsInMonth,
  groupPaymentsByMonth, groupPaymentsByForma, mostRecentPayments,
  totalInadimplencia, buildInadimplenteWaLink,
} from '../utils/reportStats'
import ClinicView from '../components/relatorios/ClinicView'
import AgendaView from '../components/relatorios/AgendaView'
import InadimplenciaView from '../components/relatorios/InadimplenciaView'
import RelatoriosPrint from '../components/print/RelatoriosPrint'
import type { Payment, Inadimplente, ClinicSettings } from '../types/entities'
import type { ReportStats } from '../infrastructure/http/ReportRepository'
import styles from './Relatorios.module.css'

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

  if (loading) return (
    <div className={styles.loading}>
      <span className={styles.loadingIcon}>⚙️</span>
      <span className={styles.loadingText}>Carregando...</span>
    </div>
  )

  const filtered  = filterPaymentsByRange(payments, filterFrom, filterTo)
  const total     = sumPayments(filtered)
  const totalMes  = sumPaymentsInMonth(filtered, new Date().toISOString().slice(0, 7))
  const months    = groupPaymentsByMonth(filtered)
  const maxVal    = Math.max(...months.map(([, v]) => v), 1)
  const formaEntries = groupPaymentsByForma(filtered)
  const recent    = mostRecentPayments(filtered)
  const totalInad = totalInadimplencia(inadimplentes)

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
        <InadimplenciaView
          rows={inadimplentes}
          total={totalInad}
          buildWaLink={row => buildInadimplenteWaLink(row, clinic)}
        />
      )}

      {tab === 'clinico' && <ClinicView data={reports} />}

      {tab === 'agenda' && <AgendaView data={reports} />}

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
                <p className={`${styles.statValue} text-blue-600 dark:text-blue-400`}>{formatCurrency(total)}</p>
                <p className={styles.statLabel}>Total recebido</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} bg-emerald-50 dark:bg-emerald-500/10`}>📅</div>
              <div>
                <p className={`${styles.statValue} text-emerald-600 dark:text-emerald-400`}>{formatCurrency(totalMes)}</p>
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
                        <span className={styles.chartBarValue}>{formatCurrency(val).replace('R$\xa0', '')}</span>
                        <div className={styles.chartBarFill} style={{ height: `${Math.max(4, (val / maxVal) * 120)}px` }} />
                        <span className={styles.chartBarLabel}>{formatMonthLabel(ym)}</span>
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
                            <span className={styles.methodName}>{PAYMENT_FORMS[forma] || forma}</span>
                            <span className={styles.methodPct}>{pct}%</span>
                          </div>
                          <div className={styles.methodTrack}>
                            <div className={styles.methodFill} style={{ width: `${pct}%` }} />
                          </div>
                          <p className={styles.methodAmount}>{formatCurrency(val)}</p>
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
                        {(p.data || '').split('-').reverse().join('/')} · {PAYMENT_FORMS[p.forma || ''] || p.forma}
                      </p>
                    </div>
                    <span className={styles.tableRowValue}>{formatCurrency(Number(p.valor))}</span>
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  )
}
