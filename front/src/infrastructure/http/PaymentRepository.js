import { http } from './HttpClient'

export const PaymentRepository = {
  findAll:            ()           => http.get('/payments'),
  findInadimplentes:  ()           => http.get('/payments/inadimplencia'),
  findByPatient:      (patientId)  => http.get(`/payments/patient/${patientId}`),
  create:             (data)       => http.post('/payments', data),
  remove:             (id)         => http.delete(`/payments/${id}`),
}
