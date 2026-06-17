import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import { SearchRepository } from '../infrastructure/http/SearchRepository'
import styles from './GlobalSearch.module.css'

function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function GlobalSearch() {
  const { open, setOpen } = useGlobalSearch()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState({ patients: [], evolutions: [], appointments: [] })
  const [focused, setFocused] = useState(0)
  const [searching, setSearching] = useState(false)
  const inputRef    = useRef()
  const debounceRef = useRef(null)
  const navigate    = useNavigate()

  const flat = [
    ...results.patients.map(p     => ({ type: 'patient',     item: p, patientId: p.id })),
    ...results.evolutions.map(e   => ({ type: 'evolution',   item: e, patientId: e.patientId })),
    ...results.appointments.map(a => ({ type: 'appointment', item: a, patientId: a.patientId })),
  ]

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults({ patients: [], evolutions: [], appointments: [] })
      setFocused(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current)
    if (!q.trim() || q.trim().length < 2) {
      setResults({ patients: [], evolutions: [], appointments: [] })
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(() => {
      SearchRepository.search(q)
        .then(data => { setResults(data); setFocused(0) })
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 250)
  }, [])

  useEffect(() => { search(query) }, [query, search])

  function go(patientId) { setOpen(false); navigate(`/pacientes/${patientId}`) }

  function onKey(e) {
    if (e.key === 'Escape')    { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && flat[focused]) go(flat[focused].patientId)
  }

  const hasResults = flat.length > 0

  if (!open) return null

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.box} onMouseDown={e => e.stopPropagation()} onKeyDown={onKey}>
        <div className={styles.inputRow}>
          <span className={styles.icon}>{searching ? '⏳' : '🔍'}</span>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Buscar paciente, evolução ou consulta..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className={styles.esc}>Esc</kbd>
        </div>

        {hasResults && (
          <div className={styles.results}>
            {results.patients.length > 0 && (
              <>
                <p className={styles.groupLabel}>Pacientes</p>
                {results.patients.map((p, i) => {
                  const fi = i
                  const initials = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <button
                      key={`p-${p.id}`}
                      className={`${styles.result} ${fi === focused ? styles.resultActive : ''}`}
                      onClick={() => go(p.id)}
                      onMouseEnter={() => setFocused(fi)}
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
              </>
            )}

            {results.evolutions.length > 0 && (
              <>
                <p className={styles.groupLabel}>Evoluções</p>
                {results.evolutions.map((e, i) => {
                  const fi = results.patients.length + i
                  return (
                    <button
                      key={`e-${e.id}`}
                      className={`${styles.result} ${fi === focused ? styles.resultActive : ''}`}
                      onClick={() => go(e.patientId)}
                      onMouseEnter={() => setFocused(fi)}
                    >
                      <div className={`${styles.avatar} ${styles.avatarEvo}`}>📝</div>
                      <div className={styles.info}>
                        <p className={styles.name}>{e.proc}</p>
                        <p className={styles.meta}>{e.patientNome} · {fmtDate(e.data)}</p>
                      </div>
                      <span className={styles.arrow}>→</span>
                    </button>
                  )
                })}
              </>
            )}

            {results.appointments.length > 0 && (
              <>
                <p className={styles.groupLabel}>Consultas</p>
                {results.appointments.map((a, i) => {
                  const fi = results.patients.length + results.evolutions.length + i
                  return (
                    <button
                      key={`a-${a.id}`}
                      className={`${styles.result} ${fi === focused ? styles.resultActive : ''}`}
                      onClick={() => go(a.patientId)}
                      onMouseEnter={() => setFocused(fi)}
                    >
                      <div className={`${styles.avatar} ${styles.avatarAppt}`}>📅</div>
                      <div className={styles.info}>
                        <p className={styles.name}>{a.patientNome}</p>
                        <p className={styles.meta}>{a.type} · {fmtDate(a.date)}{a.time ? ` ${a.time.slice(0, 5)}` : ''}</p>
                      </div>
                      <span className={styles.arrow}>→</span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        )}

        {query.trim().length >= 2 && !hasResults && !searching && (
          <p className={styles.empty}>Nenhum resultado para "{query}"</p>
        )}

        {(!query || query.trim().length < 2) && (
          <p className={styles.hint}>Digite ao menos 2 caracteres para buscar...</p>
        )}
      </div>
    </div>
  )
}
