import { http } from './HttpClient'

export const EvolutionRepository = {
  findByPatient:  (patientId)  => http.get(`/evolutions/patient/${patientId}`),
  create:         (data)       => http.post('/evolutions', data),
  remove:         (id)         => http.delete(`/evolutions/${id}`),
}
