import { http } from './HttpClient'

export const SearchRepository = {
  search: (q) => http.get(`/search?q=${encodeURIComponent(q)}`),
}
