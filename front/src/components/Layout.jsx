import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import GlobalSearch from './GlobalSearch'
import styles from './Layout.module.css'

const links = [
  { to: '/',           label: 'Dashboard',  icon: '📊', end: true },
  { to: '/agenda',     label: 'Agenda',     icon: '📅' },
  { to: '/pacientes',  label: 'Pacientes',  icon: '👥' },
  { to: '/relatorios', label: 'Relatórios', icon: '💰' },
]

export default function Layout({ children }) {
  const { dark, toggle } = useTheme()
  const { logout } = useAuth()
  const { setOpen: openSearch } = useGlobalSearch()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.root}>
      <GlobalSearch />
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>🦷</div>
            <div>
              <h1 className={styles.logoTitle}>DenteFácil</h1>
              <p className={styles.logoSubtitle}>Gestão de Pacientes</p>
            </div>
          </div>
        </div>

        <button className={styles.searchBtn} onClick={() => openSearch(true)}>
          <span>🔍</span>
          <span className={styles.searchBtnText}>Buscar...</span>
          <kbd className={styles.searchKbd}>Ctrl K</kbd>
        </button>

        <nav className={styles.nav}>
          <p className={styles.navSectionLabel}>Menu</p>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
            >
              <span>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.bottomSection}>
          <NavLink
            to="/settings"
            className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}
          >
            <span>⚙️</span>
            Configurações
          </NavLink>
          <button className={styles.bottomBtn} onClick={toggle}>
            <span>{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>🚪</span>
            Sair
          </button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  )
}
