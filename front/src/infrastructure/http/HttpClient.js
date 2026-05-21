const BASE_URL = '/api'

function getToken() {
  return localStorage.getItem('df_token')
}

function buildHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: buildHeaders(),
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    localStorage.removeItem('df_token')
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Erro na requisição')
  }

  return response.json()
}

export const http = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body }),
  put:    (path, body)  => request(path, { method: 'PUT',    body }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body }),
  delete: (path)        => request(path, { method: 'DELETE' }),
}
