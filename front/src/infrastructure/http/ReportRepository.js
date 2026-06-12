import { http } from './HttpClient'

export const ReportRepository = {
  find: () => http.get('/reports'),
}
