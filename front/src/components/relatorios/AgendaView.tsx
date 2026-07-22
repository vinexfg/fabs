import { formatMonthLabel } from '../../utils/format'
import type { ReportStats, AgendaPorMes } from '../../infrastructure/http/ReportRepository'
import styles from '../../pages/Relatorios.module.css'

export default function AgendaView({ data }: { data: ReportStats | null }) {
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
              <span className={styles.agendaBarLabel}>{formatMonthLabel(m.mes)}</span>
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
              <span className={styles.agendaTableMes}>{formatMonthLabel(m.mes)}</span>
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
