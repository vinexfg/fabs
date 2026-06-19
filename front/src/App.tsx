import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { GlobalSearchProvider } from './context/GlobalSearchContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Pacientes from './pages/Pacientes'
import PatientDetail from './pages/PatientDetail'
import Relatorios from './pages/Relatorios'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ConfirmProvider>
            <GlobalSearchProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/"           element={<Dashboard />} />
                        <Route path="/agenda"     element={<Agenda />} />
                        <Route path="/pacientes"  element={<Pacientes />} />
                        <Route path="/pacientes/:id" element={<PatientDetail />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/settings"   element={<Settings />} />
                        <Route path="*"           element={<Navigate to="/" />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            </GlobalSearchProvider>
          </ConfirmProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
