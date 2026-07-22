import { formatCurrency } from '../../utils/format'
import type { ReportStats } from '../../infrastructure/http/ReportRepository'
import styles from '../../pages/Relatorios.module.css'

export default function ClinicView({ data }: { data: ReportStats | null }) {
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
            <p className={`${styles.statValue} text-blue-600 dark:text-blue-400`}>{formatCurrency(totalRevenue)}</p>
            <p className={styles.statLabel}>Receita total de tratamentos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} bg-violet-50 dark:bg-violet-500/10`}>🎯</div>
          <div>
            <p className={`${styles.statValue} text-violet-600 dark:text-violet-400`}>{formatCurrency(ticketMedio)}</p>
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
              <span className={styles.procNum}>{formatCurrency(Number(p.avg || 0))}</span>
              <span className={`${styles.procNum} ${styles.procTotal}`}>{formatCurrency(Number(p.total || 0))}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
