import type { Patient } from '../../types/entities'
import styles from '../../pages/Dashboard.module.css'

export default function PatientRow({ patient: p, onClick }: { patient: Patient; onClick: () => void }) {
  const initials = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`group ${styles.row}`} onClick={onClick}>
      {p.foto
        ? <img src={p.foto} alt={p.nome} className={styles.avatar} />
        : <div className={styles.avatarFallback}>{initials}</div>
      }
      <div className={styles.rowInfo}>
        <p className={styles.rowName}>{p.nome}</p>
        <p className={styles.rowSub}>{p.telefone || 'Sem telefone'}</p>
      </div>
      <span className={styles.arrow}>→</span>
    </div>
  )
}
