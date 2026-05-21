import { http } from './HttpClient'

export const OdontogramaRepository = {
  findByPatient:  (patientId)        => http.get(`/odontograma/${patientId}`),
  update:         (patientId, data)  => http.put(`/odontograma/${patientId}`, data),
}
