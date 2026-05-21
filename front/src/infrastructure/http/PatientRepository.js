import { http } from './HttpClient'

export const PatientRepository = {
  findAll:  ()           => http.get('/patients'),
  findById: (id)         => http.get(`/patients/${id}`),
  create:   (data)       => http.post('/patients', data),
  update:   (id, data)   => http.put(`/patients/${id}`, data),
  remove:   (id)         => http.delete(`/patients/${id}`),
}
