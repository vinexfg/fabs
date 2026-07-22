import { useNavigate } from 'react-router-dom'
import { openWhatsAppSequential } from '../../utils/openWhatsAppSequential'
import { formatCurrency } from '../../utils/format'
import type { Inadimplente } from '../../types/entities'
import styles from '../../pages/Relatorios.module.css'

interface InadimplenciaViewProps {
  rows: Inadimplente[]
  total: number
  buildWaLink: (row: Inadimplente) => string | null
}

export default function InadimplenciaView({ rows, total, buildWaLink }: InadimplenciaViewProps) {
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
            <p className={`${styles.statValue} text-orange-600 dark:text-orange-400`}>{formatCurrency(total)}</p>
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
                <p className={styles.inadAmountValue}>{formatCurrency(r.emAberto)}</p>
                <p className={styles.inadAmountTotal}>de {formatCurrency(r.totalTrat)}</p>
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
