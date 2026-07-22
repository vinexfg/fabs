import { forwardRef } from 'react'
import { TREATMENT_STATUS_LABELS } from '../../../utils/treatmentStatus'
import type { Patient, Treatment, Payment, Evolution } from '../../../types/entities'
import './print.css'

const PAYMENT_FORMS: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  convenio: 'Convênio',
  cheque: 'Cheque',
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—'
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function calculateAge(dateOfBirth: string) {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasNotHadBirthdayYet = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
  if (hasNotHadBirthdayYet) age--
  return age
}

interface Anamnese {
  alergiasCheck?: string[]
  condsCheck?: string[]
  alergiasExtra?: string
  condsExtra?: string
  medicamentos?: string
  queixa?: string
}

function parseAnamnese(raw: string | null): Anamnese | null {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

interface PatientFilePrintProps {
  patient: Patient | null
  treatments: Treatment[]
  payments: Payment[]
  evolutions: Evolution[]
}

const PatientFilePrint = forwardRef<HTMLDivElement, PatientFilePrintProps>(function PatientFilePrint({ patient, treatments, payments, evolutions }, ref) {
  if (!patient) return null

  const totalTreatments = treatments.reduce((sum, treatment) => sum + (Number(treatment.valor) || 0), 0)
  const totalPaid = payments.reduce((sum, payment) => sum + (Number(payment.valor) || 0), 0)
  const amountOwed = Math.max(0, totalTreatments - totalPaid)

  const anamnese      = parseAnamnese(patient.anamnese)
  const hasAnamnese   = anamnese !== null
  const alergiasCheck = anamnese?.alergiasCheck || []
  const alergiasExtra = anamnese?.alergiasExtra || ''
  const condsCheck    = anamnese?.condsCheck    || []
  const condsExtra    = anamnese?.condsExtra    || ''
  const medicamentos  = anamnese?.medicamentos  || patient.medicamentos || ''
  const queixa        = anamnese?.queixa        || patient.queixa       || ''
  const allAlergias   = [...alergiasCheck, ...(alergiasExtra ? [alergiasExtra] : [])].filter(Boolean)
  const allConds      = [...condsCheck,    ...(condsExtra    ? [condsExtra]    : [])].filter(Boolean)

  const hasMedicalHistory = allAlergias.length || allConds.length || medicamentos || queixa || patient.alergias || patient.conds

  return (
    <div ref={ref} className="print-wrapper" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="print-header">
        <div>
          <div className="print-logo">DenteFácil</div>
          <div className="print-patient-name">{patient.nome}</div>
          {patient.telefone && <div style={{ color: '#6b7280' }}>{patient.telefone}</div>}
        </div>
        <div className="print-date">Impresso em {new Date().toLocaleDateString('pt-BR')}</div>
      </div>

      <div className="print-section-title">Dados Pessoais</div>
      {patient.dataNascimento && (
        <div className="print-row">
          <span className="print-label">Nascimento</span>
          <span>{formatDate(patient.dataNascimento)} ({calculateAge(patient.dataNascimento)} anos)</span>
        </div>
      )}
      {patient.cpf && (
        <div className="print-row">
          <span className="print-label">CPF</span>
          <span>{patient.cpf}</span>
        </div>
      )}
      {patient.telefone && (
        <div className="print-row">
          <span className="print-label">Telefone</span>
          <span>{patient.telefone}</span>
        </div>
      )}
      {patient.email && (
        <div className="print-row">
          <span className="print-label">E-mail</span>
          <span>{patient.email}</span>
        </div>
      )}
      {patient.endereco && (
        <div className="print-row">
          <span className="print-label">Endereço</span>
          <span>{patient.endereco}</span>
        </div>
      )}
      <div className="print-row">
        <span className="print-label">Convênio</span>
        <span>{patient.convenio || 'Particular'}</span>
      </div>

      {Boolean(hasMedicalHistory) && (
        <>
          <div className="print-section-title">Anamnese</div>
          {hasAnamnese ? (
            <>
              {allAlergias.length > 0 && (
                <div className="print-row">
                  <span className="print-label">Alergias</span>
                  <span>{allAlergias.join(' · ')}</span>
                </div>
              )}
              {allConds.length > 0 && (
                <div className="print-row">
                  <span className="print-label">Condições médicas</span>
                  <span>{allConds.join(' · ')}</span>
                </div>
              )}
              {medicamentos && (
                <div className="print-row">
                  <span className="print-label">Medicamentos</span>
                  <span>{medicamentos}</span>
                </div>
              )}
              {queixa && (
                <div className="print-row">
                  <span className="print-label">Queixa principal</span>
                  <span>{queixa}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {patient.alergias     && <div className="print-row"><span className="print-label">Alergias</span><span>{patient.alergias}</span></div>}
              {patient.medicamentos && <div className="print-row"><span className="print-label">Medicamentos</span><span>{patient.medicamentos}</span></div>}
              {patient.conds        && <div className="print-row"><span className="print-label">Condições</span><span>{patient.conds}</span></div>}
              {patient.queixa       && <div className="print-row"><span className="print-label">Queixa principal</span><span>{patient.queixa}</span></div>}
            </>
          )}
        </>
      )}

      {treatments.length > 0 && (
        <>
          <div className="print-section-title">Plano de Tratamento</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Dente</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map(treatment => (
                <tr key={treatment.id}>
                  <td>
                    {treatment.proc}
                    {treatment.obs && <><br /><small style={{ color: '#6b7280' }}>{treatment.obs}</small></>}
                  </td>
                  <td>{treatment.dente || '—'}</td>
                  <td>{treatment.valor ? formatCurrency(treatment.valor) : '—'}</td>
                  <td>{TREATMENT_STATUS_LABELS[treatment.status] || treatment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="print-section-title">Financeiro</div>
      <div className="print-finance-grid">
        <div className="print-finance-box" style={{ background: '#eff6ff' }}>
          <div className="print-finance-label" style={{ color: '#2563eb' }}>Total</div>
          <div className="print-finance-value" style={{ color: '#2563eb' }}>{formatCurrency(totalTreatments)}</div>
        </div>
        <div className="print-finance-box" style={{ background: '#f0fdf4' }}>
          <div className="print-finance-label" style={{ color: '#16a34a' }}>Pago</div>
          <div className="print-finance-value" style={{ color: '#16a34a' }}>{formatCurrency(totalPaid)}</div>
        </div>
        <div className="print-finance-box" style={{ background: amountOwed > 0 ? '#fef2f2' : '#f9fafb' }}>
          <div className="print-finance-label" style={{ color: amountOwed > 0 ? '#dc2626' : '#6b7280' }}>Em Aberto</div>
          <div className="print-finance-value" style={{ color: amountOwed > 0 ? '#dc2626' : '#6b7280' }}>{formatCurrency(amountOwed)}</div>
        </div>
      </div>

      {payments.length > 0 && (
        <table className="print-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Forma</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{formatDate(payment.data)}</td>
                <td>{payment.descricao}</td>
                <td>{PAYMENT_FORMS[payment.forma || ''] || payment.forma}</td>
                <td style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(Number(payment.valor))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {evolutions.length > 0 && (
        <>
          <div className="print-section-title">Histórico de Atendimentos</div>
          {evolutions.map(evolution => (
            <div key={evolution.id} className="print-evolution">
              <div className="print-evolution-date">
                {formatDate(evolution.data)}{evolution.hora ? ` · ${evolution.hora}` : ''}
              </div>
              <div className="print-evolution-procedure">{evolution.proc}</div>
              {evolution.notas && <div className="print-evolution-notes">{evolution.notas}</div>}
              {evolution.proxConsulta && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#2563eb' }}>
                  Próxima consulta: {formatDate(evolution.proxConsulta)}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
})

export default PatientFilePrint
