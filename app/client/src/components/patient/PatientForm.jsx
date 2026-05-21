import React, { useState, useRef } from 'react'
import Modal from '../Modal'

const EMPTY = {
  nome: '', dataNascimento: '', cpf: '', telefone: '', email: '',
  endereco: '', convenio: '', alergias: '', medicamentos: '', conds: '', queixa: '', foto: '',
}

function resizeImage(file, maxSize = 200) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = url
  })
}

export default function PatientForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const fileRef = useRef()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await resizeImage(file)
    setForm(f => ({ ...f, foto: base64 }))
  }

  function handleSave() {
    if (!form.nome.trim()) return
    onSave(form)
  }

  return (
    <Modal title={initial.id ? 'Editar Paciente' : 'Novo Paciente'} onClose={onClose} onSave={handleSave}>
      {/* Photo */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 transition-colors"
          onClick={() => fileRef.current.click()}
        >
          {form.foto
            ? <img src={form.foto} alt="Foto" className="w-full h-full object-cover" />
            : <span className="text-2xl text-slate-400">📷</span>
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Foto do paciente</p>
          <button
            type="button"
            className="text-xs text-blue-500 hover:text-blue-600 font-semibold mt-1 transition-colors"
            onClick={() => fileRef.current.click()}
          >
            {form.foto ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {form.foto && (
            <button
              type="button"
              className="text-xs text-red-400 hover:text-red-500 font-semibold mt-1 ml-3 transition-colors"
              onClick={() => setForm(f => ({ ...f, foto: '' }))}
            >
              Remover
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="my-5 border-t border-slate-100 dark:border-slate-800" />
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Histórico Médico</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Alergias</label>
          <input className="input mt-1.5" value={form.alergias} onChange={set('alergias')} placeholder="Anestésico, penicilina..." />
        </div>
        <div className="col-span-2">
          <label className="label">Medicamentos em uso</label>
          <input className="input mt-1.5" value={form.medicamentos} onChange={set('medicamentos')} />
        </div>
        <div className="col-span-2">
          <label className="label">Condições médicas</label>
          <textarea className="input mt-1.5 resize-none" rows={2} value={form.conds} onChange={set('conds')} placeholder="Diabetes, hipertensão..." />
        </div>
        <div className="col-span-2">
          <label className="label">Queixa principal</label>
          <input className="input mt-1.5" value={form.queixa} onChange={set('queixa')} placeholder="Motivo da consulta..." />
        </div>
      </div>
    </Modal>
  )
}
