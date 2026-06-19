import { http } from './HttpClient'

export interface TopProcedure {
  proc: string
  count: number
  total: number
  avg: number
}

export interface AgendaPorMes {
  mes: string
  total: number
  realizados: number
  cancelados: number
  faltou: number
  agendados: number
}

export interface PacientesPorMes {
  mes: string
  novos: number
}

export interface ReportStats {
  procedimentos: TopProcedure[]
  agendaPorMes: AgendaPorMes[]
  pacientesPorMes: PacientesPorMes[]
}

export const ReportRepository = {
  find: () => http.get<ReportStats>('/reports'),
}
