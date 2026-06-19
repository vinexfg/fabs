import { http } from './HttpClient'
import type { ClinicSettings } from '../../types/entities'

export const SettingsRepository = {
  find:           ()                                               => http.get<ClinicSettings>('/settings'),
  update:         (data: Partial<ClinicSettings>)                  => http.put<{ ok: true }>('/settings', data),
  updatePassword: (currentPassword: string, nextPassword: string)  =>
    http.put<{ ok: true }>('/settings/password', { current: currentPassword, next: nextPassword }),
  getNotes:       ()                                               => http.get<{ notes: string }>('/settings/notes'),
  updateNotes:    (notes: string)                                  => http.put<{ ok: true }>('/settings/notes', { notes }),
}
