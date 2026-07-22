import styles from './Empty.module.css'

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
