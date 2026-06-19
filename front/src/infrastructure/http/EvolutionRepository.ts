import { http } from './HttpClient'
import type { Evolution } from '../../types/entities'

export interface EvolutionInput {
  patientId: string
  proc: string
  data?: string | null
  hora?: string | null
  notas?: string | null
  proxConsulta?: string | null
}

export const EvolutionRepository = {
  findByPatient:  (patientId: string)             => http.get<Evolution[]>(`/evolutions/patient/${patientId}`),
  create:         (data: EvolutionInput)          => http.post<Evolution>('/evolutions', data),
  update:         (id: string, data: EvolutionInput) => http.put<Evolution>(`/evolutions/${id}`, data),
  remove:         (id: string)                    => http.delete<{ ok: true }>(`/evolutions/${id}`),
}
