import React from 'react'
import styles from './FichaTab.module.css'

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>
        {value || <span className={styles.rowEmpty}>—</span>}
      </span>
    </div>
  )
}

function calcAge(dob) {
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

function fmtDate(d) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function FichaTab({ patient: p }) {
  return (
    <div className={styles.sections}>
      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <span className="text-lg">👤</span>
          <p className={styles.cardTitle}>Dados Pessoais</p>
        </div>
        <Row label="Nome" value={p.nome} />
        <Row label="Nascimento" value={p.dataNascimento ? `${fmtDate(p.dataNascimento)} · ${calcAge(p.dataNascimento)} anos` : null} />
        <Row label="CPF" value={p.cpf} />
        <Row label="Telefone" value={p.telefone} />
        <Row label="E-mail" value={p.email} />
        <Row label="Endereço" value={p.endereco} />
        <Row label="Convênio" value={p.convenio || 'Particular'} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <span className="text-lg">🏥</span>
          <p className={styles.cardTitle}>Histórico Médico</p>
        </div>
        <Row label="Alergias" value={p.alergias} />
        <Row label="Medicamentos" value={p.medicamentos} />
        <Row label="Condições" value={p.conds} />
        <Row label="Queixa principal" value={p.queixa} />
      </div>
    </div>
  )
}
