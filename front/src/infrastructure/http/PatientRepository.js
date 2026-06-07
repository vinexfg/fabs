import { http } from './HttpClient'

export const PatientRepository = {
  findAll:        ()                        => http.get('/patients'),
  findPaginated:  ({ q = '', page = 1, limit = 15 } = {}) =>
    http.get(`/patients?page=${page}&limit=${limit}&search=${encodeURIComponent(q)}`),
  findById:       (id)                      => http.get(`/patients/${id}`),
  create:         (data)                    => http.post('/patients', data),
  update:         (id, data)                => http.put(`/patients/${id}`, data),
  remove:         (id)                      => http.delete(`/patients/${id}`),
}
