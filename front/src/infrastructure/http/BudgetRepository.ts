import { http } from './HttpClient'
import type { Budget, BudgetItem } from '../../types/entities'

export interface BudgetInput {
  patientId: string
  items?: BudgetItem[]
  desconto?: number
  obs?: string
  status?: string
}

export const BudgetRepository = {
  findByPatient:  (patientId: string)          => http.get<Budget[]>(`/budgets/patient/${patientId}`),
  create:         (data: BudgetInput)          => http.post<Budget>('/budgets', data),
  update:         (id: string, data: BudgetInput) => http.put<Budget>(`/budgets/${id}`, data),
  updateStatus:   (id: string, status: string) => http.patch<Budget>(`/budgets/${id}/status`, { status }),
  remove:         (id: string)                 => http.delete<{ ok: true }>(`/budgets/${id}`),
}
