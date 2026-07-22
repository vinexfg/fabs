import type { Inadimplente, Payment, ClinicSettings } from '../types/entities'
import { formatCurrency } from './format'

export function filterPaymentsByRange(payments: Payment[], from: string, to: string) {
  return payments.filter(p => {
    const d = p.data || ''
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  })
}

export function sumPayments(payments: Payment[]) {
  return payments.reduce((s, p) => s + (Number(p.valor) || 0), 0)
}

export function sumPaymentsInMonth(payments: Payment[], yearMonth: string) {
  return payments.filter(p => (p.data || '').startsWith(yearMonth)).reduce((s, p) => s + (Number(p.valor) || 0), 0)
}

export function groupPaymentsByMonth(payments: Payment[], monthsLimit = 12) {
  const byMonth: Record<string, number> = {}
  payments.forEach(p => {
    const m = (p.data || '').slice(0, 7)
    if (!m) return
    byMonth[m] = (byMonth[m] || 0) + (Number(p.valor) || 0)
  })
  return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-monthsLimit) as [string, number][]
}

export function groupPaymentsByForma(payments: Payment[]) {
  const byForma: Record<string, number> = {}
  payments.forEach(p => {
    const f = p.forma || 'outro'
    byForma[f] = (byForma[f] || 0) + (Number(p.valor) || 0)
  })
  return Object.entries(byForma).sort(([, a], [, b]) => b - a) as [string, number][]
}

export function mostRecentPayments(payments: Payment[], limit = 20) {
  return [...payments].sort((a, b) => (b.data || '').localeCompare(a.data || '')).slice(0, limit)
}

export function totalInadimplencia(rows: Inadimplente[]) {
  return rows.reduce((s, r) => s + r.emAberto, 0)
}

export function buildInadimplenteWaLink(row: Inadimplente, clinic: Partial<ClinicSettings>): string | null {
  const phone = (row.telefone || '').replace(/\D/g, '')
  if (!phone) return null
  const msg = encodeURIComponent(
    `Olá ${row.nome.split(' ')[0]}! 👋\n` +
    `Identificamos um saldo em aberto de *${formatCurrency(row.emAberto)}* referente ao seu tratamento` +
    `${clinic.clinicName ? ` em *${clinic.clinicName}*` : ''}.\n` +
    `Por favor, entre em contato para regularizar. Obrigado! 😊`
  )
  return `https://wa.me/55${phone}?text=${msg}`
}
