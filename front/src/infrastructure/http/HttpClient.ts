const BASE_URL = '/api'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
}

function getToken(): string | null {
  return localStorage.getItem('df_token')
}

function buildHeaders(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: buildHeaders(),
    method: options.method,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    localStorage.removeItem('df_token')
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(error.error || 'Erro na requisição')
  }

  return response.json() as Promise<T>
}

export const http = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST',   body }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT',    body }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body }),
  delete: <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
}
