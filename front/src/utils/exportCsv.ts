import type { Patient, Payment } from '../types/entities'
import { PAYMENT_FORMS, formatDateBR as formatDate } from './format'

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportRelatorioCSV(payments: Payment[], { from, to }: { from?: string; to?: string } = {}) {
  const headers = ['Data', 'Paciente', 'Descrição', 'Forma de Pagamento', 'Valor (R$)']
  const rows = payments.map(p => [
    formatDate(p.data),
    p.patientNome || '',
    p.descricao,
    PAYMENT_FORMS[p.forma || ''] || p.forma || '',
    Number(p.valor).toFixed(2).replace('.', ','),
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const dateSuffix = from && to ? `${from}_${to}` : new Date().toISOString().slice(0, 10)
  downloadCsv(csv, `relatorio-financeiro-${dateSuffix}.csv`)
}

export function exportPaymentsCSV(patient: Patient, payments: Payment[]) {
  const headers = ['Data', 'Descrição', 'Forma de Pagamento', 'Valor (R$)']
  const rows = payments.map(payment => [
    formatDate(payment.data),
    payment.descricao,
    PAYMENT_FORMS[payment.forma || ''] || payment.forma || '',
    Number(payment.valor).toFixed(2).replace('.', ','),
  ])
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\n')
  downloadCsv(csv, `financeiro-${patient.nome.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`)
}
