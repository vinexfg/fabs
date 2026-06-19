import type { ReactNode } from 'react'
import type { Patient } from '../../types/entities'
import styles from './FichaTab.module.css'

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>
        {value || <span className={styles.rowEmpty}>—</span>}
      </span>
    </div>
  )
}

function calcAge(dob: string) {
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

function fmtDate(d: string | null) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
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
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function TagList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <span style={{ color: '#9ca3af' }}>—</span>
  return (
    <div className={styles.tagRow}>
      {items.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
    </div>
  )
}

export default function FichaTab({ patient: p }: { patient: Patient }) {
  const anamnese = parseAnamnese(p.anamnese)

  const alergiasCheck  = anamnese?.alergiasCheck  || []
  const alergiasExtra  = anamnese?.alergiasExtra  || ''
  const condsCheck     = anamnese?.condsCheck      || []
  const condsExtra     = anamnese?.condsExtra      || ''
  const medicamentos   = anamnese?.medicamentos    || p.medicamentos || ''
  const queixa         = anamnese?.queixa          || p.queixa       || ''
  const allAlergias    = [...alergiasCheck, ...(alergiasExtra ? [alergiasExtra] : [])].filter(Boolean)
  const allConds       = [...condsCheck,    ...(condsExtra    ? [condsExtra]    : [])].filter(Boolean)

  const hasAnamnese = anamnese !== null
  const hasMedicalHistory = allAlergias.length || allConds.length || medicamentos || queixa || p.alergias || p.conds

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

      {Boolean(hasMedicalHistory) && (
        <div className={styles.card}>
          <div className={styles.cardTitleRow}>
            <span className="text-lg">🏥</span>
            <p className={styles.cardTitle}>Anamnese</p>
          </div>

          {hasAnamnese ? (
            <>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Alergias</span>
                <TagList items={allAlergias} />
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Condições médicas</span>
                <TagList items={allConds} />
              </div>
              {medicamentos && <Row label="Medicamentos" value={medicamentos} />}
              {queixa       && <Row label="Queixa principal" value={queixa} />}
            </>
          ) : (
            <>
              {p.alergias     && <Row label="Alergias"          value={p.alergias} />}
              {p.medicamentos && <Row label="Medicamentos"      value={p.medicamentos} />}
              {p.conds        && <Row label="Condições"         value={p.conds} />}
              {p.queixa       && <Row label="Queixa principal"  value={p.queixa} />}
            </>
          )}
        </div>
      )}
    </div>
  )
}
