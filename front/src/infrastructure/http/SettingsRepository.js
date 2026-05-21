import { http } from './HttpClient'

export const SettingsRepository = {
  find:           ()                       => http.get('/settings'),
  update:         (data)                   => http.put('/settings', data),
  updatePassword: (currentPassword, nextPassword) => http.put('/settings/password', { current: currentPassword, next: nextPassword }),
}
