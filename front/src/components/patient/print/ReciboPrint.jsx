import React from 'react'
import './print.css'

const FORMAS = {
  pix: 'PIX', dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito',
  convenio: 'Convênio', cheque: 'Cheque',
}

function fmtR(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString('pt-BR')
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const ReciboPrint = React.forwardRef(function ReciboPrint({ patient, clinic, payment }, ref) {
  if (!patient || !payment) return null

  const clinicName    = clinic?.clinicName    || 'DenteFácil'
  const doctorName    = clinic?.doctorName    || ''
  const cro           = clinic?.cro           || ''
  const clinicAddress = clinic?.clinicAddress || ''
  const clinicPhone   = clinic?.clinicPhone   || ''

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
        {clinicPhone   && <div className="receita-subtitle">{clinicPhone}</div>}
      </div>

      <h2 className="receita-title">RECIBO DE PAGAMENTO</h2>

      <div className="receita-patient-box">
        <strong>Recebi de:</strong> {patient.nome}
        {patient.cpf && <>&nbsp;&nbsp;·&nbsp;&nbsp;<strong>CPF:</strong> {patient.cpf}</>}
      </div>

      <div style={{ margin: '20px 0', fontSize: 14, lineHeight: 2 }}>
        <p>
          A quantia de <strong style={{ fontSize: 16 }}>{fmtR(parseFloat(payment.valor))}</strong>
          {' '}referente a <strong>{payment.descricao}</strong>.
        </p>
        <p>
          <strong>Forma de pagamento:</strong> {FORMAS[payment.forma] || payment.forma || '—'}
        </p>
        <p>
          <strong>Data:</strong> {fmtDate(payment.data)}
        </p>
      </div>

      <div className="receita-footer">
        <div>{clinicAddress || clinicName}</div>
        <div style={{ textAlign: 'right' }}>
          <div className="receita-sign-line" />
          {doctorName || 'Assinatura'}
          {cro && <><br />{cro}</>}
        </div>
      </div>
    </div>
  )
})

export default ReciboPrint
