const BASE = '/api'

function getToken() { return localStorage.getItem('df_token') }

async function req(path, opts = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem('df_token')
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro na requisição')
  }
  return res.json()
}

export const api = {
  patients: {
    list:   ()       => req('/patients'),
    get:    (id)     => req(`/patients/${id}`),
    create: (data)   => req('/patients',      { method: 'POST',   body: data }),
    update: (id, d)  => req(`/patients/${id}`, { method: 'PUT',   body: d }),
    delete: (id)     => req(`/patients/${id}`, { method: 'DELETE' }),
  },
  treatments: {
    list:         (patientId) => req(`/treatments/patient/${patientId}`),
    create:       (data)      => req('/treatments', { method: 'POST', body: data }),
    updateStatus: (id, status)=> req(`/treatments/${id}/status`, { method: 'PATCH', body: { status } }),
    delete:       (id)        => req(`/treatments/${id}`, { method: 'DELETE' }),
  },
  payments: {
    all:            ()           => req('/payments'),
    inadimplencia:  ()           => req('/payments/inadimplencia'),
    list:           (patientId)  => req(`/payments/patient/${patientId}`),
    create:         (data)       => req('/payments', { method: 'POST', body: data }),
    delete:         (id)         => req(`/payments/${id}`, { method: 'DELETE' }),
  },
  evolutions: {
    list:   (patientId) => req(`/evolutions/patient/${patientId}`),
    create: (data)      => req('/evolutions', { method: 'POST', body: data }),
    delete: (id)        => req(`/evolutions/${id}`, { method: 'DELETE' }),
  },
  appointments: {
    byDate:    (date)       => req(`/appointments?date=${date}`),
    byMonth:   (month)      => req(`/appointments?month=${month}`),
    byPatient: (patientId)  => req(`/appointments/patient/${patientId}`),
    tomorrow:  ()           => req('/appointments/tomorrow'),
    create:    (data)       => req('/appointments', { method: 'POST', body: data }),
    update:    (id, data)   => req(`/appointments/${id}`, { method: 'PUT', body: data }),
    updateStatus: (id, status) => req(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
    delete:    (id)         => req(`/appointments/${id}`, { method: 'DELETE' }),
  },
  odontograma: {
    get:    (patientId)       => req(`/odontograma/${patientId}`),
    update: (patientId, data) => req(`/odontograma/${patientId}`, { method: 'PUT', body: data }),
  },
  settings: {
    get:            ()       => req('/settings'),
    update:         (data)   => req('/settings', { method: 'PUT', body: data }),
    updatePassword: (current, next) => req('/settings/password', { method: 'PUT', body: { current, next } }),
  },
  templates: {
    list:   ()     => req('/templates'),
    create: (data) => req('/templates', { method: 'POST', body: data }),
    delete: (id)   => req(`/templates/${id}`, { method: 'DELETE' }),
  },
  backup: {
    export: async () => {
      const token = getToken()
      const res = await fetch(`${BASE}/backup`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Erro ao exportar backup')
      return res.blob()
    },
    restore: (data) => req('/backup/restore', { method: 'POST', body: data }),
  },
}
