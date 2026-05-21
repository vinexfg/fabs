const PAYMENT_FORMS = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  convenio: 'Convênio',
  cheque: 'Cheque',
}

function formatDate(dateString) {
  if (!dateString) return '—'
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export function exportPaymentsCSV(patient, payments) {
  const headers = ['Data', 'Descrição', 'Forma de Pagamento', 'Valor (R$)']
  const rows = payments.map(payment => [
    formatDate(payment.data),
    payment.descricao,
    PAYMENT_FORMS[payment.forma] || payment.forma,
    parseFloat(payment.valor).toFixed(2).replace('.', ','),
  ])
  const csv = [headers, ...rows].map(row => row.map(value => `"${value}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `financeiro-${patient.nome.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
