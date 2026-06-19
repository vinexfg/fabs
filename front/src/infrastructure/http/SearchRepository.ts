import { http } from './HttpClient'

export interface SearchPatientResult {
  id: string
  nome: string
  telefone: string | null
  cpf: string | null
  convenio: string | null
}

export interface SearchEvolutionResult {
  id: string
  proc: string
  data: string | null
  notas: string | null
  patientId: string
  patientNome: string
}

export interface SearchAppointmentResult {
  id: string
  date: string
  time: string
  type: string
  status: string
  patientId: string
  patientNome: string
}

export interface SearchResults {
  patients: SearchPatientResult[]
  evolutions: SearchEvolutionResult[]
  appointments: SearchAppointmentResult[]
}

export const SearchRepository = {
  search: (q: string) => http.get<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
}
