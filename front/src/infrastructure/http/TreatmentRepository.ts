import { http } from './HttpClient'
import type { Treatment } from '../../types/entities'

export interface TreatmentInput {
  patientId: string
  proc: string
  dente?: string | null
  valor?: number
  status?: string
  obs?: string | null
}

export const TreatmentRepository = {
  findByPatient:  (patientId: string)          => http.get<Treatment[]>(`/treatments/patient/${patientId}`),
  create:         (data: TreatmentInput)       => http.post<Treatment>('/treatments', data),
  updateStatus:   (id: string, status: string) => http.patch<Treatment>(`/treatments/${id}/status`, { status }),
  remove:         (id: string)                 => http.delete<{ ok: true }>(`/treatments/${id}`),
}
