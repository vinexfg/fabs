import { http } from './HttpClient'

export const TemplateRepository = {
  findAll:  ()      => http.get('/templates'),
  create:   (data)  => http.post('/templates', data),
  remove:   (id)    => http.delete(`/templates/${id}`),
}
