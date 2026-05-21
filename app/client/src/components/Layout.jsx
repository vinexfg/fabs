import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const links = [
  { to: '/',          label: 'Dashboard', icon: '📊', end: true },
  { to: '/agenda',    label: 'Agenda',    icon: '📅' },
  { to: '/pacientes', label: 'Pacientes', icon: '👥' },
]

export default function Layout({ children }) {
  const { dark, toggle } = useTheme()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed top-0 left-0 h-screen z-20 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-lg shadow-md shadow-blue-500/30">
              🦷
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">DenteFácil</h1>
              <p className="text-xs text-slate-400">Gestão de Pacientes</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-2">Menu</p>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-all duration-150
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-150"
          >
            <span className="text-base">{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-6 min-h-screen">{children}</main>
    </div>
  )
}
