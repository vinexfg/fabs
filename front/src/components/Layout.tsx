import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useGlobalSearch } from '../context/GlobalSearchContext'
import GlobalSearch from './GlobalSearch'
import styles from './Layout.module.css'

const links: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/',           label: 'Dashboard',  icon: '📊', end: true },
  { to: '/agenda',     label: 'Agenda',     icon: '📅' },
  { to: '/pacientes',  label: 'Pacientes',  icon: '👥' },
  { to: '/relatorios', label: 'Relatórios', icon: '💰' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { dark, toggle } = useTheme()
  const { logout } = useAuth()
  const { setOpen: openSearch } = useGlobalSearch()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function closeMobile() {
    setMobileOpen(false)
  }

  return (
    <div className={styles.root}>
      <GlobalSearch />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={closeMobile} />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoSection}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>🦷</div>
            <div className={styles.logoText}>
              <h1 className={styles.logoTitle}>DenteFácil</h1>
              <p className={styles.logoSubtitle}>Gestão de Pacientes</p>
            </div>
            <button className={styles.closeMobileBtn} onClick={closeMobile}>✕</button>
          </div>
        </div>

        <button className={styles.searchBtn} onClick={() => { openSearch(true); closeMobile() }}>
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
              onClick={closeMobile}
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
            onClick={closeMobile}
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

      <main className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.mobileTopBar}>
          <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
            <span /><span /><span />
          </button>
          <div className={styles.mobileLogoRow}>
            <div className={styles.logoIcon}>🦷</div>
            <span className={styles.logoTitle}>DenteFácil</span>
          </div>
          <button className={styles.mobileSearchBtn} onClick={() => openSearch(true)}>🔍</button>
        </div>
        {children}
      </main>
    </div>
  )
}
