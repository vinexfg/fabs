import React from 'react'
import './print.css'

const AtestadoPrint = React.forwardRef(function AtestadoPrint({ patient, clinic, days, reason }, ref) {
  if (!patient) return null

  const clinicName = clinic?.clinicName || 'DenteFácil'
  const doctorName = clinic?.doctorName || ''
  const cro = clinic?.cro || ''
  const clinicAddress = clinic?.clinicAddress || ''

  const numberOfDays = parseInt(days, 10) || 0
  const hasRestPeriod = numberOfDays > 0
  const dayLabel = numberOfDays > 1 ? 'dias' : 'dia'

  return (
    <div ref={ref} className="atestado-wrapper">
      <div className="atestado-header">
        <div className="atestado-clinic-name">{clinicName}</div>
        {doctorName && (
          <div className="atestado-subtitle">
            {doctorName}{cro ? ` · ${cro}` : ''}
          </div>
        )}
        {clinicAddress && <div className="atestado-subtitle">{clinicAddress}</div>}
      </div>

      <h2 className="atestado-title">ATESTADO ODONTOLÓGICO</h2>

      <p className="atestado-body">
        Atesto para os devidos fins que o(a) paciente{' '}
        <span className="atestado-highlight">{patient.nome}</span>{' '}
        esteve sob meus cuidados odontológicos na data de{' '}
        <span className="atestado-highlight">{new Date().toLocaleDateString('pt-BR')}</span>,{' '}
        {hasRestPeriod
          ? <>necessitando de <span className="atestado-highlight">{numberOfDays} {dayLabel}</span> de repouso</>
          : 'comparecendo para atendimento odontológico'
        }
        {reason ? <>, em razão de: <span className="atestado-highlight">{reason}</span></> : null}.
      </p>

      <div className="atestado-sign-block">
        <div className="atestado-sign-line" />
        {doctorName || 'Assinatura'}
        {cro && <><br />{cro}</>}
      </div>

      <div className="atestado-footer">
        <div>{clinicAddress}</div>
        <div>{new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>
  )
})

export default AtestadoPrint
