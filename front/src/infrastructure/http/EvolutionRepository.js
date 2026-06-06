import { http } from './HttpClient'

export const EvolutionRepository = {
  findByPatient:  (patientId)  => http.get(`/evolutions/patient/${patientId}`),
  create:         (data)       => http.post('/evolutions', data),
  update:         (id, data)   => http.put(`/evolutions/${id}`, data),
  remove:         (id)         => http.delete(`/evolutions/${id}`),
}
