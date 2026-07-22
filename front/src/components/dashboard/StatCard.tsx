import styles from '../../pages/Dashboard.module.css'

interface StatCardProps {
  label: string
  value: number
  icon: string
  bg: string
  text: string
  trend?: string | null
  trendPositive?: boolean
}

export default function StatCard({ label, value, icon, bg, text, trend, trendPositive }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statIcon} ${bg}`}>{icon}</div>
      <div>
        <p className={`${styles.statValue} ${text}`}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
        {trend && (
          <p className={`${styles.statTrend} ${trendPositive ? styles.trendUp : styles.trendDown}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
