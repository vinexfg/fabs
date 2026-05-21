const FORMAS = {
  pix: 'PIX', dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito',
  convenio: 'Convênio', cheque: 'Cheque',
}

function fmtD(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function fmtR(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function calcAge(dob) {
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--
  return age
}

export function printPatientFile(patient, treatments, payments, evolutions) {
  const totalTrat = treatments.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
  const totalPago = payments.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0)
  const emAberto  = Math.max(0, totalTrat - totalPago)

  const statusLabel = { pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluído' }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ficha — ${patient.nome}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; max-width: 800px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { font-size: 20px; font-weight: 800; color: #2563eb; }
    .print-date { font-size: 11px; color: #666; }
    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; margin-bottom: 8px; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .patient-name { font-size: 20px; font-weight: 800; color: #111; margin-bottom: 4px; }
    .row { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
    .lbl { font-weight: 600; color: #6b7280; min-width: 140px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .fin-boxes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0; }
    .fin-box { padding: 8px; border-radius: 6px; text-align: center; }
    .fin-label { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .fin-value { font-size: 16px; font-weight: 800; }
    .evo { border-left: 3px solid #2563eb; padding: 8px 12px; margin-bottom: 8px; background: #f8faff; }
    .evo-date { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
    .evo-proc { font-weight: 700; margin-bottom: 4px; }
    .evo-notes { color: #374151; white-space: pre-wrap; }
    .no-print { margin-bottom: 16px; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="display:flex;gap:8px">
    <button onclick="window.print()" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700">🖨️ Imprimir</button>
    <button onclick="window.close()" style="padding:8px 16px;background:#f3f4f6;border:none;border-radius:6px;cursor:pointer">Fechar</button>
  </div>

  <div class="header">
    <div>
      <div class="logo">🦷 DenteFácil</div>
      <div class="patient-name">${patient.nome}</div>
      ${patient.telefone ? `<div style="color:#6b7280">${patient.telefone}</div>` : ''}
    </div>
    <div class="print-date">Impresso em ${new Date().toLocaleDateString('pt-BR')}</div>
  </div>

  <h2>Dados Pessoais</h2>
  ${patient.dataNascimento ? `<div class="row"><span class="lbl">Nascimento</span><span>${fmtD(patient.dataNascimento)} (${calcAge(patient.dataNascimento)} anos)</span></div>` : ''}
  ${patient.cpf ? `<div class="row"><span class="lbl">CPF</span><span>${patient.cpf}</span></div>` : ''}
  ${patient.telefone ? `<div class="row"><span class="lbl">Telefone</span><span>${patient.telefone}</span></div>` : ''}
  ${patient.email ? `<div class="row"><span class="lbl">E-mail</span><span>${patient.email}</span></div>` : ''}
  ${patient.endereco ? `<div class="row"><span class="lbl">Endereço</span><span>${patient.endereco}</span></div>` : ''}
  <div class="row"><span class="lbl">Convênio</span><span>${patient.convenio || 'Particular'}</span></div>

  ${patient.alergias || patient.medicamentos || patient.conds || patient.queixa ? `
  <h2>Histórico Médico</h2>
  ${patient.alergias ? `<div class="row"><span class="lbl">Alergias</span><span>${patient.alergias}</span></div>` : ''}
  ${patient.medicamentos ? `<div class="row"><span class="lbl">Medicamentos</span><span>${patient.medicamentos}</span></div>` : ''}
  ${patient.conds ? `<div class="row"><span class="lbl">Condições</span><span>${patient.conds}</span></div>` : ''}
  ${patient.queixa ? `<div class="row"><span class="lbl">Queixa principal</span><span>${patient.queixa}</span></div>` : ''}
  ` : ''}

  ${treatments.length > 0 ? `
  <h2>Plano de Tratamento</h2>
  <table>
    <thead><tr><th>Procedimento</th><th>Dente</th><th>Valor</th><th>Status</th></tr></thead>
    <tbody>
      ${treatments.map(t => `<tr>
        <td>${t.proc}${t.obs ? `<br><small style="color:#6b7280">${t.obs}</small>` : ''}</td>
        <td>${t.dente || '—'}</td>
        <td>${t.valor ? fmtR(t.valor) : '—'}</td>
        <td>${statusLabel[t.status] || t.status}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  <h2>Financeiro</h2>
  <div class="fin-boxes">
    <div class="fin-box" style="background:#eff6ff"><div class="fin-label" style="color:#2563eb">Total</div><div class="fin-value" style="color:#2563eb">${fmtR(totalTrat)}</div></div>
    <div class="fin-box" style="background:#f0fdf4"><div class="fin-label" style="color:#16a34a">Pago</div><div class="fin-value" style="color:#16a34a">${fmtR(totalPago)}</div></div>
    <div class="fin-box" style="background:${emAberto > 0 ? '#fef2f2' : '#f9fafb'}"><div class="fin-label" style="color:${emAberto > 0 ? '#dc2626' : '#6b7280'}">Em Aberto</div><div class="fin-value" style="color:${emAberto > 0 ? '#dc2626' : '#6b7280'}">${fmtR(emAberto)}</div></div>
  </div>
  ${payments.length > 0 ? `
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Forma</th><th>Valor</th></tr></thead>
    <tbody>
      ${payments.map(p => `<tr><td>${fmtD(p.data)}</td><td>${p.descricao}</td><td>${FORMAS[p.forma] || p.forma}</td><td style="font-weight:700;color:#16a34a">${fmtR(parseFloat(p.valor))}</td></tr>`).join('')}
    </tbody>
  </table>` : ''}

  ${evolutions.length > 0 ? `
  <h2>Histórico de Atendimentos</h2>
  ${evolutions.map(e => `
    <div class="evo">
      <div class="evo-date">${fmtD(e.data)}${e.hora ? ' · ' + e.hora : ''}</div>
      <div class="evo-proc">${e.proc}</div>
      ${e.notas ? `<div class="evo-notes">${e.notas}</div>` : ''}
      ${e.proxConsulta ? `<div style="margin-top:4px;font-size:11px;color:#2563eb">Próxima consulta: ${fmtD(e.proxConsulta)}</div>` : ''}
    </div>
  `).join('')}
  ` : ''}
</body>
</html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  w.document.write(html)
  w.document.close()
}

export function printReceita(patient, clinic, medicines, instructions) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"><title>Receituário — ${patient.nome}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; padding: 32px; max-width: 680px; margin: 0 auto; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px; }
    .clinic { font-size: 16px; font-weight: 800; color: #2563eb; }
    .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    h2 { font-size: 15px; font-weight: 800; text-align: center; margin: 20px 0 16px; letter-spacing: 0.05em; }
    .patient-box { background: #f8faff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
    .medicines { white-space: pre-wrap; font-size: 13px; line-height: 1.8; border-left: 3px solid #2563eb; padding-left: 14px; margin-bottom: 16px; }
    .instructions { font-size: 12px; color: #374151; white-space: pre-wrap; padding: 12px; background: #f9fafb; border-radius: 6px; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
    .sign { text-align: right; }
    .sign-line { width: 200px; border-top: 1px solid #374151; margin-bottom: 6px; margin-left: auto; margin-top: 40px; }
    .no-print { margin-bottom: 16px; }
    @media print { .no-print { display: none; } body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="no-print" style="display:flex;gap:8px">
    <button onclick="window.print()" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700">🖨️ Imprimir</button>
    <button onclick="window.close()" style="padding:8px 16px;background:#f3f4f6;border:none;border-radius:6px;cursor:pointer">Fechar</button>
  </div>
  <div class="header">
    <div class="clinic">🦷 ${clinic.clinicName || 'DenteFácil'}</div>
    ${clinic.doctorName ? `<div class="sub">${clinic.doctorName}${clinic.cro ? ' · ' + clinic.cro : ''}</div>` : ''}
    ${clinic.clinicAddress ? `<div class="sub">${clinic.clinicAddress}</div>` : ''}
    ${clinic.clinicPhone ? `<div class="sub">${clinic.clinicPhone}</div>` : ''}
  </div>
  <h2>RECEITUÁRIO</h2>
  <div class="patient-box">
    <strong>Paciente:</strong> ${patient.nome}
    ${patient.dataNascimento ? `&nbsp;&nbsp;·&nbsp;&nbsp;<strong>Nasc.:</strong> ${fmtD(patient.dataNascimento)}` : ''}
  </div>
  <div class="medicines">${medicines.replace(/</g, '&lt;')}</div>
  ${instructions ? `<div class="instructions"><strong>Instruções:</strong><br>${instructions.replace(/</g, '&lt;')}</div>` : ''}
  <div class="footer">
    <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
    <div class="sign">
      <div class="sign-line"></div>
      ${clinic.doctorName || 'Assinatura'}${clinic.cro ? '<br>' + clinic.cro : ''}
    </div>
  </div>
</body>
</html>`
  const w = window.open('', '_blank', 'width=800,height=650')
  w.document.write(html)
  w.document.close()
}

export function printAtestado(patient, clinic, days, reason) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"><title>Atestado — ${patient.nome}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1a1a1a; padding: 48px; max-width: 700px; margin: 0 auto; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 30px; }
    .clinic { font-size: 18px; font-weight: 800; color: #2563eb; }
    .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    h2 { font-size: 18px; font-weight: 800; text-align: center; margin: 30px 0; letter-spacing: 0.1em; }
    .body { font-size: 14px; line-height: 2; text-align: justify; }
    .highlight { font-weight: 700; }
    .footer { margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
    .sign-line { width: 220px; border-top: 1px solid #374151; margin-bottom: 6px; margin-left: auto; margin-top: 60px; }
    .no-print { margin-bottom: 16px; }
    @media print { .no-print { display: none; } body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="no-print" style="display:flex;gap:8px">
    <button onclick="window.print()" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700">🖨️ Imprimir</button>
    <button onclick="window.close()" style="padding:8px 16px;background:#f3f4f6;border:none;border-radius:6px;cursor:pointer">Fechar</button>
  </div>
  <div class="header">
    <div class="clinic">🦷 ${clinic.clinicName || 'DenteFácil'}</div>
    ${clinic.doctorName ? `<div class="sub">${clinic.doctorName}${clinic.cro ? ' · ' + clinic.cro : ''}</div>` : ''}
    ${clinic.clinicAddress ? `<div class="sub">${clinic.clinicAddress}</div>` : ''}
  </div>
  <h2>ATESTADO ODONTOLÓGICO</h2>
  <div class="body">
    Atesto para os devidos fins que o(a) paciente <span class="highlight">${patient.nome}</span>
    esteve sob meus cuidados odontológicos na data de <span class="highlight">${new Date().toLocaleDateString('pt-BR')}</span>,
    ${days && +days > 0 ? `necessitando de <span class="highlight">${days} dia${+days > 1 ? 's' : ''}</span> de repouso` : 'comparecendo para atendimento odontológico'}
    ${reason ? `, em razão de: <span class="highlight">${reason}</span>` : ''}.
  </div>
  <div style="text-align:right">
    <div class="sign-line"></div>
    ${clinic.doctorName || 'Assinatura'}${clinic.cro ? '<br>' + clinic.cro : ''}
  </div>
  <div class="footer">
    <div>${clinic.clinicAddress || ''}</div>
    <div>${new Date().toLocaleDateString('pt-BR')}</div>
  </div>
</body>
</html>`
  const w = window.open('', '_blank', 'width=800,height=650')
  w.document.write(html)
  w.document.close()
}

export function exportPaymentsCSV(patient, payments) {
  const headers = ['Data', 'Descrição', 'Forma de Pagamento', 'Valor (R$)']
  const rows = payments.map(p => [
    fmtD(p.data),
    p.descricao,
    FORMAS[p.forma] || p.forma,
    parseFloat(p.valor).toFixed(2).replace('.', ','),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `financeiro-${patient.nome.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
