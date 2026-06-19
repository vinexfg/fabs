import { http } from './HttpClient'
import type { Payment, Inadimplente } from '../../types/entities'

export interface PaymentInput {
  patientId: string
  descricao: string
  valor: number
  data?: string | null
  forma?: string | null
}

export const PaymentRepository = {
  findAll:            ()                          => http.get<Payment[]>('/payments'),
  findInadimplentes:  ()                          => http.get<Inadimplente[]>('/payments/inadimplencia'),
  findByPatient:      (patientId: string)         => http.get<Payment[]>(`/payments/patient/${patientId}`),
  create:             (data: PaymentInput)        => http.post<Payment>('/payments', data),
  update:             (id: string, data: PaymentInput) => http.put<Payment>(`/payments/${id}`, data),
  remove:             (id: string)                => http.delete<{ ok: true }>(`/payments/${id}`),
}
