import type { Appointment } from '../../types/entities'
import styles from '../../pages/Agenda.module.css'

interface DayAppointmentProps {
  appt: Appointment
  statusLabels: Record<string, string>
  statusBtnActive: Record<string, string>
  onStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  onPatient: () => void
}

export default function DayAppointment({ appt, statusLabels, statusBtnActive, onStatus, onDelete, onPatient }: DayAppointmentProps) {
  return (
    <div className={styles.apptCard}>
      <div className={styles.apptCardHeader}>
        <div>
          <p className={styles.apptTitle}>{appt.time} — {appt.patientNome}</p>
          <p className={styles.apptMeta}>{appt.type} · {appt.duration} min</p>
        </div>
        <button className="btn-danger btn-sm" onClick={() => onDelete(appt.id)}>🗑️</button>
      </div>
      {appt.notes && <p className={styles.apptNotes}>{appt.notes}</p>}
      <div className={styles.apptActions}>
        <button className={styles.apptPatientLink} onClick={() => onPatient()}>Ver ficha →</button>
        <span className={styles.apptDivider}>·</span>
        {Object.entries(statusLabels).map(([k, l]) => (
          <button
            key={k}
            onClick={() => onStatus(appt.id, k)}
            className={`${styles.statusBtnBase} ${appt.status === k ? statusBtnActive[k] : styles.statusBtnInactive}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
