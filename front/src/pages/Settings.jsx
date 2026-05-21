import React, { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const toast = useToast()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [clinic, setClinic] = useState({
    clinicName: '', doctorName: '', cro: '', clinicAddress: '', clinicPhone: '',
  })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [savingClinic, setSavingClinic] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const [templates, setTemplates] = useState([])
  const [newTpl, setNewTpl] = useState('')
  const [savingTpl, setSavingTpl] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [s, t] = await Promise.all([api.settings.get(), api.templates.list()])
      setClinic(c => ({ ...c, ...s }))
      setTemplates(t)
    } catch { toast('Erro ao carregar configurações', 'error') }
  }

  async function saveClinic(e) {
    e.preventDefault()
    setSavingClinic(true)
    try {
      await api.settings.update(clinic)
      toast('Configurações salvas!', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setSavingClinic(false) }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pw.next !== pw.confirm) { toast('As senhas não coincidem', 'error'); return }
    if (pw.next.length < 4) { toast('Senha muito curta (mínimo 4 caracteres)', 'error'); return }
    setSavingPw(true)
    try {
      await api.settings.updatePassword(pw.current, pw.next)
      toast('Senha alterada!', 'success')
      setPw({ current: '', next: '', confirm: '' })
    } catch (err) { toast(err.message, 'error') }
    finally { setSavingPw(false) }
  }

  async function addTemplate() {
    if (!newTpl.trim()) return
    setSavingTpl(true)
    try {
      const t = await api.templates.create({ name: newTpl.trim() })
      setTemplates(ts => [...ts, t])
      setNewTpl('')
    } catch (err) { toast(err.message, 'error') }
    finally { setSavingTpl(false) }
  }

  async function deleteTemplate(id) {
    try {
      await api.templates.delete(id)
      setTemplates(ts => ts.filter(t => t.id !== id))
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleBackupExport() {
    try {
      const blob = await api.backup.export()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-dentefacil-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast('Backup exportado!', 'success')
    } catch (err) { toast(err.message, 'error') }
  }

  async function handleBackupRestore(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await api.backup.restore(data)
      toast('Backup restaurado com sucesso!', 'success')
      loadAll()
    } catch { toast('Arquivo inválido ou erro ao restaurar', 'error') }
    e.target.value = ''
  }

  const setC = k => e => setClinic(c => ({ ...c, [k]: e.target.value }))
  const setP = k => e => setPw(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-sm text-slate-400 mt-0.5">Dados do consultório e preferências</p>
        </div>
      </div>

      {/* Clinic info */}
      <form onSubmit={saveClinic} className="card p-6 mb-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Dados do Consultório</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome do consultório</label>
            <input className="input mt-1.5" value={clinic.clinicName} onChange={setC('clinicName')} placeholder="Ex: Clínica Sorriso" />
          </div>
          <div>
            <label className="label">Nome do dentista</label>
            <input className="input mt-1.5" value={clinic.doctorName} onChange={setC('doctorName')} placeholder="Dr. Nome Sobrenome" />
          </div>
          <div>
            <label className="label">CRO</label>
            <input className="input mt-1.5" value={clinic.cro} onChange={setC('cro')} placeholder="CRO/SP 00000" />
          </div>
          <div className="col-span-2">
            <label className="label">Endereço</label>
            <input className="input mt-1.5" value={clinic.clinicAddress} onChange={setC('clinicAddress')} placeholder="Rua, número, cidade..." />
          </div>
          <div>
            <label className="label">Telefone do consultório</label>
            <input className="input mt-1.5" value={clinic.clinicPhone} onChange={setC('clinicPhone')} placeholder="(11) 99999-9999" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="btn-primary" disabled={savingClinic}>
            {savingClinic ? 'Salvando...' : 'Salvar dados'}
          </button>
        </div>
      </form>

      {/* Templates */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Templates de Procedimentos</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="Nome do procedimento..."
            value={newTpl}
            onChange={e => setNewTpl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTemplate())}
          />
          <button className="btn-primary btn-sm" onClick={addTemplate} disabled={savingTpl || !newTpl.trim()}>+ Adicionar</button>
        </div>
        {templates.length === 0
          ? <p className="text-sm text-slate-400 text-center py-4">Nenhum template cadastrado.</p>
          : <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {t.name}
                  <button onClick={() => deleteTemplate(t.id)} className="text-slate-400 hover:text-red-500 transition-colors leading-none">×</button>
                </span>
              ))}
            </div>
        }
      </div>

      {/* Change password */}
      <form onSubmit={savePassword} className="card p-6 mb-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Alterar Senha</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Senha atual</label>
            <input className="input mt-1.5" type="password" value={pw.current} onChange={setP('current')} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Nova senha</label>
            <input className="input mt-1.5" type="password" value={pw.next} onChange={setP('next')} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input className="input mt-1.5" type="password" value={pw.confirm} onChange={setP('confirm')} placeholder="••••••••" />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="btn-primary" disabled={savingPw || !pw.current || !pw.next}>
            {savingPw ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </form>

      {/* Backup */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Backup dos Dados</h2>
        <div className="flex gap-3 flex-wrap">
          <button className="btn-secondary" onClick={handleBackupExport}>⬇️ Exportar backup</button>
          <label className="btn-secondary cursor-pointer">
            ⬆️ Restaurar backup
            <input type="file" accept=".json" className="hidden" onChange={handleBackupRestore} />
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-3">O backup exporta todos os dados do sistema em formato JSON. A restauração substitui todos os dados atuais.</p>
      </div>

      {/* Logout */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Sessão</h2>
        <button
          className="btn-danger"
          onClick={() => { logout(); navigate('/login', { replace: true }) }}
        >
          Sair do sistema
        </button>
      </div>
    </div>
  )
}
