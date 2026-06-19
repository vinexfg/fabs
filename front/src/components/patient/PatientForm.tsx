import { useState, useRef } from 'react'
import Modal from '../Modal'
import type { Patient } from '../../types/entities'
import styles from './PatientForm.module.css'

const ALERGIAS_OPTS = ['Anestésico local', 'Penicilina / Amoxicilina', 'AAS / Aspirina', 'Anti-inflamatórios', 'Látex', 'Dipirona', 'Sulfas']
const CONDS_OPTS    = ['Diabetes', 'Hipertensão', 'Cardiopatia', 'Marca-passo', 'Gravidez', 'HIV/AIDS', 'Hepatite B ou C', 'Epilepsia', 'Osteoporose', 'Asma', 'Distúrbio de coagulação', 'Uso de bisfosfonatos']

interface PatientFormState {
  nome: string
  dataNascimento: string
  cpf: string
  telefone: string
  email: string
  endereco: string
  convenio: string
  alergias: string
  medicamentos: string
  conds: string
  queixa: string
  foto: string
  id?: string
}

const EMPTY: PatientFormState = {
  nome: '', dataNascimento: '', cpf: '', telefone: '', email: '',
  endereco: '', convenio: '', alergias: '', medicamentos: '', conds: '', queixa: '', foto: '',
}

interface Anamnese {
  alergiasCheck: string[]
  condsCheck: string[]
  alergiasExtra: string
  condsExtra: string
  medicamentos: string
  queixa: string
}

const EMPTY_ANAMNESE: Anamnese = { alergiasCheck: [], condsCheck: [], alergiasExtra: '', condsExtra: '', medicamentos: '', queixa: '' }

function parseAnamnese(raw: string | null | undefined): Anamnese {
  if (!raw) return { ...EMPTY_ANAMNESE }
  try { return { ...EMPTY_ANAMNESE, ...JSON.parse(raw) } } catch { return { ...EMPTY_ANAMNESE } }
}

function resizeImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = url
  })
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={styles.checkLabel}>
      <input type="checkbox" className={styles.checkInput} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  )
}

interface PatientFormProps {
  initial?: Partial<Patient>
  onSave: (data: PatientFormState & { anamnese: string }) => void
  onClose: () => void
}

export default function PatientForm({ initial = {}, onSave, onClose }: PatientFormProps) {
  const [form, setForm]         = useState<PatientFormState>({ ...EMPTY, ...initial } as PatientFormState)
  const [anamnese, setAnamnese] = useState<Anamnese>(() => parseAnamnese(initial.anamnese))
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof PatientFormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleCheck(field: 'alergiasCheck' | 'condsCheck', val: string) {
    setAnamnese(a => {
      const list = a[field] || []
      return { ...a, [field]: list.includes(val) ? list.filter(x => x !== val) : [...list, val] }
    })
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await resizeImage(file)
    setForm(f => ({ ...f, foto: base64 }))
  }

  function handleSave() {
    if (!form.nome.trim()) return
    // Monta os campos de texto legados a partir da anamnese estruturada
    const alergiasText = [...(anamnese.alergiasCheck || []), anamnese.alergiasExtra].filter(Boolean).join(', ')
    const condsText    = [...(anamnese.condsCheck    || []), anamnese.condsExtra   ].filter(Boolean).join(', ')
    onSave({
      ...form,
      alergias:     alergiasText || form.alergias,
      medicamentos: anamnese.medicamentos || form.medicamentos,
      conds:        condsText    || form.conds,
      queixa:       anamnese.queixa       || form.queixa,
      anamnese:     JSON.stringify(anamnese),
    })
  }

  return (
    <Modal title={initial.id ? 'Editar Paciente' : 'Novo Paciente'} onClose={onClose} onSave={handleSave}>
      <div className={styles.photoRow}>
        <div className={styles.photoTrigger} onClick={() => fileRef.current?.click()}>
          {form.foto
            ? <img src={form.foto} alt="Foto" className={styles.photoImg} />
            : <span className={styles.photoPlaceholder}>📷</span>
          }
        </div>
        <div>
          <p className={styles.photoLabel}>Foto do paciente</p>
          <button type="button" className={styles.photoChangeBtn} onClick={() => fileRef.current?.click()}>
            {form.foto ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {form.foto && (
            <button type="button" className={styles.photoRemoveBtn} onClick={() => setForm(f => ({ ...f, foto: '' }))}>
              Remover
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className={styles.formGrid}>
        <div className="col-span-2">
          <label className="label">Nome completo *</label>
          <input className="input mt-1.5" value={form.nome} onChange={set('nome')} placeholder="Nome do paciente" />
        </div>
        <div>
          <label className="label">Data de Nascimento</label>
          <input className="input mt-1.5" type="date" value={form.dataNascimento} onChange={set('dataNascimento')} />
        </div>
        <div>
          <label className="label">CPF</label>
          <input className="input mt-1.5" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input mt-1.5" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input mt-1.5" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="col-span-2">
          <label className="label">Endereço</label>
          <input className="input mt-1.5" value={form.endereco} onChange={set('endereco')} />
        </div>
        <div>
          <label className="label">Convênio</label>
          <input className="input mt-1.5" value={form.convenio} onChange={set('convenio')} placeholder="Particular / nome..." />
        </div>
      </div>

      <div className={styles.divider} />
      <p className={styles.sectionLabel}>Anamnese</p>

      <div className={styles.anamneseSection}>
        <p className={styles.anamneseGroup}>Alergias conhecidas</p>
        <div className={styles.checkGrid}>
          {ALERGIAS_OPTS.map(opt => (
            <Checkbox
              key={opt} label={opt}
              checked={(anamnese.alergiasCheck || []).includes(opt)}
              onChange={() => toggleCheck('alergiasCheck', opt)}
            />
          ))}
        </div>
        <input
          className="input mt-2"
          value={anamnese.alergiasExtra || ''}
          onChange={e => setAnamnese(a => ({ ...a, alergiasExtra: e.target.value }))}
          placeholder="Outras alergias..."
        />

        <p className={`${styles.anamneseGroup} mt-4`}>Condições médicas</p>
        <div className={styles.checkGrid}>
          {CONDS_OPTS.map(opt => (
            <Checkbox
              key={opt} label={opt}
              checked={(anamnese.condsCheck || []).includes(opt)}
              onChange={() => toggleCheck('condsCheck', opt)}
            />
          ))}
        </div>
        <input
          className="input mt-2"
          value={anamnese.condsExtra || ''}
          onChange={e => setAnamnese(a => ({ ...a, condsExtra: e.target.value }))}
          placeholder="Outras condições..."
        />

        <div className="mt-4">
          <label className="label">Medicamentos em uso</label>
          <input
            className="input mt-1.5"
            value={anamnese.medicamentos || ''}
            onChange={e => setAnamnese(a => ({ ...a, medicamentos: e.target.value }))}
            placeholder="Nome, dosagem..."
          />
        </div>

        <div className="mt-3">
          <label className="label">Queixa principal</label>
          <input
            className="input mt-1.5"
            value={anamnese.queixa || ''}
            onChange={e => setAnamnese(a => ({ ...a, queixa: e.target.value }))}
            placeholder="Motivo da consulta..."
          />
        </div>
      </div>
    </Modal>
  )
}
