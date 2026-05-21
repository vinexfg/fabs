import React, { useState } from 'react'
import Modal from '../Modal'

const EMPTY = {
  nome: '', dataNascimento: '', cpf: '', telefone: '', email: '',
  endereco: '', convenio: '', alergias: '', medicamentos: '', conds: '', queixa: '',
}

export default function PatientForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSave() {
    if (!form.nome.trim()) return
    onSave(form)
  }

  return (
    <Modal title={initial.id ? 'Editar Paciente' : 'Novo Paciente'} onClose={onClose} onSave={handleSave}>
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
