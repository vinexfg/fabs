import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>🦷</div>
          <h1 className={styles.title}>DenteFácil</h1>
          <p className={styles.subtitle}>Gestão de Pacientes</p>
        </div>

        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <label className="label">Senha de acesso</label>
              <input
                className="input mt-1.5"
                type="password"
                placeholder="Digite sua senha..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading || !password}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className={styles.hint}>
          Senha padrão: <span className="font-semibold">1234</span>
        </p>
      </div>
    </div>
  )
}
