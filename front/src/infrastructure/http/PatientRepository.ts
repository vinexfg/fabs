import { http } from './HttpClient'
import type { Patient, PaginatedPatients } from '../../types/entities'

export interface PatientInput {
  nome: string
  dataNascimento?: string | null
  cpf?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  convenio?: string | null
  alergias?: string | null
  medicamentos?: string | null
  conds?: string | null
  queixa?: string | null
  foto?: string | null
  anamnese?: string | null
}

export const PatientRepository = {
  findAll:        ()                                              => http.get<Patient[]>('/patients'),
  findPaginated:  ({ q = '', page = 1, limit = 15 } = {})          =>
    http.get<PaginatedPatients>(`/patients?page=${page}&limit=${limit}&search=${encodeURIComponent(q)}`),
  findById:       (id: string)                                    => http.get<Patient>(`/patients/${id}`),
  create:         (data: PatientInput)                            => http.post<Patient>('/patients', data),
  update:         (id: string, data: PatientInput)                => http.put<Patient>(`/patients/${id}`, data),
  remove:         (id: string)                                    => http.delete<{ ok: true }>(`/patients/${id}`),
}
