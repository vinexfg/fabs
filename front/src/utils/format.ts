export const PAYMENT_FORMS: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  convenio: 'Convênio',
  cheque: 'Cheque',
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export function formatDateBR(dateString: string | null | undefined) {
  if (!dateString) return '—'
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export function formatMonthLabel(yearMonth: string) {
  const [y, m] = yearMonth.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}
