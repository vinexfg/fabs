import { forwardRef } from 'react'
import { formatCurrency as fmtR } from '../../../utils/format'
import type { Patient, Budget, ClinicSettings } from '../../../types/entities'
import './print.css'

interface OrcamentoPrintProps {
  patient: Patient | null
  clinic: Partial<ClinicSettings>
  budget: Budget | null
  numero: string | number
}

const OrcamentoPrint = forwardRef<HTMLDivElement, OrcamentoPrintProps>(function OrcamentoPrint({ patient, clinic, budget, numero }, ref) {
  if (!patient || !budget) return null

  const clinicName    = clinic?.clinicName    || 'DenteFácil'
  const doctorName    = clinic?.doctorName    || ''
  const cro           = clinic?.cro           || ''
  const clinicAddress = clinic?.clinicAddress || ''
  const clinicPhone   = clinic?.clinicPhone   || ''

  const items    = budget.items || []
  const subtotal = items.reduce((s, i) => s + (Number(i.valor) || 0), 0)
  const desconto = Number(budget.desconto) || 0
  const total    = Math.max(0, subtotal - desconto)

  return (
    <div ref={ref} className="receita-wrapper">
      <div className="receita-header">
        <div className="receita-clinic-name">{clinicName}</div>
        {doctorName && <div className="receita-subtitle">{doctorName}{cro ? ` · ${cro}` : ''}</div>}
        {clinicAddress && <div className="receita-subtitle">{clinicAddress}</div>}
        {clinicPhone   && <div className="receita-subtitle">{clinicPhone}</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '20px 0 16px' }}>
        <h2 className="receita-title" style={{ margin: 0 }}>ORÇAMENTO</h2>
        {numero && <span style={{ fontSize: 11, color: '#6b7280' }}>Nº {numero}</span>}
      </div>

      <div className="receita-patient-box">
        <strong>Paciente:</strong> {patient.nome}
        {patient.telefone && <>&nbsp;&nbsp;·&nbsp;&nbsp;<strong>Tel:</strong> {patient.telefone}</>}
        {patient.cpf      && <>&nbsp;&nbsp;·&nbsp;&nbsp;<strong>CPF:</strong> {patient.cpf}</>}
      </div>

      <table className="print-table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ width: '50%' }}>Procedimento</th>
            <th>Dente / Região</th>
            <th style={{ textAlign: 'right' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.proc}</td>
              <td>{item.dente || '—'}</td>
              <td style={{ textAlign: 'right' }}>{fmtR(Number(item.valor))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, textAlign: 'right', fontSize: 12 }}>
        <div style={{ color: '#6b7280', marginBottom: 4 }}>Subtotal: {fmtR(subtotal)}</div>
        {desconto > 0 && <div style={{ color: '#ef4444', marginBottom: 4 }}>Desconto: − {fmtR(desconto)}</div>}
        <div style={{ fontSize: 16, fontWeight: 800 }}>Total: {fmtR(total)}</div>
      </div>

      {budget.obs && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#374151' }}>
          <strong>Observações:</strong> {budget.obs}
        </div>
      )}

      <div className="receita-footer" style={{ marginTop: 48 }}>
        <div>
          <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
          <div style={{ marginTop: 4, fontSize: 10 }}>Validade: 30 dias</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="receita-sign-line" />
          {doctorName || 'Assinatura'}
          {cro && <><br />{cro}</>}
        </div>
      </div>
    </div>
  )
})

export default OrcamentoPrint
