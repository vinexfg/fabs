import { http } from './HttpClient'
import type { OdontogramaTooth } from '../../types/entities'

export interface OdontogramaInput {
  tooth: string
  status: string
  notes?: string | null
}

export const OdontogramaRepository = {
  findByPatient:  (patientId: string)                        => http.get<OdontogramaTooth[]>(`/odontograma/${patientId}`),
  update:         (patientId: string, data: OdontogramaInput) => http.put<OdontogramaTooth>(`/odontograma/${patientId}`, data),
}
