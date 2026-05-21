import React from 'react'

function Row({ label, value }) {
  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-36 shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">{value || <span className="text-slate-300 dark:text-slate-600">—</span>}</span>
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
    <div className="grid grid-cols-1 gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">👤</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Dados Pessoais</p>
        </div>
        <Row label="Nome" value={p.nome} />
        <Row label="Nascimento" value={p.dataNascimento ? `${fmtDate(p.dataNascimento)} · ${calcAge(p.dataNascimento)} anos` : null} />
        <Row label="CPF" value={p.cpf} />
        <Row label="Telefone" value={p.telefone} />
        <Row label="E-mail" value={p.email} />
        <Row label="Endereço" value={p.endereco} />
        <Row label="Convênio" value={p.convenio || 'Particular'} />
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🏥</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Histórico Médico</p>
        </div>
        <Row label="Alergias" value={p.alergias} />
        <Row label="Medicamentos" value={p.medicamentos} />
        <Row label="Condições" value={p.conds} />
        <Row label="Queixa principal" value={p.queixa} />
      </div>
    </div>
  )
}
