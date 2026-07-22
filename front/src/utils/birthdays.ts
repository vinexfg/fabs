import type { Patient } from '../types/entities'

export function getBirthdays(patients: Patient[]) {
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayMMDD = `${mm}-${dd}`

  const birthdaysToday: Patient[] = []
  const birthdaysWeek: Patient[] = []

  patients.forEach(p => {
    if (!p.dataNascimento) return
    const parts = p.dataNascimento.split('-')
    if (parts.length < 3) return
    const bMMDD = `${parts[1]}-${parts[2]}`
    if (bMMDD === todayMMDD) { birthdaysToday.push(p); return }
    const bThisYear = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const diff = (bThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    if (diff > 0 && diff <= 7) birthdaysWeek.push(p)
  })

  birthdaysWeek.sort((a, b) => {
    const [, am, ad] = (a.dataNascimento as string).split('-')
    const [, bm, bd] = (b.dataNascimento as string).split('-')
    return `${am}-${ad}`.localeCompare(`${bm}-${bd}`)
  })

  return { birthdaysToday, birthdaysWeek }
}
