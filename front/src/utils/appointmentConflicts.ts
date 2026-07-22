import type { Appointment } from '../types/entities'

function toMin(time: string) {
  const [h, m] = (time || '00:00').split(':').map(Number)
  return h * 60 + m
}

export function findConflicts(newAppt: { time: string; duration: number | string }, existing: Appointment[]) {
  const start = toMin(newAppt.time)
  const end   = start + (parseInt(String(newAppt.duration)) || 60)
  return existing.filter(a => {
    if (a.status === 'cancelado') return false
    const aStart = toMin(a.time)
    const aEnd   = aStart + (parseInt(String(a.duration)) || 60)
    return start < aEnd && end > aStart
  })
}
