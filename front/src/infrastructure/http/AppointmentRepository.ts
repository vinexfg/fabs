import { http } from './HttpClient'
import type { Appointment } from '../../types/entities'

export interface AppointmentInput {
  patientId: string
  date: string
  time: string
  duration?: number
  type?: string
  status?: string
  notes?: string | null
}

export const AppointmentRepository = {
  findByDate:     (date: string)              => http.get<Appointment[]>(`/appointments?date=${date}`),
  findByMonth:    (month: string)             => http.get<Appointment[]>(`/appointments?month=${month}`),
  findByWeek:     (weekStart: string)         => http.get<Appointment[]>(`/appointments?week=${weekStart}`),
  findByPatient:  (patientId: string)         => http.get<Appointment[]>(`/appointments/patient/${patientId}`),
  findTomorrow:   ()                          => http.get<Appointment[]>('/appointments/tomorrow'),
  create:         (data: AppointmentInput)    => http.post<Appointment>('/appointments', data),
  update:         (id: string, data: AppointmentInput) => http.put<Appointment>(`/appointments/${id}`, data),
  updateStatus:   (id: string, status: string) => http.patch<Appointment>(`/appointments/${id}/status`, { status }),
  remove:         (id: string)                => http.delete<{ ok: true }>(`/appointments/${id}`),
}
