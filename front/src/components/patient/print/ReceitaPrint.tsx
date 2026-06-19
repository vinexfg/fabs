import { forwardRef } from 'react'
import type { Patient, ClinicSettings } from '../../../types/entities'
import './print.css'

function formatDate(dateString: string | null) {
  if (!dateString) return '—'
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

interface ReceitaPrintProps {
  patient: Patient | null
  clinic: Partial<ClinicSettings>
  medicines: string
  instructions?: string
}

const ReceitaPrint = forwardRef<HTMLDivElement, ReceitaPrintProps>(function ReceitaPrint({ patient, clinic, medicines, instructions }, ref) {
  if (!patient) return null

  const clinicName = clinic?.clinicName || 'DenteFácil'
  const doctorName = clinic?.doctorName || ''
  const cro = clinic?.cro || ''
  const clinicAddress = clinic?.clinicAddress || ''
  const clinicPhone = clinic?.clinicPhone || ''

  return (
    <div ref={ref} className="receita-wrapper">
      <div className="receita-header">
        <div className="receita-clinic-name">{clinicName}</div>
        {doctorName && (
          <div className="receita-subtitle">
            {doctorName}{cro ? ` · ${cro}` : ''}
          </div>
        )}
        {clinicAddress && <div className="receita-subtitle">{clinicAddress}</div>}
        {clinicPhone && <div className="receita-subtitle">{clinicPhone}</div>}
      </div>

      <h2 className="receita-title">RECEITUÁRIO</h2>

      <div className="receita-patient-box">
        <strong>Paciente:</strong> {patient.nome}
        {patient.dataNascimento && (
          <>&nbsp;&nbsp;·&nbsp;&nbsp;<strong>Nasc.:</strong> {formatDate(patient.dataNascimento)}</>
        )}
      </div>

      <div className="receita-medicines">{medicines}</div>

      {instructions && (
        <div className="receita-instructions">
          <strong>Instruções:</strong><br />{instructions}
        </div>
      )}

      <div className="receita-footer">
        <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
        <div style={{ textAlign: 'right' }}>
          <div className="receita-sign-line" />
          {doctorName || 'Assinatura'}
          {cro && <><br />{cro}</>}
        </div>
      </div>
    </div>
  )
})

export default ReceitaPrint
