import { getWeekDays, toISO } from '../../utils/calendar'
import type { Appointment } from '../../types/entities'
import styles from '../../pages/Agenda.module.css'

const WEEK_DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface WeekViewProps {
  weekStart: string
  appts: Appointment[]
  selected: string
  todayStr: string
  onSelectDay: (iso: string) => void
  onOpenForm: (iso: string) => void
  STATUS_CHIP: Record<string, string>
}

export default function WeekView({ weekStart, appts, selected, todayStr, onSelectDay, onOpenForm, STATUS_CHIP }: WeekViewProps) {
  const days = getWeekDays(weekStart)
  const byDate = appts.reduce<Record<string, Appointment[]>>((acc, a) => {
    acc[a.date] = acc[a.date] || []
    acc[a.date].push(a)
    return acc
  }, {})

  return (
    <div className={styles.weekGrid}>
      {days.map((day, i) => {
        const iso = toISO(day)
        const dayAppts = byDate[iso] || []
        const isToday    = iso === todayStr
        const isSelected = iso === selected
        return (
          <div
            key={iso}
            className={`${styles.weekCol} ${isSelected ? styles.weekColSelected : isToday ? styles.weekColToday : styles.weekColDefault}`}
            onClick={() => onSelectDay(iso)}
          >
            <div className={styles.weekColHeader}>
              <p className={`${styles.weekDayName} ${isSelected ? styles.weekDayNameSelected : ''}`}>{WEEK_DAYS_SHORT[i]}</p>
              <p className={`${styles.weekDayNum} ${isSelected ? styles.weekDayNumSelected : isToday ? styles.weekDayNumToday : styles.weekDayNumDefault}`}>
                {day.getDate()}
              </p>
            </div>
            <div className={styles.weekAppts}>
              {dayAppts.map(a => (
                <div key={a.id} className={`${styles.weekApptChip} ${isSelected ? styles.calChipSelected : STATUS_CHIP[a.status]}`}>
                  <span className={styles.weekApptTime}>{a.time?.slice(0, 5)}</span>
                  <span className={styles.weekApptName}>{a.patientNome?.split(' ')[0]}</span>
                </div>
              ))}
              {dayAppts.length === 0 && (
                <button
                  className={styles.weekAddBtn}
                  onClick={e => { e.stopPropagation(); onOpenForm(iso) }}
                >+</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
