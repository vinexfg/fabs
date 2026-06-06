import { http } from './HttpClient'

export const BudgetRepository = {
  findByPatient:  (patientId)  => http.get(`/budgets/patient/${patientId}`),
  create:         (data)       => http.post('/budgets', data),
  update:         (id, data)   => http.put(`/budgets/${id}`, data),
  updateStatus:   (id, status) => http.patch(`/budgets/${id}/status`, { status }),
  remove:         (id)         => http.delete(`/budgets/${id}`),
}
