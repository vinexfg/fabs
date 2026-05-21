import { http } from './HttpClient'

export const AppointmentRepository = {
  findByDate:     (date)       => http.get(`/appointments?date=${date}`),
  findByMonth:    (month)      => http.get(`/appointments?month=${month}`),
  findByPatient:  (patientId)  => http.get(`/appointments/patient/${patientId}`),
  findTomorrow:   ()           => http.get('/appointments/tomorrow'),
  create:         (data)       => http.post('/appointments', data),
  update:         (id, data)   => http.put(`/appointments/${id}`, data),
  updateStatus:   (id, status) => http.patch(`/appointments/${id}/status`, { status }),
  remove:         (id)         => http.delete(`/appointments/${id}`),
}
