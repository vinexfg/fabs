import { http } from './HttpClient'
import type { Template } from '../../types/entities'

export interface TemplateInput {
  name: string
  valor?: number
  obs?: string | null
}

export const TemplateRepository = {
  findAll:  ()                    => http.get<Template[]>('/templates'),
  create:   (data: TemplateInput) => http.post<Template>('/templates', data),
  remove:   (id: string)          => http.delete<{ ok: true }>(`/templates/${id}`),
}
