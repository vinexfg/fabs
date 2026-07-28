import { forwardRef } from 'react'
import { PAYMENT_FORMS as FORMAS, formatCurrency as fmtR, formatMonthLabel as fmtMonth } from '../../utils/format'
import type { Payment, ClinicSettings } from '../../types/entities'

interface RelatoriosPrintProps {
  clinic: Partial<ClinicSettings>
  filtered: Payment[]
  total: number
  totalMes: number
  months: [string, number][]
  formaEntries: [string, number][]
  filterFrom: string
  filterTo: string
}

const RelatoriosPrint = forwardRef<HTMLDivElement, RelatoriosPrintProps>(function RelatoriosPrint(
  { clinic, filtered, total, totalMes, months, formaEntries, filterFrom, filterTo },
  ref
) {
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const period = filterFrom || filterTo
    ? `${filterFrom ? filterFrom.split('-').reverse().join('/') : 'início'} – ${filterTo ? filterTo.split('-').reverse().join('/') : 'hoje'}`
    : 'Todo o período'

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', padding: '32px', color: '#1e293b', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>
          {clinic.clinicName || 'Consultório Odontológico'}
        </h1>
        {clinic.doctorName && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            {clinic.doctorName}{clinic.cro ? ` — ${clinic.cro}` : ''}
          </p>
        )}
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Relatório gerado em {dateStr} · Período: {period}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Recebido', value: fmtR(total),        color: '#2563eb' },
          { label: 'Este Mês',       value: fmtR(totalMes),     color: '#059669' },
          { label: 'Nº Pagamentos',  value: String(filtered.length), color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <p style={{ fontSize: '20px', fontWeight: '800', color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {months.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Receita por Mês</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Mês</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {months.map(([ym, val]) => (
                <tr key={ym} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px' }}>{fmtMonth(ym)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{fmtR(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formaEntries.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Por Forma de Pagamento</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Forma</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Valor</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {formaEntries.map(([forma, val]) => (
                <tr key={forma} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px' }}>{FORMAS[forma] || forma}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{fmtR(val)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b' }}>
                    {total > 0 ? Math.round((val / total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>
          Pagamentos ({filtered.length})
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Data</th>
              <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Descrição</th>
              <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Paciente</th>
              <th style={{ textAlign: 'left',  padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Forma</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: '600', color: '#475569' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || '')).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>{(p.data || '').split('-').reverse().join('/')}</td>
                <td style={{ padding: '6px 8px' }}>{p.descricao}</td>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>{p.patientNome || '—'}</td>
                <td style={{ padding: '6px 8px', color: '#64748b' }}>{FORMAS[p.forma || ''] || p.forma || '—'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>{fmtR(Number(p.valor))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>Total</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#2563eb', fontSize: '14px' }}>{fmtR(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{ marginTop: '32px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        DenteFácil · Relatório Financeiro · {dateStr}
      </p>
    </div>
  )
})

export default RelatoriosPrint
