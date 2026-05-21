const BASE = '/api'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
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
    create: (data)   => req('/patients',     { method: 'POST',   body: data }),
    update: (id, d)  => req(`/patients/${id}`, { method: 'PUT', body: d }),
    delete: (id)     => req(`/patients/${id}`, { method: 'DELETE' }),
  },
  treatments: {
    list:         (patientId) => req(`/treatments/patient/${patientId}`),
    create:       (data)      => req('/treatments', { method: 'POST', body: data }),
    updateStatus: (id, status)=> req(`/treatments/${id}/status`, { method: 'PATCH', body: { status } }),
    delete:       (id)        => req(`/treatments/${id}`, { method: 'DELETE' }),
  },
  payments: {
    list:   (patientId) => req(`/payments/patient/${patientId}`),
    create: (data)      => req('/payments', { method: 'POST', body: data }),
    delete: (id)        => req(`/payments/${id}`, { method: 'DELETE' }),
  },
  evolutions: {
    list:   (patientId) => req(`/evolutions/patient/${patientId}`),
    create: (data)      => req('/evolutions', { method: 'POST', body: data }),
    delete: (id)        => req(`/evolutions/${id}`, { method: 'DELETE' }),
  },
  appointments: {
    byDate:  (date)      => req(`/appointments?date=${date}`),
    byMonth: (month)     => req(`/appointments?month=${month}`),
    create:  (data)      => req('/appointments', { method: 'POST', body: data }),
    update:  (id, data)  => req(`/appointments/${id}`, { method: 'PUT', body: data }),
    updateStatus: (id, status) => req(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
    delete:  (id)        => req(`/appointments/${id}`, { method: 'DELETE' }),
  },
  odontograma: {
    get:    (patientId)        => req(`/odontograma/${patientId}`),
    update: (patientId, data)  => req(`/odontograma/${patientId}`, { method: 'PUT', body: data }),
  },
}
