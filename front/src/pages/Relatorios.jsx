import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { PaymentRepository, SettingsRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { exportRelatorioCSV } from '../utils/exportCsv'
import { openWhatsAppSequential } from '../utils/openWhatsAppSequential'
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
  const toast    = useToast()
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({ contentRef: printRef })

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

      {/* Conteúdo oculto apenas para impressão */}
      <div style={{ display: 'none' }}>
        <PrintReport
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

const PrintReport = React.forwardRef(function PrintReport({ clinic, filtered, total, totalMes, months, formaEntries, filterFrom, filterTo }, ref) {
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const period = filterFrom || filterTo
    ? `${filterFrom ? filterFrom.split('-').reverse().join('/') : 'início'} – ${filterTo ? filterTo.split('-').reverse().join('/') : 'hoje'}`
    : 'Todo o período'

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', padding: '32px', color: '#1e293b', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>
          {clinic.clinicName || 'Consultório Odontológico'}
        </h1>
        {clinic.doctorName && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{clinic.doctorName}{clinic.cro ? ` — ${clinic.cro}` : ''}</p>}
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Relatório gerado em {dateStr} · Período: {period}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Recebido', value: fmtR(total), color: '#2563eb' },
          { label: 'Este Mês',       value: fmtR(totalMes), color: '#059669' },
          { label: 'Nº Pagamentos',  value: filtered.length, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <p style={{ fontSize: '20px', fontWeight: '800', color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {months.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Receita por Mês</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Mês</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {months.map(([ym, val]) => (
                <tr key={ym} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px' }}>{fmtMonth(ym)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{fmtR(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formaEntries.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Por Forma de Pagamento</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Forma</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Valor</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {formaEntries.map(([forma, val]) => (
                <tr key={forma} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px' }}>{FORMAS[forma] || forma}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{fmtR(val)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>
                    {total > 0 ? Math.round((val / total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Pagamentos ({filtered.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Data</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Descrição</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Paciente</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Forma</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || '')).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>{(p.data || '').split('-').reverse().join('/')}</td>
                <td style={{ padding: '6px 8px' }}>{p.descricao}</td>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>{p.patientNome || '—'}</td>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>{FORMAS[p.forma] || p.forma || '—'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{fmtR(parseFloat(p.valor))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>Total</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#2563eb', fontSize: '14px' }}>{fmtR(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{ marginTop: '32px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        DenteFácil · Relatório Financeiro · {dateStr}
      </p>
    </div>
  )
})

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
              const withLink = rows.filter(r => buildWaLink(r))
              if (withLink.length > 0) openWhatsAppSequential(withLink.map(r => buildWaLink(r)))
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
