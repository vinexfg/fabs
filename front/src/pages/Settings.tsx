import { useEffect, useState } from 'react'
import { SettingsRepository, TemplateRepository, BackupRepository } from '../infrastructure/http'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { ClinicSettings, Template } from '../types/entities'
import styles from './Settings.module.css'

interface PasswordForm {
  current: string
  next: string
  confirm: string
}

export default function Settings() {
  const toast = useToast()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [clinic, setClinic] = useState<ClinicSettings>({
    clinicName: '', doctorName: '', cro: '', clinicAddress: '', clinicPhone: '',
  })
  const [pw, setPw] = useState<PasswordForm>({ current: '', next: '', confirm: '' })
  const [savingClinic, setSavingClinic] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTpl, setNewTpl] = useState('')
  const [savingTpl, setSavingTpl] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [clinicSettings, templateList] = await Promise.all([SettingsRepository.find(), TemplateRepository.findAll()])
      setClinic(current => ({ ...current, ...clinicSettings }))
      setTemplates(templateList)
    } catch { toast('Erro ao carregar configurações', 'error') }
  }

  async function saveClinic(e: React.FormEvent) {
    e.preventDefault()
    setSavingClinic(true)
    try {
      await SettingsRepository.update(clinic)
      toast('Configurações salvas!', 'success')
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
    finally { setSavingClinic(false) }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw.next !== pw.confirm) { toast('As senhas não coincidem', 'error'); return }
    if (pw.next.length < 4) { toast('Senha muito curta (mínimo 4 caracteres)', 'error'); return }
    setSavingPw(true)
    try {
      await SettingsRepository.updatePassword(pw.current, pw.next)
      toast('Senha alterada!', 'success')
      setPw({ current: '', next: '', confirm: '' })
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
    finally { setSavingPw(false) }
  }

  async function addTemplate() {
    if (!newTpl.trim()) return
    setSavingTpl(true)
    try {
      const newTemplate = await TemplateRepository.create({ name: newTpl.trim() })
      setTemplates(current => [...current, newTemplate])
      setNewTpl('')
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
    finally { setSavingTpl(false) }
  }

  async function deleteTemplate(templateId: string) {
    try {
      await TemplateRepository.remove(templateId)
      setTemplates(current => current.filter(t => t.id !== templateId))
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleBackupExport() {
    try {
      const blob = await BackupRepository.exportBackup()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `backup-dentefacil-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      toast('Backup exportado!', 'success')
    } catch (error) { toast(error instanceof Error ? error.message : 'Erro', 'error') }
  }

  async function handleBackupRestore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await BackupRepository.restore(data)
      toast('Backup restaurado com sucesso!', 'success')
      loadAll()
    } catch { toast('Arquivo inválido ou erro ao restaurar', 'error') }
    event.target.value = ''
  }

  const setC = (k: keyof ClinicSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setClinic(c => ({ ...c, [k]: e.target.value }))
  const setP = (k: keyof PasswordForm) => (e: React.ChangeEvent<HTMLInputElement>) => setPw(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configurações</h1>
          <p className={styles.subtitle}>Dados do consultório e preferências</p>
        </div>
      </div>

      <form onSubmit={saveClinic} className={styles.section}>
        <h2 className={styles.sectionTitle}>Dados do Consultório</h2>
        <div className={styles.formGrid}>
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
        <div className={styles.formFooter}>
          <button type="submit" className="btn-primary" disabled={savingClinic}>
            {savingClinic ? 'Salvando...' : 'Salvar dados'}
          </button>
        </div>
      </form>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Templates de Procedimentos</h2>
        <div className={styles.templateRow}>
          <input
            className="input flex-1"
            placeholder="Nome do procedimento..."
            value={newTpl}
            onChange={e => setNewTpl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTemplate())}
          />
          <button className="btn-primary btn-sm" onClick={addTemplate} disabled={savingTpl || !newTpl.trim()}>
            + Adicionar
          </button>
        </div>
        {templates.length === 0
          ? <p className={styles.templateEmpty}>Nenhum template cadastrado.</p>
          : <div className={styles.templateList}>
              {templates.map(template => (
                <span key={template.id} className={styles.templateChip}>
                  {template.name}
                  <button className={styles.templateChipDelete} onClick={() => deleteTemplate(template.id)}>×</button>
                </span>
              ))}
            </div>
        }
      </div>

      <form onSubmit={savePassword} className={styles.section}>
        <h2 className={styles.sectionTitle}>Alterar Senha</h2>
        <div className={styles.formGap}>
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
        <div className={styles.formFooter}>
          <button type="submit" className="btn-primary" disabled={savingPw || !pw.current || !pw.next}>
            {savingPw ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </form>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Backup dos Dados</h2>
        <div className={styles.backupActions}>
          <button className="btn-secondary" onClick={handleBackupExport}>⬇️ Exportar backup</button>
          <label className="btn-secondary cursor-pointer">
            ⬆️ Restaurar backup
            <input type="file" accept=".json" className="hidden" onChange={handleBackupRestore} />
          </label>
        </div>
        <p className={styles.backupNote}>
          O backup exporta todos os dados do sistema em formato JSON. A restauração substitui todos os dados atuais.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sessão</h2>
        <button className="btn-danger" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
          Sair do sistema
        </button>
      </div>
    </div>
  )
}
