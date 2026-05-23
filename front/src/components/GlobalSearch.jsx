import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import { PatientRepository } from '../infrastructure/http'
import styles from './GlobalSearch.module.css'

export default function GlobalSearch() {
  const { open, setOpen } = useGlobalSearch()
  const [query, setQuery]     = useState('')
  const [all, setAll]         = useState([])
  const [results, setResults] = useState([])
  const [focused, setFocused] = useState(0)
  const inputRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    PatientRepository.findAll().then(setAll).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setFocused(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.toLowerCase()
    setResults(
      all.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        (p.telefone || '').includes(query) ||
        (p.cpf || '').replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      ).slice(0, 7)
    )
    setFocused(0)
  }, [query, all])

  function go(id) { setOpen(false); navigate(`/pacientes/${id}`) }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && results[focused]) go(results[focused].id)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.box} onMouseDown={e => e.stopPropagation()}>
        <div className={styles.inputRow}>
          <span className={styles.icon}>🔍</span>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Buscar paciente por nome, telefone ou CPF..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className={styles.esc}>Esc</kbd>
        </div>

        {results.length > 0 && (
          <div className={styles.results}>
            {results.map((p, i) => {
              const initials = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button
                  key={p.id}
                  className={`${styles.result} ${i === focused ? styles.resultActive : ''}`}
                  onClick={() => go(p.id)}
                  onMouseEnter={() => setFocused(i)}
                >
                  <div className={styles.avatar}>{initials}</div>
                  <div className={styles.info}>
                    <p className={styles.name}>{p.nome}</p>
                    <p className={styles.meta}>{p.telefone || 'Sem telefone'}{p.convenio ? ` · ${p.convenio}` : ''}</p>
                  </div>
                  <span className={styles.arrow}>→</span>
                </button>
              )
            })}
          </div>
        )}

        {query && results.length === 0 && (
          <p className={styles.empty}>Nenhum paciente encontrado para "{query}"</p>
        )}

        {!query && (
          <p className={styles.hint}>Digite para buscar pacientes...</p>
        )}
      </div>
    </div>
  )
}
