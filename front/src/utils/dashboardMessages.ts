import type { Appointment, Patient } from '../types/entities'

export function buildReminderWaLink(appt: Appointment, clinicName?: string): string | null {
  const phone = (appt.patientTelefone || '').replace(/\D/g, '')
  if (!phone) return null
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const msg = encodeURIComponent(
    `Olá ${(appt.patientNome || '').split(' ')[0]}! 👋\n` +
    `Lembrando que você tem consulta *amanhã, ${dateStr}*, às *${appt.time?.slice(0,5)}h*` +
    `${clinicName ? ` no *${clinicName}*` : ''}.\n` +
    `Em caso de dúvidas, estamos à disposição. Até amanhã! 😊`
  )
  return `https://wa.me/55${phone}?text=${msg}`
}

export function buildBirthdayWaLink(patient: Patient, clinicName?: string): string | null {
  const phone = (patient.telefone || '').replace(/\D/g, '')
  if (!phone) return null
  const msg = encodeURIComponent(
    `Olá ${patient.nome.split(' ')[0]}! 🎂 A equipe ${clinicName || 'DenteFácil'} deseja um feliz aniversário! Que seja um dia especial!`
  )
  return `https://wa.me/55${phone}?text=${msg}`
}
