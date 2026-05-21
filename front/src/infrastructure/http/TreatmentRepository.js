import { http } from './HttpClient'

export const TreatmentRepository = {
  findByPatient:  (patientId)       => http.get(`/treatments/patient/${patientId}`),
  create:         (data)            => http.post('/treatments', data),
  updateStatus:   (id, status)      => http.patch(`/treatments/${id}/status`, { status }),
  remove:         (id)              => http.delete(`/treatments/${id}`),
}
