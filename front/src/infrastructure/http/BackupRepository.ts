import { http } from './HttpClient'

function getToken(): string | null {
  return localStorage.getItem('df_token')
}

export const BackupRepository = {
  async exportBackup(): Promise<Blob> {
    const token = getToken()
    const response = await fetch('/api/backup', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error('Erro ao exportar backup')
    return response.blob()
  },

  restore: (data: unknown) => http.post<{ ok: true; restored: unknown }>('/backup/restore', data),
}
