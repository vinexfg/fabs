import { http } from './HttpClient'

function getToken() {
  return localStorage.getItem('df_token')
}

export const BackupRepository = {
  async exportBackup() {
    const token = getToken()
    const response = await fetch('/api/backup', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error('Erro ao exportar backup')
    return response.blob()
  },

  restore: (data) => http.post('/backup/restore', data),
}
