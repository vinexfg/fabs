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
