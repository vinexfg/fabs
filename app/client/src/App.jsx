import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Pacientes from './pages/Pacientes'
import PatientDetail from './pages/PatientDetail'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/:id" element={<PatientDetail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </ThemeProvider>
  )
}
